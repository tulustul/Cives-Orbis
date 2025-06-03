import { PassableArea } from "@/core/tiles-map";
import { AISystem } from "./ai-system";
import { ExploreTask } from "./tasks/exploreTask";
import { AiTask } from "./tasks/task";

const TILES_PER_EXPLORER = 500;
const MAX_EXPLORERS_PER_AREA = 3;
const MIN_EXPLORER_AREA = 2;

export class ExploringAI extends AISystem {
  private tasks: ExploreTask[] = [];

  *plan(): Generator<AiTask<any>> {
    // Clean up completed tasks
    this.tasks = this.tasks.filter((task) => task.result === null);

    // Track which areas already have exploration tasks
    const areasWithTasks = new Set<PassableArea>();
    for (const task of this.tasks) {
      areasWithTasks.add(task.options.passableArea);
    }

    // Check for areas that need explorers
    for (const passableArea of this.ai.player.knownPassableAreas.values()) {
      if (passableArea.area < MIN_EXPLORER_AREA) {
        continue;
      }

      // Skip if we already have a task for this area
      if (areasWithTasks.has(passableArea)) {
        continue;
      }

      // Calculate how many explorers we need for this area
      const explorersNeeded = Math.min(
        MAX_EXPLORERS_PER_AREA,
        Math.ceil(passableArea.area / TILES_PER_EXPLORER),
      );

      // Count current explorers in this area
      const currentExplorers = Array.from(this.ai.units.byAssignment.exploration).filter(
        (unit) => unit.tile.passableArea === passableArea
      ).length;

      // Create tasks for needed explorers
      const tasksToCreate = explorersNeeded - currentExplorers;
      for (let i = 0; i < tasksToCreate; i++) {
        const priority = this.calculatePriority(passableArea);
        const task = new ExploreTask(this.ai, {
          passableArea,
          priority,
        });
        this.tasks.push(task);
        yield task;
      }
    }

    // Handle explorers that aren't assigned to any task
    for (const explorer of this.ai.units.freeByTrait.explorer) {
      // Check if this explorer's area needs exploration
      const passableArea = explorer.tile.passableArea;
      if (!passableArea || passableArea.area < MIN_EXPLORER_AREA) {
        // Destroy explorer if in tiny area
        explorer.destroy();
        continue;
      }

      // Create a new exploration task for this free explorer
      const task = new ExploreTask(this.ai, {
        passableArea,
        priority: 100,
      });
      this.tasks.push(task);
      yield task;
    }
  }

  private calculatePriority(passableArea: PassableArea): number {
    let priority = 100;

    // Higher priority for larger areas
    if (passableArea.area > 1000) {
      priority += 20;
    }

    // Higher priority for land areas (more likely to have good settling spots)
    if (passableArea.type === "land") {
      priority += 10;
    }

    // Lower priority for areas we've already partially explored
    const exploredTilesInArea = Array.from(this.ai.player.exploredTiles).filter(
      (tile) => tile.passableArea === passableArea
    ).length;
    
    const explorationRatio = exploredTilesInArea / passableArea.area;
    if (explorationRatio > 0.5) {
      priority -= 20;
    }

    // Check if area has cities
    const hasCities = this.ai.player.cities.some(
      (city) => city.tile.passableArea === passableArea
    );
    
    if (hasCities) {
      // Lower priority for areas with cities (we can produce explorers there)
      priority += 5;
    } else {
      // Higher priority for areas without cities (need to transport explorers)
      priority += 25;
      
      // Even higher if it's unexplored land
      if (passableArea.type === "land" && explorationRatio < 0.1) {
        priority += 20;
      }
    }

    return priority;
  }
}