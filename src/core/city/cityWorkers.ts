import { TileCore } from "@/core/tile";
import { CityCore } from "./city";
import { ResourceDeposit } from "../resources";

export class CityWorkers {
  workedTiles = new Set<TileCore>();

  notWorkedTiles = new Set<TileCore>();

  workedResources = new Set<ResourceDeposit>();

  constructor(public city: CityCore) {}

  workTile(tile: TileCore, updateYields = true) {
    if (this.freeTileWorkers && this.city.expansion.tiles.has(tile)) {
      this.workedTiles.add(tile);
      this.notWorkedTiles.delete(tile);
      if (tile.resource) {
        this.workedResources.add(tile.resource);
      }
      if (updateYields) {
        this.city.updateYields();
      }
    }
  }

  unworkTile(tile: TileCore, updateYields = true) {
    this.workedTiles.delete(tile);
    this.notWorkedTiles.add(tile);
    if (tile.resource) {
      this.workedResources.delete(tile.resource);
    }
    if (updateYields) {
      this.city.updateYields();
    }
  }

  optimizeYields() {
    this.workedTiles.clear();
    this.notWorkedTiles = new Set(this.city.expansion.tiles);
    while (this.freeTileWorkers && this.notWorkedTiles.size) {
      const tile = this.pickBestTile(this.notWorkedTiles);
      if (!tile) {
        break;
      }
      this.workTile(tile, false);
    }
    this.city.updateYields();
  }

  get freeTileWorkers() {
    return this.city.population.total - this.workedTiles.size;
  }

  pickBestTile(tiles: Set<TileCore>): TileCore | null {
    let bestTile: TileCore | null = null;
    let bestYields = 0;

    for (const tile of tiles) {
      const yields = tile.totalYields;
      if (yields > bestYields) {
        bestYields = yields;
        bestTile = tile;
      }
    }

    return bestTile;
  }

  pickWorstTile(tiles: Set<TileCore>): TileCore | null {
    let worstTile: TileCore | null = null;
    let worstYields = Infinity;

    for (const tile of tiles) {
      const yields = tile.totalYields;
      if (yields < worstYields) {
        worstYields = yields;
        worstTile = tile;
      }
    }

    return worstTile;
  }

  updateWorkers() {
    while (this.freeTileWorkers != 0) {
      if (this.freeTileWorkers > 0) {
        const tile = this.pickBestTile(this.notWorkedTiles);
        if (!tile) {
          break;
        }
        this.workTile(tile);
      } else {
        const tile = this.pickWorstTile(this.workedTiles);
        if (!tile) {
          break;
        }
        this.unworkTile(tile);
      }
    }
  }
}
