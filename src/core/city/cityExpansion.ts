import { collector } from "../collector";
import { TileCore } from "../tile";
import { CityCore } from "./city";

export class CityExpansion {
  totalCulture = 0;

  tiles = new Set<TileCore>();

  visibleTiles = new Set<TileCore>();

  constructor(public city: CityCore) {}

  progressExpansion() {
    this.totalCulture += this.city.perTurn.culture;
    const cultureToExpand = this.getCultureToExpand();
    if (this.totalCulture >= cultureToExpand) {
      this.totalCulture -= cultureToExpand;

      const tile = this.pickBestTileToExpand(
        this.city.tile,
        this.getTilesAvailableForExpansion(),
      );
      if (tile) {
        this.addTile(tile);
        tile.sweetSpotValue = 0;
      }
    }
  }

  getCultureToExpand() {
    return Math.ceil(5 * Math.pow(1.2, this.tiles.size));
  }

  get turnsToExpand() {
    const remainingCulture = this.getCultureToExpand() - this.totalCulture;
    return Math.ceil(remainingCulture / this.city.perTurn.culture);
  }

  getTilesAvailableForExpansion(): Set<TileCore> {
    const availableTiles = new Set<TileCore>();
    for (const tile of this.tiles) {
      for (const neighbour of tile.neighbours) {
        if (!neighbour.areaOf) {
          availableTiles.add(neighbour);
        }
      }
    }
    return availableTiles;
  }

  pickBestTileToExpand(
    cityTile: TileCore,
    tiles: Set<TileCore>,
  ): TileCore | null {
    let bestTile: TileCore | null = null;
    let bestScore = -Infinity;

    for (const tile of tiles) {
      const score = tile.totalYields - cityTile.getDistanceTo(tile) / 2;
      if (score > bestScore) {
        bestScore = score;
        bestTile = tile;
      }
    }

    return bestTile;
  }

  addTile(tile: TileCore) {
    if (!tile.areaOf) {
      this.tiles.add(tile);
      this.city.workers.notWorkedTiles.add(tile);
      tile.areaOf = this.city;
      this.city.player.exploreTiles([tile]);
      this.city.player.exploreTiles(tile.neighbours);
      collector.tileOwnershipChanges.add(tile);
    }
  }

  removeTile(tile: TileCore) {
    if (this.tiles.has(tile)) {
      this.tiles.delete(tile);
      tile.areaOf = null;
      collector.tileOwnershipChanges.add(tile);
    }
  }
}
