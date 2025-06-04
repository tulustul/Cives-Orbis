import {
  tileToTileCoords,
  unitToIdAndName,
} from "@/core/serialization/channel";
import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { TileCoords, UnitIdAndName } from "@/shared";
import { findClosestUnit } from "../utils";
import { CityProduceUnitTask } from "./cityProduceUnitTask";
import { MoveUnitTask } from "./moveUnitTask";
import { NavalTransportTask } from "./navalTransportTask";
import { AiTask, AiTaskOptions } from "./task";

export type SettleTaskOptions = AiTaskOptions & {
  tile: TileCore;
};

export type SettleTaskSerialized = {
  options: {
    tile: TileCoords;
  };
  settler: UnitIdAndName | null;
};

type SettleState = "init" | "moving" | "settling";

export class SettleTask extends AiTask<
  SettleTaskOptions,
  SettleTaskSerialized
> {
  readonly type = "settle";

  settler: UnitCore | null = null;

  state: SettleState = "init";

  init() {
    this.settler = findClosestUnit(
      Array.from(this.ai.units.freeByTrait.settler),
      this.options.tile,
    );

    if (this.settler) {
      this.ai.units.assign(this.settler, "settling");
    } else {
      this.addTask(
        new CityProduceUnitTask(this.ai, {
          focus: "expansion",
          priority: this.ai.player.cities.length < 3 ? 100 : 50,
          unitTrait: ["settler"],
          onCompleted: (settler) => {
            if (!settler) {
              this.fail("No settler produced");
              return;
            }
            this.settler = settler;
            this.ai.units.assign(settler, "settling");
          },
        }),
      );
    }

    this.state = "moving";
    if (!this.tasks.length) {
      this.move();
    }
  }

  tick(): void {
    if (this.options.tile.areaOf) {
      return this.fail("Tile already claimed");
    }

    switch (this.state) {
      case "moving":
        return this.move();

      case "settling":
        return this.settle();
    }
  }

  move() {
    if (!this.settler) {
      return this.fail("No settler available to move");
    }

    if (this.options.tile.passableArea === this.settler.tile.passableArea) {
      this.addTask(
        new MoveUnitTask(this.ai, {
          tile: this.options.tile,
          unit: this.settler,
        }),
      );
    } else {
      this.addTask(
        new NavalTransportTask(this.ai, {
          to: this.options.tile,
          unit: this.settler,
        }),
      );
    }

    this.state = "settling";
  }

  settle() {
    if (this.settler?.actionPointsLeft === 0) {
      return;
    }

    if (
      !this.settler ||
      (this.settler.tile !== this.options.tile &&
        this.settler.actionPointsLeft) ||
      !this.settler.canDoAction("foundCity")
    ) {
      return this.fail("Cannot settle here");
    }

    this.settler.doAction("foundCity");

    this.complete();
  }

  cleanup() {
    if (this.settler) {
      this.ai.units.unassign(this.settler);
    }
  }

  serialize(): SettleTaskSerialized {
    return {
      options: {
        tile: tileToTileCoords(this.options.tile),
      },
      settler: unitToIdAndName(this.settler),
    };
  }

  getProgressState(): string | null {
    // Track state, settler position, and child task count
    return `${this.state}-${this.settler?.tile.id ?? "none"}-${
      this.tasks.length
    }`;
  }
}
