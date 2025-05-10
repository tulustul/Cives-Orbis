import { SeaLevel, TileDirection } from "@/shared";
import { TileCore } from "@/core/tile";

export function findCoastline(tiles: TileCore[][]): TileCore[] {
  const coastline: TileCore[] = [];
  for (let x = 0; x < tiles.length; x++) {
    for (let y = 0; y < tiles[x].length; y++) {
      const tile = tiles[x][y];
      if (tile.seaLevel !== SeaLevel.none) {
        continue;
      }
      if (tile.neighbours.find((t) => t.seaLevel !== SeaLevel.none)) {
        coastline.push(tile);
      }
    }
  }
  return coastline;
}

export function placeRiverBetweenTiles(tileA: TileCore, tileB: TileCore) {
  const direction = tileA.getDirectionTo(tileB);
  if (tileA.riverParts.includes(direction)) {
    return false;
  }
  tileA.riverParts.push(direction);
  tileB.riverParts.push(OPPOSITE_DIRECTIONS[direction]);
  return true;
}

// first direction is clockwise, second is counterclockwise
export const POSSIBLE_RIVER_DIRECTION_FROM_WATER_TILE: Record<
  TileDirection,
  [TileDirection, TileDirection]
> = {
  [TileDirection.NW]: [TileDirection.NE, TileDirection.W],
  [TileDirection.NE]: [TileDirection.E, TileDirection.NW],
  [TileDirection.E]: [TileDirection.SE, TileDirection.NE],
  [TileDirection.SE]: [TileDirection.SW, TileDirection.E],
  [TileDirection.SW]: [TileDirection.W, TileDirection.SE],
  [TileDirection.W]: [TileDirection.NW, TileDirection.SW],
  [TileDirection.NONE]: [TileDirection.NONE, TileDirection.NONE],
};

// flow is clockwise for first tile
export const POSSIBLE_BORDER_PATHS: Record<
  TileDirection,
  [[TileDirection, TileDirection], [TileDirection, TileDirection]]
> = {
  [TileDirection.NW]: [
    [TileDirection.NE, TileDirection.NW],
    [TileDirection.NONE, TileDirection.NE],
  ],
  [TileDirection.NE]: [
    [TileDirection.E, TileDirection.NE],
    [TileDirection.NONE, TileDirection.E],
  ],
  [TileDirection.E]: [
    [TileDirection.SE, TileDirection.E],
    [TileDirection.NONE, TileDirection.SE],
  ],
  [TileDirection.SE]: [
    [TileDirection.SW, TileDirection.SE],
    [TileDirection.NONE, TileDirection.SW],
  ],
  [TileDirection.SW]: [
    [TileDirection.W, TileDirection.SW],
    [TileDirection.NONE, TileDirection.W],
  ],
  [TileDirection.W]: [
    [TileDirection.NW, TileDirection.W],
    [TileDirection.NONE, TileDirection.NW],
  ],
  [TileDirection.NONE]: [
    [TileDirection.NONE, TileDirection.NONE],
    [TileDirection.NONE, TileDirection.NONE],
  ],
};

export const OPPOSITE_DIRECTIONS: Record<TileDirection, TileDirection> = {
  [TileDirection.NW]: TileDirection.SE,
  [TileDirection.NE]: TileDirection.SW,
  [TileDirection.E]: TileDirection.W,
  [TileDirection.SE]: TileDirection.NW,
  [TileDirection.SW]: TileDirection.NE,
  [TileDirection.W]: TileDirection.E,
  [TileDirection.NONE]: TileDirection.NONE,
};
