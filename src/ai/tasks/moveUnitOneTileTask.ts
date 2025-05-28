import { move } from "@/core/movement";
import { tileToTileCoords } from "@/core/serialization/channel";
import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { TileCoords } from "@/shared";
import { AIPlayer } from "../ai-player";
import { AiTask } from "./task";

export type MoveUnitTaskOptions = {
  tile: TileCore;
  unit: UnitCore;
};

export type MoveUnitTaskSerialized = {
  tile: TileCoords;
  unit: number;
};

export class MoveUnitOneTileTask extends AiTask<MoveUnitTaskSerialized> {
  readonly type = "moveUnit";

  constructor(ai: AIPlayer, private options: MoveUnitTaskOptions) {
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

  serialize(): MoveUnitTaskSerialized {
    return {
      tile: tileToTileCoords(this.options.tile),
      unit: this.options.unit.id,
    };
  }
}
