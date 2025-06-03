import { tileToTileCoords } from "@/core/serialization/channel";
import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { TileCoords } from "@/shared";
import { AIPlayer } from "../ai-player";
import { findClosestUnit } from "../utils";
import { CityProduceUnitTask } from "./cityProduceUnitTask";
import { MoveUnitTask } from "./moveUnitTask";
import { NavalTransportTask } from "./navalTransportTask";
import { AiTask } from "./task";

export type SettleTaskOptions = {
  tile: TileCore;
};

export type SettleTaskSerialized = {
  options: {
    tile: TileCoords;
  };
  settler?: number;
};

type SettleState = "init" | "moving" | "settling";

export class SettleTask extends AiTask<SettleTaskSerialized> {
  readonly type = "settle";

  settler: UnitCore | null = null;

  state: SettleState = "init";

  constructor(ai: AIPlayer, public options: SettleTaskOptions) {
    super(ai);
    this.tick();
  }

  tick(): void {
    if (this.options.tile.areaOf) {
      return this.fail();
    }

    switch (this.state) {
      case "init":
        return this.init();

      case "moving":
        return this.move();

      case "settling":
        return this.settle();
    }
  }

  init() {
    this.settler = findClosestUnit(
      Array.from(this.ai.units.freeByTrait.settler),
      this.options.tile,
    );

    if (this.settler) {
      this.ai.units.assign(this.settler, "settling");
    } else {
      this.tasks.push(
        new CityProduceUnitTask(this.ai, {
          focus: "expansion",
          priority: this.ai.player.cities.length < 3 ? 100 : 50,
          unitTrait: "settler",
          onCompleted: (settler) => {
            if (!settler) {
              this.fail();
              return;
            }
            this.settler = settler;
            this.ai.units.assign(settler, "settling");
          },
        }),
      );
    }

    this.state = "moving";
    this.move();
  }

  move() {
    if (!this.settler) {
      return this.fail();
    }

    if (this.options.tile.passableArea === this.settler.tile.passableArea) {
      this.tasks.push(
        new MoveUnitTask(this.ai, {
          tile: this.options.tile,
          unit: this.settler,
        }),
      );
    } else {
      this.tasks.push(
        new NavalTransportTask(this.ai, {
          to: this.options.tile,
          unit: this.settler,
        }),
      );
    }

    this.state = "settling";
    // this.settle();
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
      return this.fail();
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
      settler: this.settler?.id,
    };
  }

  getProgressState(): string | null {
    // Track state, settler position, and child task count
    return `${this.state}-${this.settler?.tile.id ?? "none"}-${
      this.tasks.length
    }`;
  }
}
