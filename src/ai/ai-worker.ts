import { CityCore } from "@/core/city";
import { PassableArea } from "@/core/tiles-map";
import { TileCore } from "@/core/tile";
import { AISystem } from "./ai-system";
import { ConnectCitiesTask } from "./tasks/connectCitiesTask";
import { ImproveTileTask } from "./tasks/improveTileTask";
import { AiTask } from "./tasks/task";
import { dataManager } from "@/core/data/dataManager";
import { isImprovementPossible } from "@/core/tile-utils";
import { sumYields } from "@/core/yields";
import { LandForm, UnitAction } from "@/shared";
import { TileImprovementDefinition } from "@/core/data/types";

const CITIES_PER_WORKER = 0.5;
const MIN_WORKERS = 2;
const MAX_ROAD_DISTANCE = 8;
const MAX_CONCURRENT_ROAD_PROJECTS = 2;
const MAX_IMPROVEMENT_TASKS = 4;

type CityPair = {
  cityA: CityCore;
  cityB: CityCore;
  value: number;
};

export class WorkerAI extends AISystem {
  private roadTasks: ConnectCitiesTask[] = [];
  private improvementTasks: ImproveTileTask[] = [];

  private workersByArea = new Map<PassableArea, number>();

  *plan(): Generator<AiTask<any, any>> {
    // Clean up completed tasks
    this.roadTasks = this.roadTasks.filter((task) => task.result === null);
    this.improvementTasks = this.improvementTasks.filter(
      (task) => task.result === null,
    );

    // Count workers by area
    this.countWorkersByArea();

    // Plan worker production
    this.planWorkersProduction();

    // Plan road connections
    yield* this.planRoadConnections();

    // Plan tile improvements
    yield* this.planTileImprovements();
  }

  private countWorkersByArea(): void {
    this.workersByArea.clear();

    // Count all workers (both free and assigned)
    for (const unit of this.ai.player.units) {
      if (unit.definition.traits.includes("worker") && unit.tile.passableArea) {
        const count = this.workersByArea.get(unit.tile.passableArea) || 0;
        this.workersByArea.set(unit.tile.passableArea, count + 1);
      }
    }
  }

  private planWorkersProduction(): void {
    for (const passableArea of this.ai.player.knownPassableAreas.values()) {
      if (passableArea.type !== "land") {
        continue;
      }

      const citiesInArea = this.player.cities.filter(
        (city) => city.tile.passableArea === passableArea,
      );

      if (citiesInArea.length === 0) {
        continue;
      }

      const workersNeeded = Math.max(
        MIN_WORKERS,
        Math.floor(citiesInArea.length * CITIES_PER_WORKER),
      );

      const currentWorkers = this.workersByArea.get(passableArea) || 0;

      if (currentWorkers < workersNeeded) {
        this.ai.productionAi.request({
          focus: "economy",
          priority: 80,
          product: dataManager.units.get("unit_worker"),
          passableArea,
        });
      }
    }
  }

  private *planRoadConnections(): Generator<ConnectCitiesTask> {
    if (this.roadTasks.length >= MAX_CONCURRENT_ROAD_PROJECTS) {
      return;
    }

    // Find city pairs that need connections
    const unconnectedPairs = this.findUnconnectedCityPairs();

    // Sort by value
    unconnectedPairs.sort((a, b) => b.value - a.value);

    // Create tasks for the most valuable connections
    const tasksToCreate = Math.min(
      MAX_CONCURRENT_ROAD_PROJECTS - this.roadTasks.length,
      unconnectedPairs.length,
    );

    for (let i = 0; i < tasksToCreate; i++) {
      const pair = unconnectedPairs[i];
      const task = new ConnectCitiesTask(this.ai, {
        cityA: pair.cityA,
        cityB: pair.cityB,
        priority: 250,
      });
      this.roadTasks.push(task);
      yield task;
    }
  }

