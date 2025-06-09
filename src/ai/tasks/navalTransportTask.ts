import { findPath } from "@/core/pathfinding";
import {
  tileToTileCoords,
  unitToIdAndName,
} from "@/core/serialization/channel";
import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { TileCoords, UnitIdAndName } from "@/shared";
import { findClosestUnit } from "../utils";
import { CityProduceUnitTask } from "./cityProduceUnitTask";
import { MoveUnitOneTileTask } from "./moveUnitOneTileTask";
import { MoveUnitTask } from "./moveUnitTask";
import { ParallelTask } from "./parallelTask";
import { AiTask, AiTaskOptions } from "./task";

export type NavalTransportTaskOptions = AiTaskOptions & {
  unit: UnitCore;
  to: TileCore;
};

export type NavalTransportTaskSerialized = {
  options: {
    unit: UnitIdAndName | null;
    to: TileCoords;
  };
  transport: UnitIdAndName | null;
  state: NavalTransportState;
};

type NavalTransportState =
  | "init"
  | "moveToGatheringPoint"
  | "sailing"
  | "travelingToDestination";

export class NavalTransportTask extends AiTask<
  NavalTransportTaskOptions,
  NavalTransportTaskSerialized
> {
  readonly type = "navalTransport";

  transport: UnitCore | null = null;

  state: NavalTransportState = "init";

  init() {
    this.transport = findClosestUnit(
      Array.from(this.ai.units.freeByTrait.transport),
      this.options.to,
    );

    if (this.transport) {
      this.ai.units.assign(this.transport, "transport");
    } else {
      this.addTask(
        new CityProduceUnitTask(this.ai, {
          focus: "expansion",
          priority: 70,
          unitTrait: ["transport"],
          passableArea: this.options.unit.tile.passableArea,
          onCompleted: (transport) => {
            this.transport = transport;
            this.ai.units.assign(transport, "transport");
          },
        }),
      );
    }

    this.state = "moveToGatheringPoint";
    if (!this.tasks.length) {
      this.moveToGatheringPoint();
    }
  }

  tick(): void {
    switch (this.state) {
      case "moveToGatheringPoint":
        return this.moveToGatheringPoint();

      case "travelingToDestination":
        return this.travelToDestination();
    }
  }

  private moveToGatheringPoint() {
    if (!this.transport) {
      return this.fail("No transport unit available");
    }

    const [gatheringLand, gatheringSea, targetSea] = this.findGatheringPoints();

    if (!gatheringLand || !gatheringSea || !targetSea) {
      return this.fail("No valid gathering points found");
    }

    this.addTask(
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
        tile: gatheringSea,
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
  }

  private travelToDestination() {
    if (this.options.unit.tile === this.options.to) {
      this.complete();
    } else {
      this.fail("Unit did not reach destination");
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
      return [null, null, null];
    }
    let gatheringLand: TileCore | null = null;
    let gatheringSea: TileCore | null = null;
    let targetSea: TileCore | null = null;
    let lastTile = unit.tile;
    for (const tiles of path) {
      for (const tile of tiles) {
        if (gatheringSea) {
          if (
            tile.isLand &&
            lastTile.passableArea === gatheringSea.passableArea
          ) {
            targetSea = lastTile;
          }
        }
        if (!gatheringLand && tile.isWater) {
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
        unit: unitToIdAndName(this.options.unit),
        to: tileToTileCoords(this.options.to),
      },
      transport: unitToIdAndName(this.transport),
      state: this.state,
    };
  }

  getProgressState(): string | null {
    // Track state, unit position, transport position, and child tasks
    const unitPos = this.options.unit.tile.id;
    const transportPos = this.transport?.tile.id ?? "none";
    return `${this.state}-${unitPos}-${transportPos}-${this.tasks.length}`;
  }
}
