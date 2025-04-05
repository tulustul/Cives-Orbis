import { TileCore } from "@/core/tile";
import { CityCore } from "./city";

export class CityWorkers {
  workedTiles = new Set<TileCore>();

  notWorkedTiles = new Set<TileCore>();

  constructor(public city: CityCore) {}

  workTile(tile: TileCore, updateYields = true) {
    if (this.freeTileWorkers && this.city.expansion.tiles.has(tile)) {
      this.workedTiles.add(tile);
      this.notWorkedTiles.delete(tile);
      if (updateYields) {
        this.city.updateYields();
      }
    }
  }

  unworkTile(tile: TileCore, updateYields = true) {
    this.workedTiles.delete(tile);
    this.notWorkedTiles.add(tile);
    if (updateYields) {
      this.city.updateYields();
    }
  }

  optimizeYields() {
    this.workedTiles.clear();
    this.notWorkedTiles = new Set(this.city.expansion.tiles);
    while (this.freeTileWorkers && this.notWorkedTiles.size) {
      const tile = this.pickBestTileToWork(this.notWorkedTiles);
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

  pickBestTileToWork(tiles: Set<TileCore>): TileCore | null {
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
}