  private findUnconnectedCityPairs(): CityPair[] {
    const pairs: CityPair[] = [];
    const seenPairs = new Set<string>();

    for (const cityA of this.player.cities) {
      for (const cityB of this.player.cities) {
        if (cityA === cityB) continue;

        // Skip if already connected
        if (cityA.network && cityA.network === cityB.network) {
          continue;
        }

        // Skip if too far
        if (cityA.tile.getDistanceTo(cityB.tile) > MAX_ROAD_DISTANCE) {
          continue;
        }

        // Skip if different areas
        if (cityA.tile.passableArea !== cityB.tile.passableArea) {
          continue;
        }

        // Create unique key for pair
        const pairKey = [cityA.id, cityB.id].sort().join("-");
        if (seenPairs.has(pairKey)) {
          continue;
        }
        seenPairs.add(pairKey);

        // Skip if we already have a task for this pair
        const hasTask = this.roadTasks.some(
          (task) =>
            (task.options.cityA === cityA && task.options.cityB === cityB) ||
            (task.options.cityA === cityB && task.options.cityB === cityA),
        );
        if (hasTask) {
          continue;
        }

        pairs.push({
          cityA,
          cityB,
          value: cityA.population.total + cityB.population.total,
        });
      }
    }

    return pairs;
  }

  private *planTileImprovements(): Generator<ImproveTileTask> {
    if (this.improvementTasks.length >= MAX_IMPROVEMENT_TASKS) {
      return;
    }

    // Collect all candidates: resources first, then worked tiles, then others
    const resourceTiles: { tile: TileCore; action: UnitAction }[] = [];
    const workedTiles: { tile: TileCore; action: UnitAction }[] = [];
    const otherTiles: { tile: TileCore; action: UnitAction }[] = [];

    // Find tiles that need improvements
    for (const city of this.player.cities) {
      for (const tile of city.expansion.tiles) {
        if (
          tile.improvement !== null ||
          tile.city ||
          tile.isWater ||
          tile.landForm === LandForm.mountains
        ) {
          continue;
        }

        // Skip if we already have a task for this tile
        const hasTask = this.improvementTasks.some(
          (task) => task.options.tile === tile,
        );
        if (hasTask) {
          continue;
        }

        // Determine what action to take
        const action = this.getBestActionForTile(tile);
        if (!action) {
          continue;
        }

        // Categorize by priority
        if (tile.resource) {
          resourceTiles.push({ tile, action });
        } else if (city.workers.workedTiles.has(tile)) {
          workedTiles.push({ tile, action });
        } else {
          otherTiles.push({ tile, action });
        }
      }
    }

    // Sort each category by distance to nearest city
    const sortByDistance = (a: { tile: TileCore }, b: { tile: TileCore }) => {
      const distA = Math.min(
        ...this.player.cities.map((c) => c.tile.getDistanceTo(a.tile)),
      );
      const distB = Math.min(
        ...this.player.cities.map((c) => c.tile.getDistanceTo(b.tile)),
      );
      return distA - distB;
    };

    resourceTiles.sort(sortByDistance);
    workedTiles.sort(sortByDistance);
    otherTiles.sort(sortByDistance);

    // Combine in priority order
    const allCandidates = [...resourceTiles, ...workedTiles, ...otherTiles];

    // Create tasks for top candidates
    const tasksToCreate = Math.min(
      MAX_IMPROVEMENT_TASKS - this.improvementTasks.length,
      allCandidates.length,
    );

    for (let i = 0; i < tasksToCreate; i++) {
      const { tile, action } = allCandidates[i];

      const task = new ImproveTileTask(this.ai, {
        tile,
        action,
        priority: 100,
        onFail: () => {
          this.ai.tiles.exclude(tile, "working");
        },
      });

      this.improvementTasks.push(task);
      yield task;
    }
  }

  private getBestActionForTile(tile: TileCore): UnitAction | null {
    // If tile has a resource, get the required improvement
    if (tile.resource?.def.depositDef) {
      const requiredImpr = tile.resource.def.depositDef.requiredImprovement;
      if (
        this.player.knowledge.discoveredEntities.tileImprovement.has(
          requiredImpr,
        )
      ) {
        return requiredImpr.action as UnitAction;
      }
    }

    // Otherwise find the best general improvement
    let bestImpr: TileImprovementDefinition[] = [];
    let bestScore = 0;

    for (const impr of this.player.knowledge.discoveredEntities.tileImprovement.values()) {
      if (
        !isImprovementPossible(this.player, tile, impr) ||
        !impr.extraYields
      ) {
        continue;
      }

      const score = sumYields(impr.extraYields);
      if (score > bestScore) {
        bestScore = score;
        bestImpr = [impr];
      } else if (score === bestScore) {
        bestImpr.push(impr);
      }
    }

    if (!bestImpr.length) {
      return null;
    }

    return bestImpr[Math.floor(Math.random() * bestImpr.length)]
      .action as UnitAction;
  }
}
