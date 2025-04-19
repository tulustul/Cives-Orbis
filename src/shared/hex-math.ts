import { TileCore } from "@/core/tile";
import { TileDirection } from ".";
import { BaseTile } from "./tile.interface";

export function getTileFullNeighbours<T extends BaseTile>(
  tiles: T[][],
  x: number,
  y: number,
): (T | null)[] {
  return [
    getTileInDirection(tiles, tiles[x][y], TileDirection.NW),
    getTileInDirection(tiles, tiles[x][y], TileDirection.NE),
    getTileInDirection(tiles, tiles[x][y], TileDirection.E),
    getTileInDirection(tiles, tiles[x][y], TileDirection.SE),
    getTileInDirection(tiles, tiles[x][y], TileDirection.SW),
    getTileInDirection(tiles, tiles[x][y], TileDirection.W),
  ];
}

export function getTileNeighbours<T extends BaseTile>(
  tiles: T[][],
  x: number,
  y: number,
): T[] {
  return getTileFullNeighbours(tiles, x, y).filter((t) => !!t) as T[];
}

export function getTileInDirection<T extends BaseTile>(
  tiles: T[][],
  tile: T,
  direction: TileDirection,
): T | null {
  switch (direction) {
    case TileDirection.NW:
      if ((tile.y % 2 === 0 && tile.x === 0) || tile.y === 0) {
        return null;
      }
      return tiles[tile.x - (tile.y % 2 ? 0 : 1)][tile.y - 1];

    case TileDirection.NE:
      if ((tile.y % 2 && tile.x === tiles.length - 1) || tile.y === 0) {
        return null;
      }
      return tiles[tile.x + (tile.y % 2 ? 1 : 0)][tile.y - 1];

    case TileDirection.E:
      if (tile.x === tiles.length - 1) {
        return null;
      }
      return tiles[tile.x + 1][tile.y];

    case TileDirection.SE:
      if (
        (tile.y % 2 && tile.x === tiles.length - 1) ||
        tile.y === tiles[tile.x].length - 1
      ) {
        return null;
      }
      return tiles[tile.x + (tile.y % 2 ? 1 : 0)][tile.y + 1];

    case TileDirection.SW:
      if (
        (tile.y % 2 === 0 && tile.x === 0) ||
        tile.y === tiles[tile.x].length - 1
      ) {
        return null;
      }
      return tiles[tile.x - (tile.y % 2 ? 0 : 1)][tile.y + 1];

    case TileDirection.W:
      if (tile.x === 0) {
        return null;
      }
      return tiles[tile.x - 1][tile.y];
  }
  return null;
}

export function getDirectionTo(
  fromtile: BaseTile,
  toTile: BaseTile,
): TileDirection {
  if (
    toTile.x === fromtile.x - (fromtile.y % 2 ? 0 : 1) &&
    toTile.y === fromtile.y - 1
  ) {
    return TileDirection.NW;
  }
  if (
    toTile.x === fromtile.x + (fromtile.y % 2 ? 1 : 0) &&
    toTile.y === fromtile.y - 1
  ) {
    return TileDirection.NE;
  }
  if (toTile.x === fromtile.x + 1 && toTile.y === fromtile.y) {
    return TileDirection.E;
  }
  if (
    toTile.x === fromtile.x + (fromtile.y % 2 ? 1 : 0) &&
    toTile.y === fromtile.y + 1
  ) {
    return TileDirection.SE;
  }
  if (
    toTile.x === fromtile.x - (fromtile.y % 2 ? 0 : 1) &&
    toTile.y === fromtile.y + 1
  ) {
    return TileDirection.SW;
  }
  if (toTile.x === fromtile.x - 1 && toTile.y === fromtile.y) {
    return TileDirection.W;
  }
  return TileDirection.NONE;
}

export function getTilesInRange(tile: TileCore, range: number): Set<TileCore> {
  const result = new Set<TileCore>([tile]);
  for (let i = 0; i < range; i++) {
    const neighbours = new Set<TileCore>();
    for (const tile of result) {
      for (const neighbour of (tile as any).neighbours) {
        // TODO fix typing
        neighbours.add(neighbour);
      }
    }
    for (const tile of neighbours) {
      result.add(tile);
    }
  }
  return result;
}
