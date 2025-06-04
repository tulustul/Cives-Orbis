import { TileCore } from "@/core/tile";
import { PassableArea } from "@/core/tiles-map";
import { UnitCore } from "@/core/unit";
import { CityProduceUnitTask } from "./cityProduceUnitTask";
import { MoveUnitTask } from "./moveUnitTask";
import { NavalTransportTask } from "./navalTransportTask";
import { AiTask, AiTaskOptions } from "./task";
import { UnitTrait } from "@/shared";
import { AIPlayer } from "../ai-player";

export type ExploreTaskOptions = AiTaskOptions & {
  passableArea: PassableArea;
  priority?: number;
};

export type ExploreTaskSerialized = {
  options: {
    passableArea: number;
    priority?: number;
  };
  explorer?: number;
  targetTile?: number;
  lastExplorerPosition?: number;
};

type ExploreState = "init" | "exploring";

export class ExploreTask extends AiTask<
  ExploreTaskOptions,
  ExploreTaskSerialized
> {
  readonly type = "explore";

  explorer: UnitCore | null = null;
  targetTile: TileCore | null = null;
  state: ExploreState = "init";

  constructor(ai: AIPlayer, options: ExploreTaskOptions) {
    super(ai, options);
    this.tick();
  }

  tick(): void {
    switch (this.state) {
      case "init":
        return this.init();
      case "exploring":
        return this.explore();
    }
  }

  private init(): void {
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
      this.state = "exploring";
      return;
    }

    this.tasks.push(
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

    this.state = "exploring";
  }

  private explore(): void {
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

        this.tasks.push(
          new NavalTransportTask(this.ai, {
            unit: this.explorer,
            to: coastalTile,
          }),
        );
        return;
      }
    } else {
      if (!this.unitOnCorrectArea(this.explorer)) {
        return this.fail("Explorer is not on the correct area");
      }
    }

    // We're in the right area, find unexplored tiles
    if (!this.targetTile || this.explorer.tile === this.targetTile) {
      this.targetTile = this.findUnexploredTile();
      if (!this.targetTile) {
        // Area fully explored - unassign unit so IdleUnitsAI can handle it
        this.ai.units.unassign(this.explorer);
        this.complete();
        return;
      }
    }

    this.tasks.push(
      new MoveUnitTask(this.ai, {
        unit: this.explorer,
        tile: this.targetTile,
      }),
    );
  }

  private findUnexploredTile(): TileCore | null {
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
  }

  serialize(): ExploreTaskSerialized {
    return {
      options: {
        passableArea: this.options.passableArea.id,
        priority: this.options.priority,
      },
      explorer: this.explorer?.id,
      targetTile: this.targetTile?.id,
    };
  }

  getProgressState(): string | null {
    // Track explorer position, target, and whether we have an explorer
    const explorerPos = this.explorer?.tile.id ?? "none";
    const targetPos = this.targetTile?.id ?? "none";
    const hasExplorer = this.explorer ? "yes" : "no";
    return `${this.state}-${explorerPos}-${targetPos}-${hasExplorer}`;
  }
}
