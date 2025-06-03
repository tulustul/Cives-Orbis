import { moveAlongPath } from "@/core/movement";
import { findPath } from "@/core/pathfinding";
import { tileToTileCoords } from "@/core/serialization/channel";
import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { TileCoords } from "@/shared";
import { AIPlayer } from "../ai-player";
import { AiTask } from "./task";

export type MoveUnitTaskOptions = {
  tile: TileCore;
  unit: UnitCore;
  onCompleted?: () => void;
};

export type MoveUnitTaskSerialized = {
  tile: TileCoords;
  unit: number;
};

export class MoveUnitTask extends AiTask<MoveUnitTaskSerialized> {
  readonly type = "moveUnit";

  constructor(ai: AIPlayer, private options: MoveUnitTaskOptions) {
    super(ai);
    this.tick();
  }

  tick(): void {
    const unit = this.options.unit;
    if (!unit || !unit.isAlive) {
      return this.fail();
    }
    if (unit.order !== "go" || !unit.path) {
      unit.path = findPath(unit, this.options.tile);
    }
    if (!unit.path) {
      return this.fail();
    }

    unit.setOrder("go");
    moveAlongPath(unit);
    if (unit.tile === this.options.tile) {
      if (this.options.onCompleted) {
        this.options.onCompleted();
      }
      // Movement complete - unit is now free for other tasks
      unit.setOrder(null);
      this.complete();
    }
  }

  serialize(): MoveUnitTaskSerialized {
    return {
      tile: tileToTileCoords(this.options.tile),
      unit: this.options.unit.id,
    };
  }

  getProgressState(): string | null {
    const unit = this.options.unit;
    // Track unit position, action points, and whether it has a path
    return `${unit.tile.id}-${unit.actionPointsLeft}-${
      unit.path ? "path" : "nopath"
    }`;
  }
}
