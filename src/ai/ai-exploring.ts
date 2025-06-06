import { TileCore } from "@/core/tile";
import { PassableArea } from "@/core/tiles-map";
import { AISystem } from "./ai-system";
import { ExploreTask } from "./tasks/exploreTask";

const TILES_PER_LAND_EXPLORER = 20;
const TILES_PER_SEA_EXPLORER = 50;
const MAX_EXPLORERS_PER_AREA = 3;

export class ExploringAI extends AISystem {
  private tasks: ExploreTask[] = [];

  public edgeOfUnknown = new Map<PassableArea, Set<TileCore>>();

  *plan(): Generator<ExploreTask> {
    this.tasks = this.tasks.filter((task) => task.result === null);

    this.computeEdgeOfUnknown();

    // Track which areas already have exploration tasks
    const areasWithTasks = new Set<PassableArea>();
    for (const task of this.tasks) {
      areasWithTasks.add(task.options.passableArea);
    }

    // Check for areas that need explorers
    for (const [area, edge] of this.edgeOfUnknown.entries()) {
      if (area.type === "water" && !this.ai.features.knowNavalExplorers) {
        continue;
      }

      // Calculate how many explorers we need for this area
      const tilesPerExplorer =
        area.type === "land" ? TILES_PER_LAND_EXPLORER : TILES_PER_SEA_EXPLORER;
      let explorersAvailable = Array.from(
        this.ai.units.freeByTrait.explorer,
      ).filter(
        (unit) =>
          !unit.definition.traits.includes("military") &&
          unit.definition.traits.includes(
            area.type === "land" ? "land" : "naval",
          ),
      );
      const explorersNeeded = Math.max(
        Math.min(
          MAX_EXPLORERS_PER_AREA,
          Math.ceil(edge.size / tilesPerExplorer),
        ),
        explorersAvailable.length,
      );

      const currentTasks = this.tasks.filter(
        (t) => t.options.passableArea === area,
      ).length;

      // Create tasks for needed explorers
      const tasksToCreate = explorersNeeded - currentTasks;
      for (let i = 0; i < tasksToCreate; i++) {
        const task = new ExploreTask(this.ai, {
          passableArea: area,
          priority: 100,
        });
        this.tasks.push(task);
        yield task;
      }
    }
  }

  private computeEdgeOfUnknown(): void {
    this.edgeOfUnknown.clear();

    for (const tile of this.ai.player.exploredTiles) {
      if (!tile.passableArea) {
        continue;
      }
      let edge = this.edgeOfUnknown.get(tile.passableArea);
      if (!edge) {
        edge = new Set();
        this.edgeOfUnknown.set(tile.passableArea, edge);
      }
      for (const neighbour of tile.neighbours) {
        if (
          !neighbour.isMapEdge &&
          !this.ai.player.exploredTiles.has(neighbour)
        ) {
          edge.add(tile);
        }
      }
    }

    for (const [area, edge] of this.edgeOfUnknown.entries()) {
      if (edge.size === 0) {
        this.edgeOfUnknown.delete(area);
      }
    }
  }
}
