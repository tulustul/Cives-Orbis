import { CityCore } from "@/core/city";
import { findPath } from "@/core/pathfinding";
import { TileCore } from "@/core/tile";
import { ImproveTileTask } from "./improveTileTask";
import { AiTask, AiTaskOptions } from "./task";
import { AIPlayer } from "../ai-player";
import { dataManager } from "@/core/data/dataManager";

export type ConnectCitiesTaskOptions = AiTaskOptions & {
  cityA: CityCore;
  cityB: CityCore;
  priority?: number;
};

export type ConnectCitiesTaskSerialized = {
  cityA: number;
  cityB: number;
  priority?: number;
  tilesCompleted: number;
  totalTiles: number;
};

type State = "planning" | "building";

export class ConnectCitiesTask extends AiTask<ConnectCitiesTaskOptions, ConnectCitiesTaskSerialized> {
  readonly type = "connectCities";
  
  state: State = "planning";
  roadTiles: TileCore[] = [];
  currentTileIndex = 0;
  completedTiles = new Set<TileCore>();
  assignedTiles = new Set<TileCore>();

  constructor(ai: AIPlayer, options: ConnectCitiesTaskOptions) {
    super(ai, options);
  }

  init(): void {
    this.state = "planning";
    this.tick();
  }

  tick(): void {
    // Check if cities are already connected
    if (this.options.cityA.network && 
        this.options.cityA.network === this.options.cityB.network) {
      return this.complete();
    }

    switch (this.state) {
      case "planning":
        return this.planRoute();
      case "building":
        return this.buildRoad();
    }
  }

  private planRoute(): void {
    // Find path between cities
    const dummyUnit = {
      tile: this.options.cityA.tile,
      player: this.ai.player,
      movementLeft: 10,
      isLand: true,
      isNaval: false,
      definition: dataManager.units.get("unit_worker"),
    } as any;

    const path = findPath(
      dummyUnit,
      this.options.cityA.tile,
      this.options.cityB.tile
    );

    if (!path) {
      return this.fail("No path found between cities");
    }

    // Extract tiles that need roads
    this.roadTiles = path.flat().filter((tile) => tile.road === null);
    
    if (this.roadTiles.length === 0) {
      return this.complete();
    }

    this.state = "building";
  }

  private buildRoad(): void {
    // Check if cities are now connected
    if (this.options.cityA.network && 
        this.options.cityA.network === this.options.cityB.network) {
      return this.complete();
    }

    // Update completed tiles
    for (const tile of this.roadTiles) {
      if (tile.road !== null) {
        this.completedTiles.add(tile);
      }
    }

    // Get remaining tiles to build
    const remainingTiles = this.roadTiles.filter(
      (tile) => !this.completedTiles.has(tile) && !this.assignedTiles.has(tile)
    );

    if (remainingTiles.length === 0) {
      // Check if all assigned tasks are complete
      const activeTasks = this.tasks.filter(
        (task) => task instanceof ImproveTileTask && task.result === null
      );
      
      if (activeTasks.length === 0) {
        // All tasks done, check if we need to replan
        const needsRoad = this.roadTiles.some((tile) => tile.road === null);
        if (needsRoad) {
          // Some tiles still need roads, replan the route
          this.state = "planning";
          this.completedTiles.clear();
          this.assignedTiles.clear();
          return;
        }
        return this.complete();
      }
      // Wait for active tasks to complete
      return;
    }

    // Limit concurrent road building tasks to allow multiple workers to cooperate
    const MAX_CONCURRENT_ROADS = 3;
    const currentRoadTasks = this.tasks.filter(
      (task) => task instanceof ImproveTileTask && task.result === null
    ).length;

    if (currentRoadTasks >= MAX_CONCURRENT_ROADS) {
      return;
    }

    // Add tasks for the next few tiles
    const tilesToBuild = Math.min(
      MAX_CONCURRENT_ROADS - currentRoadTasks,
      remainingTiles.length
    );

    for (let i = 0; i < tilesToBuild; i++) {
      const tile = remainingTiles[i];
      this.assignedTiles.add(tile);
      
      this.addTask(
        new ImproveTileTask(this.ai, {
          tile,
          action: "buildRoad",
          priority: this.options.priority,
          onCompleted: () => {
            this.completedTiles.add(tile);
            this.assignedTiles.delete(tile);
            this.currentTileIndex++;
          },
          onFail: () => {
            this.assignedTiles.delete(tile);
          },
        })
      );
    }
  }

  serialize(): ConnectCitiesTaskSerialized {
    return {
      cityA: this.options.cityA.id,
      cityB: this.options.cityB.id,
      priority: this.options.priority,
      tilesCompleted: this.currentTileIndex,
      totalTiles: this.roadTiles.length,
    };
  }

  getProgressState(): string | null {
    const activeTasksCount = this.tasks.filter(
      (task) => task instanceof ImproveTileTask && task.result === null
    ).length;
    return `${this.state}-completed:${this.completedTiles.size}-assigned:${this.assignedTiles.size}-active:${activeTasksCount}-total:${this.roadTiles.length}`;
  }
}