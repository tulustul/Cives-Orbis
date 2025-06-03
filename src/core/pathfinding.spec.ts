import { describe, it, expect, beforeEach } from "vitest";
import { PriorityQueue } from "./priority-queue";
import { getHexDistance, getHexDistanceManhattan, getEuclideanDistance } from "./hex-distance";
import { TileCore } from "./tile";
import { UnitCore } from "./unit";
import { findPath } from "./pathfinding";
import { TilesMapCore } from "./tiles-map";
import { PlayerCore } from "./player";
import { Game } from "./game";
import { dataManager } from "./data/dataManager";

describe("PriorityQueue", () => {
  let queue: PriorityQueue<string>;

  beforeEach(() => {
    queue = new PriorityQueue<string>();
  });

  it("should maintain min-heap property", () => {
    queue.push("high", 10);
    queue.push("low", 1);
    queue.push("medium", 5);

    expect(queue.pop()).toBe("low");
    expect(queue.pop()).toBe("medium");
    expect(queue.pop()).toBe("high");
  });

  it("should handle equal priorities correctly", () => {
    queue.push("first", 5);
    queue.push("second", 5);
    queue.push("third", 3);

    expect(queue.pop()).toBe("third");
    // Order of equal priorities is not guaranteed, but should be one of the two
    const next = queue.pop();
    expect(next === "first" || next === "second").toBe(true);
  });

  it("should return null when empty", () => {
    expect(queue.pop()).toBeNull();
    expect(queue.peek()).toBeNull();
  });

  it("should report size correctly", () => {
    expect(queue.size).toBe(0);
    expect(queue.isEmpty).toBe(true);

    queue.push("item", 1);
    expect(queue.size).toBe(1);
    expect(queue.isEmpty).toBe(false);

    queue.pop();
    expect(queue.size).toBe(0);
    expect(queue.isEmpty).toBe(true);
  });
});

describe("Hex Distance Calculations", () => {
  let map: TilesMapCore;
  let tiles: TileCore[];

  beforeEach(() => {
    map = new TilesMapCore(10, 10);
    tiles = [];
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        tiles.push(map.tiles[x][y]);
      }
    }
  });

  it("should calculate hex distance correctly for adjacent tiles", () => {
    const center = map.tiles[5][5];
    const adjacent = map.tiles[6][5]; // East neighbor
    
    expect(getHexDistance(center, adjacent)).toBe(1);
  });

  it("should calculate hex distance correctly for diagonal tiles", () => {
    const start = map.tiles[0][0];
    const end = map.tiles[2][2];
    
    const hexDist = getHexDistance(start, end);
    const euclideanDist = getEuclideanDistance(start, end);
    
    // Hex distance should be more accurate for hex grids
    expect(hexDist).toBeGreaterThan(0);
    expect(hexDist).toBeLessThanOrEqual(euclideanDist + 1); // Allow some tolerance
  });

  it("should return 0 for same tile", () => {
    const tile = map.tiles[3][3];
    expect(getHexDistance(tile, tile)).toBe(0);
    expect(getHexDistanceManhattan(tile, tile)).toBe(0);
    expect(getEuclideanDistance(tile, tile)).toBe(0);
  });

  it("should be symmetric", () => {
    const tile1 = map.tiles[2][3];
    const tile2 = map.tiles[7][6];
    
    expect(getHexDistance(tile1, tile2)).toBe(getHexDistance(tile2, tile1));
    expect(getHexDistanceManhattan(tile1, tile2)).toBe(getHexDistanceManhattan(tile2, tile1));
  });
});

describe("Pathfinding Performance", () => {
  let game: Game;
  let player: PlayerCore;
  let unit: UnitCore;
  let map: TilesMapCore;

  beforeEach(async () => {
    await dataManager.ready;
    
    game = new Game();
    map = new TilesMapCore(20, 20);
    game.map = map;
    map.precompute();

    const nation = dataManager.nations.all[0];
    player = new PlayerCore(game, nation);
    game.addPlayer(player);

    // Create a basic unit for testing
    const unitDef = dataManager.units.all[0];
    const startTile = map.tiles[5][5];
    unit = new UnitCore(startTile, unitDef, player, game.unitsManager);
    player.units.push(unit);
    startTile.units.push(unit);

    // Explore all tiles for testing
    for (let x = 0; x < 20; x++) {
      for (let y = 0; y < 20; y++) {
        player.exploredTiles.add(map.tiles[x][y]);
      }
    }
  });

  it("should find path between adjacent tiles", () => {
    const start = map.tiles[5][5];
    const end = map.tiles[6][5];
    
    const path = findPath(unit, end, start);
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(0);
    
    // Path should end at the target
    const lastTurn = path![path!.length - 1];
    const lastTile = lastTurn[lastTurn.length - 1];
    expect(lastTile).toBe(end);
  });

  it("should find path across longer distances", () => {
    const start = map.tiles[0][0];
    const end = map.tiles[10][10];
    
    const startTime = performance.now();
    const path = findPath(unit, end, start);
    const endTime = performance.now();
    
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(0);
    
    // Performance check - should complete within reasonable time
    expect(endTime - startTime).toBeLessThan(100); // 100ms threshold
  });

  it("should return null for same start and end", () => {
    const tile = map.tiles[5][5];
    const path = findPath(unit, tile, tile);
    expect(path).toBeNull();
  });

  it("should find shortest path", () => {
    const start = map.tiles[5][5];
    const end = map.tiles[8][5]; // 3 tiles away horizontally
    
    const path = findPath(unit, end, start);
    expect(path).not.toBeNull();
    
    // Path should reach the target
    const lastTurn = path![path!.length - 1];
    const lastTile = lastTurn[lastTurn.length - 1];
    expect(lastTile).toBe(end);
    
    // Count total moves (excluding starting position)
    const totalMoves = path!.reduce((count, turn) => count + turn.length, 0) - 1;
    expect(totalMoves).toBe(3); // Should be exactly 3 moves from start to end
  });
});