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
    // Remove completed tiles
    this.roadTiles = this.roadTiles.filter((tile) => tile.road === null);

    if (this.roadTiles.length === 0) {
      return this.complete();
    }

    // Check if cities are now connected
    if (this.options.cityA.network && 
        this.options.cityA.network === this.options.cityB.network) {
      return this.complete();
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
      this.roadTiles.length
    );

    for (let i = 0; i < tilesToBuild; i++) {
      const tile = this.roadTiles[i];
      this.addTask(
        new ImproveTileTask(this.ai, {
          tile,
          action: "buildRoad",
          priority: this.options.priority,
          onCompleted: () => {
            this.currentTileIndex++;
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
    return `${this.state}-${this.currentTileIndex}/${this.roadTiles.length}`;
  }
}