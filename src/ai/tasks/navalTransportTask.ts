import { findPath } from "@/core/pathfinding";
import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { AIPlayer } from "../ai-player";
import { findClosestUnit } from "../utils";
import { CityProduceUnitTask } from "./cityProduceUnitTask";
import { MoveUnitOneTileTask } from "./moveUnitOneTileTask";
import { MoveUnitTask } from "./moveUnitTask";
import { ParallelTask } from "./parallelTask";
import { AiTask, AiTaskResult } from "./task";

export type NavalTransportTaskOptions = {
  unit: UnitCore;
  to: TileCore;
};

export type NavalTransportTaskSerialized = {
  options: {
    unit: number;
    to: number;
  };
  transport?: number;
  state: NavalTransportState;
};

type NavalTransportState =
  | "init"
  | "moveToGatheringPoint"
  | "sailing"
  | "travelingToDestination";

export class NavalTransportTask extends AiTask<NavalTransportTaskSerialized> {
  readonly type = "navalTransport";

  transport: UnitCore | null = null;

  state: NavalTransportState = "init";

  constructor(ai: AIPlayer, private options: NavalTransportTaskOptions) {
    super(ai);
    this.tick();
  }

  tick(): void {
    switch (this.state) {
      case "init":
        return this.init();

      case "moveToGatheringPoint":
        return this.moveToGatheringPoint();

      case "travelingToDestination":
        return this.travelToDestination();
    }
  }

  private init() {
    this.transport = findClosestUnit(
      Array.from(this.ai.units.freeByTrait.transport),
      this.options.to,
    );

    if (this.transport) {
      this.ai.units.assign(this.transport, "transport");
    } else {
      this.tasks.push(
        new CityProduceUnitTask(this.ai, {
          focus: "expansion",
          priority: 70,
          unitTrait: "transport",
          onCompleted: (transport) => {
            this.transport = transport;
            this.ai.units.assign(transport, "transport");
          },
        }),
      );
    }

    this.state = "moveToGatheringPoint";
    this.moveToGatheringPoint();
  }

  private moveToGatheringPoint() {
    if (!this.transport) {
      return this.fail();
    }

    const [gatheringLand, gatheringSea, targetSea] = this.findGatheringPoints();

    if (!gatheringLand || !gatheringSea || !targetSea) {
      return this.fail();
    }

    this.tasks.push(
      new ParallelTask(this.ai, [
        new MoveUnitTask(this.ai, {
          unit: this.options.unit,
          tile: gatheringLand,
        }),
        new MoveUnitTask(this.ai, {
          unit: this.transport,
          tile: gatheringSea,
        }),
      ]),
      new MoveUnitOneTileTask(this.ai, {
        unit: this.options.unit,
        tile: this.transport.tile,
      }),
      new MoveUnitTask(this.ai, {
        unit: this.transport,
        tile: targetSea,
        onCompleted: () => {
          if (this.transport) {
            this.ai.units.unassign(this.transport);
            this.transport = null;
          }
        },
      }),
      new MoveUnitTask(this.ai, {
        unit: this.options.unit,
        tile: this.options.to,
      }),
    );

    this.state = "travelingToDestination";
    this.travelToDestination();
  }

  private travelToDestination() {
    if (this.options.unit.tile === this.options.to) {
      this.complete();
    } else {
      this.fail();
    }
  }

  private findGatheringPoints(): [
    TileCore | null,
    TileCore | null,
    TileCore | null,
  ] {
    const unit = this.options.unit;
    const oldIsNaval = unit.isNaval;
    unit.isNaval = true;
    const path = findPath(unit, this.options.to);
    unit.isNaval = oldIsNaval;
    if (!path) {
      this.result = AiTaskResult.failed;
      return [null, null, null];
    }
    let gatheringLand: TileCore | null = null;
    let gatheringSea: TileCore | null = null;
    let targetSea: TileCore | null = null;
    let lastTile = unit.tile;
    for (const tiles of path) {
      for (const tile of tiles) {
        if (gatheringSea) {
          if (tile.isLand) {
            targetSea = lastTile;
            break;
          }
        }
        if (tile.isWater) {
          gatheringLand = lastTile;
          gatheringSea = tile;
        }
        lastTile = tile;
      }
      if (gatheringLand && gatheringSea && targetSea) {
        break;
      }
    }

    if (gatheringSea?.city) {
      gatheringSea = gatheringSea.neighbours.find((n) => n.isWater) ?? null;
    }

    return [gatheringLand, gatheringSea, targetSea];
  }

  cleanup(): void {
    if (this.transport) {
      this.ai.units.unassign(this.transport);
    }
  }

  serialize(): NavalTransportTaskSerialized {
    return {
      options: {
        unit: this.options.unit.id,
        to: this.options.to.id,
      },
      transport: this.transport ? this.transport.id : undefined,
      state: this.state,
    };
  }
}
