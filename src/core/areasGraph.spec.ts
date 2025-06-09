import { describe, it, expect } from "vitest";
import { AreasGraph } from "./areasGraph";
import { LandForm, SeaLevel } from "@/shared";
import { makeGame, SymbolCallbacks, GameFactoryOptions } from "./tests/game-factory";

describe("AreasGraph", () => {
  const symbolCallbacks: SymbolCallbacks = {
    "W": (_, tile) => {
      tile.seaLevel = SeaLevel.shallow;
    },
    "M": (_, tile) => {
      tile.landForm = LandForm.mountains;
    },
  };

  const gameOptions: Partial<GameFactoryOptions> = {
    playersCount: 1,
    symbolCallbacks,
  };

  it("should build connections between neighboring areas", () => {
    // Create a map with 3 distinct areas:
    // . = land, W = water, M = mountain (impassable)
    const mapData = [
      ". . W W . .",
      " . . W W . .",
      ". . W W . .",
    ];

    const game = makeGame(mapData, gameOptions);
    const graph = new AreasGraph();
    graph.buildFromTilesMap(game.map);

    // Get area IDs from the map
    const landArea1 = game.map.tiles[0][0].passableArea!;
    const waterArea = game.map.tiles[2][0].passableArea!;
    const landArea2 = game.map.tiles[4][0].passableArea!;

    // Land areas should be connected to water area
    expect(graph.areDirectlyConnected(landArea1.id, waterArea.id)).toBe(true);
    expect(graph.areDirectlyConnected(landArea2.id, waterArea.id)).toBe(true);
    
    // Land areas should not be directly connected to each other
    expect(graph.areDirectlyConnected(landArea1.id, landArea2.id)).toBe(false);
  });

  it("should find the shortest path between areas", () => {
    const mapData = [
      ". . W W . .",
      " . . W W . .",
      ". . W W . .",
    ];

    const game = makeGame(mapData, gameOptions);
    const graph = new AreasGraph();
    graph.buildFromTilesMap(game.map);

    const landArea1 = game.map.tiles[0][0].passableArea!;
    const waterArea = game.map.tiles[2][0].passableArea!;
    const landArea2 = game.map.tiles[4][0].passableArea!;

    // Path from land area 1 to land area 2 should go through water area
    const path = graph.findPath(landArea1.id, landArea2.id);
    expect(path).toEqual([landArea1.id, waterArea.id, landArea2.id]);
  });

  it("should return single area for same start and end", () => {
    const mapData = [". . . .", " . . . .", ". . . ."];
    const game = makeGame(mapData, gameOptions);
    const graph = new AreasGraph();
    graph.buildFromTilesMap(game.map);

    const area = game.map.tiles[0][0].passableArea!;
    const path = graph.findPath(area.id, area.id);
    expect(path).toEqual([area.id]);
  });

  it("should return null for non-existent areas", () => {
    const mapData = [". . . .", " . . . .", ". . . ."];
    const game = makeGame(mapData, gameOptions);
    const graph = new AreasGraph();
    graph.buildFromTilesMap(game.map);

    const path = graph.findPath(1, 999);
    expect(path).toBeNull();
  });

  it("should get connected areas", () => {
    const mapData = [
      ". . W W . .",
      " . . W W . .",
      ". . W W . .",
    ];
    const game = makeGame(mapData, gameOptions);
    const graph = new AreasGraph();
    graph.buildFromTilesMap(game.map);

    const waterArea = game.map.tiles[2][0].passableArea!;
    const connectedToWater = graph.getConnectedAreas(waterArea.id);
    expect(connectedToWater).toHaveLength(2);
    
    // Get the land areas
    const landArea1 = game.map.tiles[0][0].passableArea!;
    const landArea2 = game.map.tiles[4][0].passableArea!;
    expect(connectedToWater.map(a => a.id).sort()).toEqual([landArea1.id, landArea2.id].sort());
  });

  it("should find areas within distance", () => {
    const mapData = [
      ". . W W . . . . W W .",
      " . . W W . . . . W W .",
      ". . W W . . . . W W .",
    ];
    const game = makeGame(mapData, gameOptions);
    const graph = new AreasGraph();
    graph.buildFromTilesMap(game.map);

    const leftLand = game.map.tiles[0][0].passableArea!;
    const leftWater = game.map.tiles[2][0].passableArea!;
    const middleLand = game.map.tiles[5][0].passableArea!;

    // From left land, distance 0 should only include itself
    const distance0 = graph.findAreasWithinDistance(leftLand.id, 0);
    expect(distance0).toEqual([leftLand.id]);

    // From left land, distance 1 should include left land and left water
    const distance1 = graph.findAreasWithinDistance(leftLand.id, 1);
    expect(distance1.sort()).toEqual([leftLand.id, leftWater.id].sort());

    // From left land, distance 2 should include left land, left water, and middle land
    const distance2 = graph.findAreasWithinDistance(leftLand.id, 2);
    expect(distance2.sort()).toEqual([leftLand.id, leftWater.id, middleLand.id].sort());
  });

  it("should handle disconnected areas", () => {
    const mapData = [
      ". . M M . .",
      " . . M M . .",
      ". . M M . .",
    ];
    const game = makeGame(mapData, gameOptions);
    const graph = new AreasGraph();
    graph.buildFromTilesMap(game.map);

    const leftArea = game.map.tiles[0][0].passableArea!;
    const rightArea = game.map.tiles[4][0].passableArea!;

    // Areas should not be connected
    expect(graph.areDirectlyConnected(leftArea.id, rightArea.id)).toBe(false);
    
    // Path should not exist
    const path = graph.findPath(leftArea.id, rightArea.id);
    expect(path).toBeNull();
  });
});