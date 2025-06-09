import { TileCore } from "@/core/tile";
import { PassableArea } from "@/core/tiles-map";
import { UnitCore } from "@/core/unit";
import { CityProduceUnitTask } from "./cityProduceUnitTask";
import { MoveUnitTask } from "./moveUnitTask";
import { NavalTransportTask } from "./navalTransportTask";
import { AiTask, AiTaskOptions } from "./task";
import { UnitIdAndName, UnitTrait } from "@/shared";
import { unitToIdAndName } from "@/core/serialization/channel";
import { getMoveResult, MoveResult } from "@/core/movement";

export type ExploreTaskOptions = AiTaskOptions & {
  passableArea: PassableArea;
  priority?: number;
};

export type ExploreTaskSerialized = {
  options: {
    passableArea: number;
    priority?: number;
  };
  explorer: UnitIdAndName | null;
  targetTile?: number;
  lastExplorerPosition?: number;
};

export class ExploreTask extends AiTask<
  ExploreTaskOptions,
  ExploreTaskSerialized
> {
  readonly type = "explore";

  explorer: UnitCore | null = null;
  targetTile: TileCore | null = null;

  init() {
    this.ai.areas.assign(this.options.passableArea, "exploration");
    const trait: UnitTrait =
      this.options.passableArea.type === "land" ? "land" : "naval";

    let globalExplorels = Array.from(this.ai.units.freeByTrait.explorer).filter(
      (unit) => unit.definition.traits.includes(trait),
    );

    if (this.options.passableArea.type === "water") {
      globalExplorels = globalExplorels.filter(
        (unit) => unit.tile.passableArea === this.options.passableArea,
      );
    }

    const localExplorers = globalExplorels.filter((unit) =>
      this.unitOnCorrectArea(unit),
    );

    const explorers =
      localExplorers.length > 0 ? localExplorers : globalExplorels;

    if (explorers.length > 0) {
      this.explorer = explorers[0];
      this.explorer.path = null;
      this.explorer.setOrder(null);
      this.ai.units.assign(this.explorer, "exploration");
      return;
    }

    this.addTask(
      new CityProduceUnitTask(this.ai, {
        focus: "expansion",
        priority: this.options.priority || 100,
        unitTrait: ["explorer", trait],
        onCompleted: (unit) => {
          if (!unit) {
            this.fail("No explorer produced");
            return;
          }
          this.explorer = unit;
          this.ai.units.assign(unit, "exploration");
        },
      }),
    );
  }

  tick(): void {
    if (!this.explorer) {
      return this.fail("Explorer is not available");
    }

    if (!this.explorer.isAlive) {
      return this.fail("Explorer is dead");
    }

    if (this.explorer.isLand) {
      // Check if we need to move to this area first (naval transport)
      if (!this.unitOnCorrectArea(this.explorer)) {
        // Need naval transport to reach the target area
        const coastalTile = this.findCoastalTileInArea(
          this.options.passableArea,
        );
        if (!coastalTile) {
          return this.fail("No coastal access to target area");
        }

        this.addTask(
          new NavalTransportTask(this.ai, {
            unit: this.explorer,
            to: coastalTile,
            onFail: () => {
              if (this.explorer?.tile.passableArea) {
                this.ai.areas.unassign(
                  this.options.passableArea,
                  "exploration",
                );
                this.options.passableArea = this.explorer.tile.passableArea;
                this.ai.areas.assign(this.options.passableArea, "exploration");
              }
            },
          }),
        );
      }
    } else {
      if (!this.unitOnCorrectArea(this.explorer)) {
        return this.fail("Explorer is not on the correct area");
      }
    }

    // We're in the right area, find unexplored tiles
    if (!this.targetTile || this.explorer.tile === this.targetTile) {
      this.ai.tiles.unassign(this.targetTile, "exploration");
      this.targetTile = this.findUnexploredTile();
      this.ai.tiles.assign(this.targetTile, "exploration");
      if (!this.targetTile) {
        this.complete();
        return;
      }
    }

    if (this.explorer.tile !== this.targetTile) {
      this.addTask(
        new MoveUnitTask(this.ai, {
          unit: this.explorer,
          tile: this.targetTile,
        }),
      );
      this.tickBranch();
    }
  }

  private findUnexploredTile(): TileCore | null {
    if (!this.explorer) {
      return null;
    }

    const edgeOfUnknown = this.ai.exploringAI.edgeOfUnknown.get(
      this.options.passableArea,
    );

    if (!edgeOfUnknown?.size) {
      return null;
    }

    // Find closest unexplored edge
    let closestTile: TileCore | null = null;
    let closestDistance = Infinity;

    for (const tile of edgeOfUnknown) {
      let skip = false;
      for (const currentTarget of this.ai.tiles.byAssignment.exploration) {
        if (currentTarget.getDistanceTo(tile) < 3) {
          skip = true;
        }
      }
      if (skip) {
        continue;
      }

      const moveResult = getMoveResult(this.explorer, this.explorer.tile, tile);
      if (moveResult === MoveResult.none) {
        continue;
      }

      const distance = this.explorer!.tile.getDistanceTo(tile);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTile = tile;
      }
    }

    return closestTile;
  }

  private findCoastalTileInArea(area: PassableArea): TileCore | null {
    const coastalTiles: TileCore[] = [];

    for (const tile of this.ai.player.exploredTiles) {
      if (tile.passableArea === area && tile.isLand) {
        const hasWaterNeighbor = tile.neighbours.some((n) => n.isWater);
        if (hasWaterNeighbor) {
          coastalTiles.push(tile);
        }
      }
    }

    if (coastalTiles.length === 0) {
      return null;
    }

    // Return a random coastal tile
    return coastalTiles[Math.floor(Math.random() * coastalTiles.length)];
  }

  private unitOnCorrectArea(unit: UnitCore): boolean {
    let ok = unit.tile.passableArea === this.options.passableArea;
    if (unit.isNaval) {
      for (const neighbour of unit.tile.neighbours) {
        if (neighbour.passableArea === this.options.passableArea) {
          ok = true;
          break;
        }
      }
    }
    return ok;
  }

  cleanup(): void {
    if (this.explorer) {
      this.ai.units.unassign(this.explorer);
    }
    if (this.targetTile) {
      this.ai.tiles.unassign(this.targetTile, "exploration");
    }
    this.ai.areas.unassign(this.options.passableArea, "exploration");
  }

  serialize(): ExploreTaskSerialized {
    return {
      options: {
        passableArea: this.options.passableArea.id,
        priority: this.options.priority,
      },
      explorer: unitToIdAndName(this.explorer),
      targetTile: this.targetTile?.id,
    };
  }

  getProgressState(): string | null {
    // Track explorer position, target, and whether we have an explorer
    const explorerPos = this.explorer?.tile.id ?? "none";
    const targetPos = this.targetTile?.id ?? "none";
    const hasExplorer = this.explorer ? "yes" : "no";
    return `${explorerPos}-${targetPos}-${hasExplorer}`;
  }
}
