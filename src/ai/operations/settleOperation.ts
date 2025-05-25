import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { AIPlayer } from "../ai-player";
import { AiOrder } from "../types";
import { AiOperation, AiOperationState } from "./baseOperation";
import { CityProduceUnitOperation } from "./cityProduceUnitOperation";
import { MoveUnitOperation } from "./moveUnitOperations";

export type SettleOperationOptions = {
  tile: TileCore;
};

export class SettleOperation extends AiOperation {
  settler: UnitCore | null = null;
  constructor(ai: AIPlayer, public options: SettleOperationOptions) {
    super(ai);
    this.plan();
  }

  plan(): void {
    this.settler = this.findBestSettler();
    if (this.settler) {
      this.ai.units.assign(this.settler, "settling");
      this.operations.push(
        new MoveUnitOperation(this.ai, {
          tile: this.options.tile,
          unit: this.settler,
        }),
      );
    } else {
      const settlerProductionOperation = new CityProduceUnitOperation(this.ai, {
        focus: "expansion",
        priority: this.ai.player.cities.length < 3 ? 100 : 50,
        unitTrait: "settler",
      });
      this.operations.push(settlerProductionOperation);
      this.operations.push(
        new MoveUnitOperation(this.ai, {
          tile: this.options.tile,
          unitPromise: settlerProductionOperation.unitPromise,
        }),
      );

      settlerProductionOperation.unitPromise.then((settler) => {
        if (settler) {
          this.settler = settler;
          this.ai.units.assign(settler, "settling");
        }
      });
    }
  }

  validate(): boolean {
    if (this.options.tile.areaOf) {
      if (this.settler) {
        this.stop();
      }
      return false;
    }
    return true;
  }

  *execute(): Generator<AiOrder> {
    if (
      !this.settler ||
      (this.settler.tile !== this.options.tile &&
        this.settler.actionPointsLeft) ||
      !this.settler.canDoAction("foundCity")
    ) {
      this.state = AiOperationState.failed;
      this.stop();
      return;
    }

    this.settler.doAction("foundCity");
  }

  private stop() {
    if (this.settler) {
      this.ai.units.unassign(this.settler);
    }
  }

  private findBestSettler(): UnitCore | null {
    const settlers = Array.from(this.ai.units.freeByTrait.settler);

    let closestSettler: UnitCore | null = null;
    let shortestDistance = Infinity;

    for (const settler of settlers) {
      const distance = this.options.tile.getDistanceTo(settler.tile);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        closestSettler = settler;
      }
    }

    return closestSettler;
  }
}
