import { TileCore } from "./tile";
import { collector } from "./collector";

export class AreaCore {
  id = 0;

  tiles = new Set<TileCore>();

  constructor(public primaryColor: string, public secondaryColor: string) {}

  add(tile: TileCore) {
    this.tiles.add(tile);
    collector.addAreaTiles(this.id, [tile]);
  }

  addBulk(tiles: TileCore[]) {
    for (const tile of tiles) {
      this.tiles.add(tile);
    }
    collector.addAreaTiles(this.id, tiles);
  }

  remove(tile: TileCore) {
    this.tiles.delete(tile);
    collector.removeAreaTiles(this.id, [tile]);
  }

  removeBulk(tiles: TileCore[]) {
    for (const tile of tiles) {
      this.tiles.delete(tile);
    }
    collector.removeAreaTiles(this.id, tiles);
  }
}
