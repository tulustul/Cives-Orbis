import { TileDirection } from "@/shared";
import { DistrictDefinition } from "../data/types";
import { TileCore } from "../tile";
import { CityCore } from "./city";
import { collector } from "../collector";

export type District = {
  tile: TileCore;
  def: DistrictDefinition;
  city: CityCore;
  direction: TileDirection; // hint for rendering
};

export class CityDistricts {
  all: District[] = [];

  constructor(public city: CityCore) {}

  add(def: DistrictDefinition, tile: TileCore) {
    const cityNeighbour = tile.neighbours.find((n) => n.city === this.city);
    const direction = cityNeighbour
      ? tile.getDirectionTo(cityNeighbour)
      : TileDirection.NW;
    const district: District = { tile, def, city: this.city, direction };
    this.all.push(district);
    tile.district = district;
    collector.tiles.add(tile);
  }

  get(defId: string): District | null {
    return this.all.find((d) => d.def.id === defId) || null;
  }

  getAvailableTiles(def: DistrictDefinition): TileCore[] {
    const sourceTiles = [this.city.tile, ...this.all.map((d) => d.tile)];
    const tiles = new Set<TileCore>();
    for (const sourceTile of sourceTiles) {
      for (const tile of sourceTile.neighbours) {
        if (
          tile.district ||
          tile.city ||
          tile.areaOf !== this.city ||
          tile.seaLevel !== def.seaLevel
        ) {
          continue;
        }
        tiles.add(tile);
      }
    }
    return Array.from(tiles);
  }
}
