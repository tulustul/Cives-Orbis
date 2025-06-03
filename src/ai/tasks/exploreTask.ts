import { PassableArea } from "@/core/tiles-map";
import { getMoveResult, MoveResult } from "@/core/movement";
import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { AIPlayer } from "../ai-player";
import { AiTask } from "./task";
import { MoveUnitTask } from "./moveUnitTask";
import { NavalTransportTask } from "./navalTransportTask";
import { CityProduceUnitTask } from "./cityProduceUnitTask";

export type ExploreTaskOptions = {
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

export class ExploreTask extends AiTask<ExploreTaskSerialized> {
  readonly type = "explore";

  explorer: UnitCore | null = null;
  targetTile: TileCore | null = null;
  state: ExploreState = "init";
  lastExplorerPosition: TileCore | null = null;

  constructor(ai: AIPlayer, public options: ExploreTaskOptions) {
    super(ai);
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
    // First, try to find an explorer already in this area
    const localExplorers = Array.from(this.ai.units.freeByTrait.explorer).filter(
      (unit) => unit.tile.passableArea === this.options.passableArea
    );

    if (localExplorers.length > 0) {
      this.explorer = localExplorers[0];
      this.ai.units.assign(this.explorer, "exploration");
      this.state = "exploring";
      return;
    }

    // Check if this area has any cities - if not, try to transport an explorer from elsewhere
    const hasCity = this.ai.player.cities.some(
      (city) => city.tile.passableArea === this.options.passableArea
    );

    if (!hasCity) {
      // Try to find an explorer from another area to transport
      const availableExplorers = Array.from(this.ai.units.freeByTrait.explorer).filter(
        (unit) => unit.tile.passableArea !== this.options.passableArea
      );

      if (availableExplorers.length > 0) {
        // Prefer land explorers over naval ones for overseas exploration
        const landExplorers = availableExplorers.filter(unit => unit.isLand);
        
        if (landExplorers.length > 0) {
          // Find the explorer closest to a coast
          let bestExplorer = landExplorers[0];
          let minDistanceToCoast = Infinity;
          
          for (const explorer of landExplorers) {
            const distanceToCoast = this.getDistanceToNearestCoast(explorer);
            if (distanceToCoast < minDistanceToCoast) {
              minDistanceToCoast = distanceToCoast;
              bestExplorer = explorer;
            }
          }
          
          this.explorer = bestExplorer;
        } else {
          // Use a naval explorer if no land explorers available
          this.explorer = availableExplorers[0];
        }
        
        this.ai.units.assign(this.explorer, "exploration");
        this.state = "exploring";
        return;
      }
    }

    // No existing explorer available, request production
    this.tasks.push(
      new CityProduceUnitTask(this.ai, {
        focus: "expansion",
        priority: this.options.priority || 100,
        unitTrait: "explorer",
        passableArea: hasCity ? this.options.passableArea : undefined, // Don't restrict if no city
        onCompleted: (unit) => {
          if (!unit) {
            this.fail();
            return;
          }
          this.explorer = unit;
          this.ai.units.assign(unit, "exploration");
        },
      })
    );

    this.state = "exploring";
  }

  private explore(): void {
    if (!this.explorer) {
      return this.fail();
    }

    // Check if we need to move to this area first (naval transport)
    if (this.explorer.tile.passableArea !== this.options.passableArea) {
      // Need naval transport to reach the target area
      const coastalTile = this.findCoastalTileInArea(this.options.passableArea);
      if (!coastalTile) {
        return this.fail(); // No coastal access to target area
      }

      this.tasks.push(
        new NavalTransportTask(this.ai, {
          unit: this.explorer,
          to: coastalTile,
        })
      );
      return;
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

    // Check if explorer has made progress
    if (this.lastExplorerPosition === this.explorer.tile) {
      // Explorer hasn't moved, might be stuck
      this.targetTile = this.findUnexploredTile();
      if (!this.targetTile) {
        this.complete();
        return;
      }
    }
    this.lastExplorerPosition = this.explorer.tile;

    // Move towards target
    this.tasks.push(
      new MoveUnitTask(this.ai, {
        unit: this.explorer,
        tile: this.targetTile,
      })
    );
  }

  private findUnexploredTile(): TileCore | null {
    const edgeOfUnknown = new Set<TileCore>();
    
    // Find tiles at the edge of explored territory in this area
    for (const tile of this.ai.player.exploredTiles) {
      if (tile.passableArea !== this.options.passableArea) {
        continue;
      }
      
      for (const neighbour of tile.neighbours) {
        if (
          !neighbour.isMapEdge &&
          !this.ai.player.exploredTiles.has(neighbour) &&
          getMoveResult(this.explorer!, tile, neighbour) === MoveResult.move
        ) {
          edgeOfUnknown.add(tile);
        }
      }
    }

    if (edgeOfUnknown.size === 0) {
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

  private getDistanceToNearestCoast(unit: UnitCore): number {
    let minDistance = Infinity;
    
    // Find all coastal tiles in the unit's area
    for (const tile of this.ai.player.exploredTiles) {
      if (tile.passableArea === unit.tile.passableArea && tile.isLand) {
        const hasWaterNeighbor = tile.neighbours.some((n) => n.isWater);
        if (hasWaterNeighbor) {
          const distance = unit.tile.getDistanceTo(tile);
          if (distance < minDistance) {
            minDistance = distance;
          }
        }
      }
    }
    
    return minDistance;
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
      lastExplorerPosition: this.lastExplorerPosition?.id,
    };
  }

  getProgressState(): string | null {
    // Track explorer position, target, and whether we have an explorer
    const explorerPos = this.explorer?.tile.id ?? 'none';
    const targetPos = this.targetTile?.id ?? 'none';
    const hasExplorer = this.explorer ? 'yes' : 'no';
    return `${this.state}-${explorerPos}-${targetPos}-${hasExplorer}`;
  }
}