import { CityCore } from "@/core/city";
import { getUnitById } from "@/core/data-manager";
import { TileImprovementDefinition, UnitTrait } from "@/core/data.interface";
import { findPath } from "@/core/pathfinding";
import { TileCore } from "@/core/tile";
import { PassableArea } from "@/core/tiles-map";
import { UnitCore } from "@/core/unit";
import { UnitAction } from "@/core/unit-actions";
import { sumYields } from "@/core/yields";
import { isImprovementPossible } from "@/shared";
import { AISystem } from "./ai-system";
import { AiOperation } from "./types";

const CITIES_PER_WORKER = 0.5;
const MIN_WORKERS = 2;
const MAX_ROAD_DISTANCE = 8;

type WorkerTask = {
  tile: TileCore;
  action: UnitAction;
  priority: number;
};

type AssignedWorkerTask = WorkerTask & {
  worker: UnitCore;
};

export class WorkerAI extends AISystem {
  private possibleTasks: WorkerTask[] = [];
  private assignedTasks: AssignedWorkerTask[] = [];
  private assignedTiles = new Set<TileCore>();
  private assignedTaskByWorker = new Map<UnitCore, AssignedWorkerTask>();

  private workersByArea = new Map<PassableArea, UnitCore[]>();

  plan(): AiOperation[] {
    this.operations = [];
    this.possibleTasks = [];

    this.validateAssignedTasks();

    this.groupWorkersByArea();

    this.planWorkersProduction();

    this.planRoads();

    this.planTileImprovements();

    this.processWorkers();

    return this.operations;
  }

  private validateAssignedTasks() {
    this.assignedTiles.clear();
    this.assignedTaskByWorker.clear();
    this.assignedTasks = this.assignedTasks.filter((task) => {
      if (
        task.worker.health <= 0 ||
        (task.tile.areaOf !== null &&
          task.tile.areaOf.player !== this.player) ||
        (task.worker.tile === task.tile &&
          !task.worker.canDoAction(task.action)) ||
        (task.worker.tile !== task.tile && task.worker.path?.length === 0)
      ) {
        task.worker.order = null;
        return false;
      }
      this.assignedTiles.add(task.tile);
      this.assignedTaskByWorker.set(task.worker, task);
      return true;
    });
  }

  private groupWorkersByArea() {
    this.workersByArea.clear();
    for (const unit of this.ai.player.units) {
      if (
        unit.definition.trait === UnitTrait.worker &&
        unit.tile.passableArea
      ) {
        if (!this.workersByArea.has(unit.tile.passableArea)) {
          this.workersByArea.set(unit.tile.passableArea, []);
        }
        this.workersByArea.get(unit.tile.passableArea)!.push(unit);
      }
    }
  }

  private planWorkersProduction() {
    for (const passableArea of this.ai.player.knownPassableAreas.values()) {
      if (passableArea.type !== "land") {
        continue;
      }
      // Calculate how many cities are in this area
      const citiesInArea = this.player.cities.filter(
        (city) => city.tile.passableArea === passableArea,
      );
      if (citiesInArea.length === 0) {
        continue;
      }
      // Calculate how many workers are needed
      // At least MIN_WORKERS per city
      const workersNeeded = Math.max(
        MIN_WORKERS,
        Math.floor(citiesInArea.length * CITIES_PER_WORKER),
      );
      const currentWorkers = this.workersByArea.get(passableArea)?.length ?? 0;
      // Request more workers if needed
      if (currentWorkers < workersNeeded) {
        this.ai.productionAi.request({
          focus: "economy",
          priority: 80,
          product: getUnitById("unit_worker")!,
          passableArea,
        });
      }
    }
  }

  private processWorkers() {
    for (const workers of this.workersByArea.values()) {
      for (const worker of workers) {
        this.processWorker(worker);
      }
    }
  }

  private processWorker(worker: UnitCore) {
    if (worker.actionPointsLeft === 0 || worker.order) {
      return;
    }

    let task: AssignedWorkerTask | undefined;

    if (this.assignedTaskByWorker.has(worker)) {
      task = this.assignedTaskByWorker.get(worker)!;
    } else {
      const unassignedTask = this.findTaskForWorker(worker);
      if (!unassignedTask) {
        return;
      }
      task = { ...unassignedTask, worker };
      this.assignedTasks.push(task);
      this.possibleTasks.splice(this.possibleTasks.indexOf(unassignedTask), 1);
    }

    this.operations.push({
      group: "unit",
      entityId: worker.id,
      focus: "economy",
      priority: task.priority,
      perform: () => {
        if (worker.tile.id === task.tile.id) {
          worker.doAction(task.action);
        } else {
          worker.path = findPath(worker, task.tile);
        }
      },
    });
  }

