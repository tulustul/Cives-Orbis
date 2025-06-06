import { TileCore } from "@/core/tile";
import { TileCoords, UnitAction } from "@/shared";
import { tileToTileCoords } from "@/core/serialization/channel";
import { MoveUnitTask } from "./moveUnitTask";
import { WorkerTask, WorkerTaskOptions } from "./workerTask";
import { AIPlayer } from "../ai-player";

export type ImproveTileTaskOptions = WorkerTaskOptions & {
  tile: TileCore;
  action: UnitAction;
  onCompleted?: () => void;
};

export type ImproveTileTaskSerialized = {
  tile: TileCoords;
  worker?: number;
  action: UnitAction;
};

type State = "init" | "moving" | "building";

export class ImproveTileTask extends WorkerTask<ImproveTileTaskOptions, ImproveTileTaskSerialized> {
  readonly type = "improveTile";
  
  state: State = "init";

  constructor(ai: AIPlayer, options: ImproveTileTaskOptions) {
    super(ai, options);
  }

  init(): void {
    this.state = "init";
    this.tick();
  }

  tick(): void {
    const tile = this.options.tile;
    const action = this.options.action;
    
    // Check if already completed
    if (this.isAlreadyImproved(tile, action)) {
      if (this.options.onCompleted) {
        this.options.onCompleted();
      }
      return this.complete();
    }

    // Check if tile is still accessible
    if (tile.areaOf && tile.areaOf.player !== this.ai.player) {
      return this.fail("Tile no longer accessible");
    }

    switch (this.state) {
      case "init":
        return this.findWorker();
      case "moving":
        return this.move();
      case "building":
        return this.build();
    }
  }

  private isAlreadyImproved(tile: TileCore, action: UnitAction): boolean {
    if (action === "buildRoad") {
      return tile.road !== null;
    }
    // For all other improvements, check if tile already has an improvement
    return tile.improvement !== null;
  }

  private findWorker(): void {
    const tile = this.options.tile;
    
    // Find available worker
    const workers = Array.from(this.ai.units.freeByTrait.worker);
    const nearbyWorkers = workers.filter(
      (w) => w.tile.passableArea === tile.passableArea
    );

    if (nearbyWorkers.length === 0) {
      return this.fail("No workers available in area");
    }

    // Find closest worker
    let closestWorker = nearbyWorkers[0];
    let minDistance = closestWorker.tile.getDistanceTo(tile);

    for (const worker of nearbyWorkers) {
      const distance = worker.tile.getDistanceTo(tile);
      if (distance < minDistance) {
        minDistance = distance;
        closestWorker = worker;
      }
    }

    this.assignWorker(closestWorker);
    this.state = "moving";
  }

  private move(): void {
    if (!this.worker || !this.worker.isAlive) {
      this.state = "init";
      return;
    }

    if (this.worker.tile === this.options.tile) {
      this.state = "building";
      return;
    }

    this.addTask(
      new MoveUnitTask(this.ai, {
        unit: this.worker,
        tile: this.options.tile,
      })
    );
  }

  private build(): void {
    if (!this.worker || !this.worker.isAlive) {
      this.state = "init";
      return;
    }

    if (this.worker.tile !== this.options.tile) {
      this.state = "moving";
      return;
    }

    if (this.worker.actionPointsLeft === 0) {
      return;
    }

    if (!this.worker.canDoAction(this.options.action)) {
      return this.fail(`Worker cannot perform action: ${this.options.action}`);
    }

    this.worker.doAction(this.options.action);
    
    if (this.options.onCompleted) {
      this.options.onCompleted();
    }
    this.complete();
  }

  serialize(): ImproveTileTaskSerialized {
    return {
      tile: tileToTileCoords(this.options.tile),
      worker: this.worker?.id,
      action: this.options.action,
    };
  }

  getProgressState(): string | null {
    return `${this.state}-${this.worker?.tile.id ?? "none"}-${this.options.action}`;
  }
}