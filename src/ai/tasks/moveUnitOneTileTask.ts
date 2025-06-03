import { move } from "@/core/movement";
import { tileToTileCoords } from "@/core/serialization/channel";
import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { TileCoords } from "@/shared";
import { AIPlayer } from "../ai-player";
import { AiTask } from "./task";

export type MoveUnitOneTileTaskOptions = {
  tile: TileCore;
  unit: UnitCore;
};

export type MoveUnitOneTileTaskSerialized = {
  tile: TileCoords;
  unit: number;
};

export class MoveUnitOneTileTask extends AiTask<MoveUnitOneTileTaskSerialized> {
  readonly type = "moveUnitOneTile";

  constructor(ai: AIPlayer, private options: MoveUnitOneTileTaskOptions) {
    super(ai);
    this.tick();
  }

  tick(): void {
    move(this.options.unit, this.options.tile);

    if (this.options.unit.tile === this.options.tile) {
      this.complete();
    } else {
      this.fail();
    }
  }

  serialize(): MoveUnitOneTileTaskSerialized {
    return {
      tile: tileToTileCoords(this.options.tile),
      unit: this.options.unit.id,
    };
  }

  getProgressState(): string | null {
    // Track unit position only - this task should complete in one turn
    return `${this.options.unit.tile.id}`;
  }
}
