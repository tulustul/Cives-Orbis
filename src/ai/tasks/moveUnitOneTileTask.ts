import { move } from "@/core/movement";
import {
  tileToTileCoords,
  unitToIdAndName,
} from "@/core/serialization/channel";
import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { TileCoords, UnitIdAndName } from "@/shared";
import { AiTask, AiTaskOptions } from "./task";

export type MoveUnitOneTileTaskOptions = AiTaskOptions & {
  tile: TileCore;
  unit: UnitCore;
};

export type MoveUnitOneTileTaskSerialized = {
  tile: TileCoords;
  unit: UnitIdAndName | null;
};

export class MoveUnitOneTileTask extends AiTask<
  MoveUnitOneTileTaskOptions,
  MoveUnitOneTileTaskSerialized
> {
  readonly type = "moveUnitOneTile";

  tick(): void {
    move(this.options.unit, this.options.tile);

    if (this.options.unit.tile === this.options.tile) {
      this.complete();
    } else {
      this.fail("Unit could not move to the specified tile");
    }
  }

  serialize(): MoveUnitOneTileTaskSerialized {
    return {
      tile: tileToTileCoords(this.options.tile),
      unit: unitToIdAndName(this.options.unit),
    };
  }

  getProgressState(): string | null {
    // Track unit position only - this task should complete in one turn
    return `${this.options.unit.tile.id}`;
  }
}
