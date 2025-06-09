import { moveAlongPath } from "@/core/movement";
import { findPath } from "@/core/pathfinding";
import {
  tileToTileCoords,
  unitToIdAndName,
} from "@/core/serialization/channel";
import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { TileCoords, UnitIdAndName } from "@/shared";
import { AiTask, AiTaskOptions } from "./task";

export type MoveUnitTaskOptions = AiTaskOptions & {
  tile: TileCore;
  unit: UnitCore;
  priority?: number;
  onCompleted?: () => void;
};

export type MoveUnitTaskSerialized = {
  tile: TileCoords;
  unit: UnitIdAndName | null;
};

export class MoveUnitTask extends AiTask<
  MoveUnitTaskOptions,
  MoveUnitTaskSerialized
> {
  readonly type = "moveUnit";

  tick(): void {
    const unit = this.options.unit;
    if (!unit) {
      return this.fail("Unit not available");
    }
    if (!unit.isAlive) {
      return this.fail("Unit is dead");
    }

    if (this.checkCompleted()) {
      return;
    }

    if (unit.order !== "go" || !unit.path) {
      unit.path = findPath(unit, this.options.tile);
    }
    if (!unit.path) {
      return this.fail("No valid path found");
    }

    unit.setOrder("go");
    moveAlongPath(unit);

    this.checkCompleted();
  }

  checkCompleted() {
    if (this.options.unit.tile === this.options.tile) {
      if (this.options.onCompleted) {
        this.options.onCompleted();
      }
      // Movement complete - unit is now free for other tasks
      this.options.unit.setOrder(null);
      this.complete();
      return true;
    }
    return false;
  }

  serialize(): MoveUnitTaskSerialized {
    return {
      tile: tileToTileCoords(this.options.tile),
      unit: unitToIdAndName(this.options.unit),
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
