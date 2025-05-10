import { TileDirection } from "@/shared";
import { TileCore } from "@/core/tile";

export function getTileFullNeighbours(
  tiles: TileCore[][],
  x: number,
  y: number,
): (TileCore | null)[] {
  return [
    getTileInDirection(tiles, tiles[x][y], TileDirection.NW),
    getTileInDirection(tiles, tiles[x][y], TileDirection.NE),
    getTileInDirection(tiles, tiles[x][y], TileDirection.E),
    getTileInDirection(tiles, tiles[x][y], TileDirection.SE),
    getTileInDirection(tiles, tiles[x][y], TileDirection.SW),
    getTileInDirection(tiles, tiles[x][y], TileDirection.W),
  ];
}

export function getTileNeighbours(
  tiles: TileCore[][],
  x: number,
  y: number,
): TileCore[] {
  return getTileFullNeighbours(tiles, x, y).filter((t) => !!t) as TileCore[];
}

export function getTileInDirection(
  tiles: TileCore[][],
  tile: TileCore,
  direction: TileDirection,
): TileCore | null {
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