  findTaskForWorker(worker: UnitCore): WorkerTask | null {
    let bestTask: WorkerTask | null = null;
    let bestScore = -Infinity;
    for (const task of this.possibleTasks) {
      if (task.tile.passableArea !== worker.tile.passableArea) {
        continue;
      }
      const score = worker.tile.getDistanceTo(task.tile) + task.priority / 30;
      if (score > bestScore) {
        bestScore = score;
        bestTask = task;
      }
    }
    return bestTask;
  }

  private planTileImprovements() {
    const tasks: WorkerTask[] = [];
    for (const city of this.player.cities) {
      for (const tile of city.expansion.tiles) {
        if (
          tile.improvement !== null ||
          tile.city ||
          this.assignedTiles.has(tile)
        ) {
          continue;
        }

        const impr = this.getBestTileImpr(tile);
        if (impr) {
          let priority = 100;
          if (tile.resource) {
            priority += 200;
          }
          if (city.workers.workedTiles.has(tile)) {
            priority += 100;
          }
          const action = `build-${impr.id}` as UnitAction;
          tasks.push({ tile, action, priority });
        }
      }
    }

    tasks.sort((a, b) => b.priority - a.priority);
    for (const task of tasks.slice(0, 2)) {
      this.possibleTasks.push(task);
    }
  }

  private getCityPairKey(cityA: CityCore, cityB: CityCore): string {
    const ids = [cityA.id, cityB.id].sort();
    return `${ids[0]}-${ids[1]}`;
  }

  private planRoads() {
    for (const workers of this.workersByArea.values()) {
      for (const tile of this.planAreaRoads(workers[0])) {
        this.possibleTasks.push({ tile, action: "buildRoad", priority: 250 });
      }
    }
  }

  private planAreaRoads(worker: UnitCore): TileCore[] {
    const pairs = new Set<string>();
    const missingConnections: {
      cityA: CityCore;
      cityB: CityCore;
      value: number;
    }[] = [];

    const cities = this.player.cities.filter(
      (city) => city.tile.passableArea === worker.tile.passableArea,
    );

    for (const cityA of cities) {
      for (const cityB of cities) {
        if (cityA === cityB) {
          continue;
        }
        if (cityA.network && cityA.network === cityB.network) {
          continue;
        }
        if (cityA.tile.getDistanceTo(cityB.tile) > MAX_ROAD_DISTANCE) {
          continue;
        }
        const pairKey = this.getCityPairKey(cityA, cityB);
        if (pairs.has(pairKey)) {
          continue;
        }
        pairs.add(pairKey);

        missingConnections.push({
          cityA,
          cityB,
          value: cityA.population.total + cityB.population.total,
        });
      }
    }

    if (missingConnections.length === 0) {
      return [];
    }

    missingConnections.sort((a, b) => b.value - a.value);

    for (const connection of missingConnections) {
      const path = findPath(
        worker,
        connection.cityA.tile,
        connection.cityB.tile,
      );
      if (path) {
        const tiles = path.flat().filter((tile) => tile.road === null);
        if (tiles.length) {
          return tiles;
        }
      }
    }

    return [];
  }

  private getBestTileImpr(tile: TileCore): TileImprovementDefinition | null {
    if (tile.resource?.def.depositDef) {
      // TODO check if the resource is known to the player
      if (
        this.player.knowledge.discoveredEntities.tileImprovement.has(
          tile.resource.def.depositDef.requiredImprovement,
        )
      ) {
        return tile.resource.def.depositDef.requiredImprovement;
      }
    }

    let bestImpr: TileImprovementDefinition | null = null;
    let bestScore = -0;

    for (const impr of this.ai.player.knowledge.discoveredEntities.tileImprovement.values()) {
      if (
        !isImprovementPossible(this.player, tile, impr) ||
        !impr.extraYields
      ) {
        continue;
      }
      const score = sumYields(impr.extraYields);
      if (score > bestScore) {
        bestScore = score;
        bestImpr = impr;
      }
    }

    return bestImpr;
  }
}
