import { TileDirection } from "@/shared";
import { TileCore } from "./tile";
import { TilesMapCore } from "./tiles-map";
import { getTileNeighbours } from "./hex-math";

describe("hex-math:utils", () => {
  it("#getTileNeighbours", () => {
    function toCoords(tiles: Iterable<TileCore>) {
      return Array.from(tiles).map((tile) => [tile.x, tile.y]);
    }

    const map = new TilesMapCore(5, 5);

    // top left
    expect(toCoords(getTileNeighbours(map.tiles, 0, 0))).toEqual([
      [1, 0],
      [0, 1],
    ]);

    // top
    expect(toCoords(getTileNeighbours(map.tiles, 2, 0))).toEqual([
      [3, 0],
      [2, 1],
      [1, 1],
      [1, 0],
    ]);

    // top right
    expect(toCoords(getTileNeighbours(map.tiles, 4, 0))).toEqual([
      [4, 1],
      [3, 1],
      [3, 0],
    ]);

    // right even
    expect(toCoords(getTileNeighbours(map.tiles, 4, 2))).toEqual([
      [3, 1],
      [4, 1],
      [4, 3],
      [3, 3],
      [3, 2],
    ]);

    // right odd
    expect(toCoords(getTileNeighbours(map.tiles, 4, 3))).toEqual([
      [4, 2],
      [4, 4],
      [3, 3],
    ]);

    // bottom right
    expect(toCoords(getTileNeighbours(map.tiles, 4, 4))).toEqual([
      [3, 3],
      [4, 3],
      [3, 4],
    ]);

    // bottom
    expect(toCoords(getTileNeighbours(map.tiles, 2, 4))).toEqual([
      [1, 3],
      [2, 3],
      [3, 4],
      [1, 4],
    ]);

    // bottom left
    expect(toCoords(getTileNeighbours(map.tiles, 0, 4))).toEqual([
      [0, 3],
      [1, 4],
    ]);

    // left even
    expect(toCoords(getTileNeighbours(map.tiles, 0, 2))).toEqual([
      [0, 1],
      [1, 2],
      [0, 3],
    ]);

    // left odd
    expect(toCoords(getTileNeighbours(map.tiles, 0, 3))).toEqual([
      [0, 2],
      [1, 2],
      [1, 3],
      [1, 4],
      [0, 4],
    ]);

    // middle even
    expect(toCoords(getTileNeighbours(map.tiles, 2, 2))).toEqual([
      [1, 1],
      [2, 1],
      [3, 2],
      [2, 3],
      [1, 3],
      [1, 2],
    ]);

    // middle odd
    expect(toCoords(getTileNeighbours(map.tiles, 2, 3))).toEqual([
      [2, 2],
      [3, 2],
      [3, 3],
      [3, 4],
      [2, 4],
      [1, 3],
    ]);
  });

  it("#getTileDirection", () => {
    // EVEN row
    const startEven = new TileCore(0, 2, 2);

    expect(startEven.getDirectionTo(new TileCore(0, 1, 1))).toBe(
      TileDirection.NW,
    );

    expect(startEven.getDirectionTo(new TileCore(0, 2, 1))).toBe(
      TileDirection.NE,
    );

    expect(startEven.getDirectionTo(new TileCore(0, 3, 2))).toBe(
      TileDirection.E,
    );

    expect(startEven.getDirectionTo(new TileCore(0, 2, 3))).toBe(
      TileDirection.SE,
    );

    expect(startEven.getDirectionTo(new TileCore(0, 1, 3))).toBe(
      TileDirection.SW,
    );

    expect(startEven.getDirectionTo(new TileCore(0, 1, 2))).toBe(
      TileDirection.W,
    );

    expect(startEven.getDirectionTo(new TileCore(0, 2, 2))).toBe(
      TileDirection.NONE,
    );

    expect(startEven.getDirectionTo(new TileCore(0, 3, 1))).toBe(
      TileDirection.NONE,
    );

    // ODD ROW
    const startOdd = new TileCore(0, 2, 3);

    expect(startOdd.getDirectionTo(new TileCore(0, 2, 2))).toBe(
      TileDirection.NW,
    );

    expect(startOdd.getDirectionTo(new TileCore(0, 3, 2))).toBe(
      TileDirection.NE,
    );

    expect(startOdd.getDirectionTo(new TileCore(0, 3, 3))).toBe(
      TileDirection.E,
    );

    expect(startOdd.getDirectionTo(new TileCore(0, 3, 4))).toBe(
      TileDirection.SE,
    );

    expect(startOdd.getDirectionTo(new TileCore(0, 2, 4))).toBe(
      TileDirection.SW,
    );

    expect(startOdd.getDirectionTo(new TileCore(0, 1, 3))).toBe(
      TileDirection.W,
    );

    expect(startOdd.getDirectionTo(new TileCore(0, 2, 3))).toBe(
      TileDirection.NONE,
    );

    expect(startOdd.getDirectionTo(new TileCore(0, 1, 2))).toBe(
      TileDirection.NONE,
    );
  });
});
