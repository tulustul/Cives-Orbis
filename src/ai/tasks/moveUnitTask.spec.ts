import { Game } from "@/core/game";
import {
  GameFactoryOptions,
  makeGame,
  SymbolCallbacks,
} from "@/core/tests/game-factory";
import { dumpMap, putRiver } from "@/core/tests/map-utils";
import { LandForm, SeaLevel, TileDirection } from "@/shared";
import { AIPlayer } from "../ai-player";
import { MoveUnitTask } from "./moveUnitTask";

const symbolCallbacks: SymbolCallbacks = {
  W: (game, tile) =>
    game.unitsManager.spawn("unit_warrior", tile, game.players[0]),
  S: (game, tile) =>
    game.unitsManager.spawn("unit_scout", tile, game.players[0]),
  M: (_, tile) => (tile.landForm = LandForm.mountains),
  "~": (_, tile) => (tile.seaLevel = SeaLevel.shallow),
  C: (game, tile) => game.citiesManager.spawn(tile, game.players[0], true),
};

const gameOptions: Partial<GameFactoryOptions> = {
  playersCount: 1,
  symbolCallbacks,
};

function dumpUnits(game: Game) {
  return dumpMap(game.map, (tile) => {
    const unit = tile.units[0];
    if (!unit) return ".";
    return unit.definition.id === "unit_warrior" ? "W" : "S";
  });
}

describe("MoveUnitTask", () => {
  let game: Game;
  let ai: AIPlayer;

  beforeEach(() => {
    // Create a fresh game for each test
  });

  describe("Successful Movement", () => {
    it("should move unit to adjacent tile", async () => {
      const mapData = [
        "W . . . . . . . . .",
        " . . . . . . . . . .",
        ". . . . . . . . . .",
        " . . . . . . . . . .",
        ". . . . . . . . . .",
      ];

      game = makeGame(mapData, gameOptions);
      ai = new AIPlayer(game.players[0]);
      const unit = game.players[0].units[0];
      const targetTile = game.map.tiles[1][0]; // Adjacent tile

      expect(dumpUnits(game)).toEqual([
        "W . . . . . . . . .",
        " . . . . . . . . . .",
        ". . . . . . . . . .",
        " . . . . . . . . . .",
        ". . . . . . . . . .",
      ]);

      const task = new MoveUnitTask(ai, {
        tile: targetTile,
        unit: unit,
      });

      // Execute movement - adjacent tile moves complete immediately
      task.tick();

      expect(task.result).toBe("completed"); // Adjacent movement completes on first tick
      expect(unit.order).toBeNull(); // Order cleared when movement completes
      expect(dumpUnits(game)).toEqual([
        ". W . . . . . . . .",
        " . . . . . . . . . .",
        ". . . . . . . . . .",
        " . . . . . . . . . .",
        ". . . . . . . . . .",
      ]);
    });

    it("should complete immediately if unit is already at target", () => {
      const mapData = [
        "W . . . . . . . . .",
        " . . . . . . . . . .",
        ". . . . . . . . . .",
        " . . . . . . . . . .",
        ". . . . . . . . . .",
      ];

      game = makeGame(mapData, gameOptions);
      ai = new AIPlayer(game.players[0]);
      const unit = game.players[0].units[0];
      const targetTile = unit.tile; // Same tile

      const task = new MoveUnitTask(ai, {
        tile: targetTile,
        unit: unit,
      });

      task.tick();

      expect(task.result).toBe("completed");
      expect(unit.order).toBeNull();
    });

    it("should call onCompleted callback when movement finishes", () => {
      const mapData = [
        "W . . . . . . . . .",
        " . . . . . . . . . .",
        ". . . . . . . . . .",
        " . . . . . . . . . .",
        ". . . . . . . . . .",
      ];

      game = makeGame(mapData, gameOptions);
      ai = new AIPlayer(game.players[0]);
      const unit = game.players[0].units[0];
      const targetTile = unit.tile;

      let callbackCalled = false;
      const task = new MoveUnitTask(ai, {
        tile: targetTile,
        unit: unit,
        onCompleted: () => {
          callbackCalled = true;
        },
      });

      task.tick();

      expect(task.result).toBe("completed");
      expect(callbackCalled).toBe(true);
    });
  });

  describe("Movement Across Different Terrain", () => {
    it("should move unit across multiple tiles", () => {
      const mapData = [
        "W . . . . . . . . .",
        " . . . . . . . . . .",
        ". . . . . . . . . .",
        " . . . . . . . . . .",
        ". . . . . . . . . .",
      ];

      game = makeGame(mapData, gameOptions);
      ai = new AIPlayer(game.players[0]);
      const unit = game.players[0].units[0];
      const targetTile = game.map.tiles[4][0]; // Far tile

      const task = new MoveUnitTask(ai, {
        tile: targetTile,
        unit: unit,
      });

      task.tick();

      expect(unit.path).toBeTruthy();
      expect(unit.path!.length).toBeGreaterThan(1);
      expect(unit.order).toBe("go");
      expect(task.result).toBeNull(); // Still in progress
    });

    it("should handle movement around mountains", () => {
      const mapData = [
        "W . M . .",
        " . M M . .",
        ". . M . .",
        " . . . . .",
        ". . . . .",
      ];

      game = makeGame(mapData, gameOptions);
      ai = new AIPlayer(game.players[0]);
      const unit = game.players[0].units[0];
      const targetTile = game.map.tiles[4][0]; // Past the mountains

      const task = new MoveUnitTask(ai, {
        tile: targetTile,
        unit: unit,
      });

      task.tick();

      expect(unit.path).toBeTruthy();
      expect(unit.order).toBe("go");
      expect(task.result).toBeNull();
    });

    it("should handle movement around water for land units", () => {
      const mapData = [
        "W . ~ . .",
        " . ~ ~ . .",
        ". . ~ . .",
        " . . . . .",
        ". . . . .",
      ];

      game = makeGame(mapData, gameOptions);
      ai = new AIPlayer(game.players[0]);
      const unit = game.players[0].units[0];
      const targetTile = game.map.tiles[4][0]; // Past the water

      const task = new MoveUnitTask(ai, {
        tile: targetTile,
        unit: unit,
      });

      task.tick();

      expect(unit.path).toBeTruthy();
      expect(unit.order).toBe("go");
      expect(task.result).toBeNull();
    });

    it("should handle movement around cities", () => {
      const mapData = [
        "W . C . . . . . . .",
        " . . . . . . . . . .",
        ". . . . . . . . . .",
        " . . . . . . . . . .",
        ". . . . . . . . . .",
      ];

      game = makeGame(mapData, gameOptions);
      ai = new AIPlayer(game.players[0]);
      const unit = game.players[0].units[0];
      const targetTile = game.map.tiles[4][0]; // Past the city

      const task = new MoveUnitTask(ai, {
        tile: targetTile,
        unit: unit,
      });

      task.tick();

      expect(unit.path).toBeTruthy();
      expect(unit.order).toBe("go");
      expect(task.result).toBeNull();
    });
  });

  describe("Movement Failures", () => {
    it("should fail when no path exists (surrounded by impassable terrain)", () => {
      const mapData = [
        "M M M M M",
        " M W M M M",
        "M M M M M",
        " M M M M M",
        "M M M M M",
      ];

      game = makeGame(mapData, gameOptions);
      ai = new AIPlayer(game.players[0]);
      const unit = game.players[0].units[0];
      const targetTile = game.map.tiles[4][4]; // Outside mountains

      const task = new MoveUnitTask(ai, {
        tile: targetTile,
        unit: unit,
      });

      task.tick();

      expect(task.result).toBe("failed");
      expect(task.reason).toBe("No valid path found");
    });

    it("should fail when unit is dead", () => {
      const mapData = [
        "W . . . . . . . . .",
        " . . . . . . . . . .",
        ". . . . . . . . . .",
        " . . . . . . . . . .",
        ". . . . . . . . . .",
      ];

      game = makeGame(mapData, gameOptions);
      ai = new AIPlayer(game.players[0]);
      const unit = game.players[0].units[0];
      const targetTile = game.map.tiles[1][0];

      // Kill the unit
      unit.health = 0;

      const task = new MoveUnitTask(ai, {
        tile: targetTile,
        unit: unit,
      });

      task.tick();

      expect(task.result).toBe("failed");
      expect(task.reason).toBe("Unit is dead");
    });

    it("should fail when unit is null", () => {
      const mapData = [
        ". . . . . . . . . .",
        " . . . . . . . . . .",
        ". . . . . . . . . .",
        " . . . . . . . . . .",
        ". . . . . . . . . .",
      ];

      game = makeGame(mapData, gameOptions);
      ai = new AIPlayer(game.players[0]);
      const targetTile = game.map.tiles[1][0];

      const task = new MoveUnitTask(ai, {
        tile: targetTile,
        unit: null as any,
      });

      task.tick();

      expect(task.result).toBe("failed");
      expect(task.reason).toBe("Unit not available");
    });
  });

  describe("Path Management", () => {
    it("should reuse existing valid path", () => {
      const mapData = [
        "W . . . . . . . .",
        " . . . . . . . . .",
        ". . . . . . . . .",
      ];

      game = makeGame(mapData, gameOptions);
      ai = new AIPlayer(game.players[0]);
      const unit = game.players[0].units[0];
      const targetTile = game.map.tiles[8][0]; // Far tile

      // Set up existing path and order with multiple steps
      unit.path = [
        [game.map.tiles[1][0], game.map.tiles[2][0]],
        [game.map.tiles[3][0], game.map.tiles[4][0]],
        [game.map.tiles[5][0], game.map.tiles[6][0]],
        [game.map.tiles[7][0], game.map.tiles[8][0]],
      ];
      unit.order = "go";

      const task = new MoveUnitTask(ai, {
        tile: targetTile,
        unit: unit,
      });

      task.tick();

      // Should reuse the existing path and make progress
      expect(unit.order).toBe("go");
      expect(task.result).toBeNull();
    });

    it("should create new path when unit has no order", () => {
      const mapData = [
        "W . . . . . . . .",
        " . . . . . . . . .",
        ". . . . . . . . .",
      ];

      game = makeGame(mapData, gameOptions);
      ai = new AIPlayer(game.players[0]);
      const unit = game.players[0].units[0];
      const targetTile = game.map.tiles[8][0]; // Far tile

      // Unit has no order
      unit.order = null;

      const task = new MoveUnitTask(ai, {
        tile: targetTile,
        unit: unit,
      });

      task.tick();

      // Movement will create path for long distance
      expect(unit.order).toBe("go");
      expect(task.result).toBeNull();
    });

    it("should create new path when unit has no path", () => {
      const mapData = [
        "W . . . . . . . .",
        " . . . . . . . . .",
        ". . . . . . . . .",
      ];

      game = makeGame(mapData, gameOptions);
      ai = new AIPlayer(game.players[0]);
      const unit = game.players[0].units[0];
      const targetTile = game.map.tiles[8][0]; // Far tile

      // Unit has order but no path
      unit.order = "go";
      unit.path = null;

      const task = new MoveUnitTask(ai, {
        tile: targetTile,
        unit: unit,
      });

      task.tick();

      // Movement will create path for long distance
      expect(unit.order).toBe("go");
      expect(task.result).toBeNull();
    });
  });

  describe("Progress State Tracking", () => {
    it("should track progress state with path", () => {
      const mapData = [
        "W . . . . . . . . .",
        " . . . . . . . . . .",
        ". . . . . . . . . .",
        " . . . . . . . . . .",
        ". . . . . . . . . .",
      ];

      game = makeGame(mapData, gameOptions);
      ai = new AIPlayer(game.players[0]);
      const unit = game.players[0].units[0];
      const targetTile = game.map.tiles[2][0];

      const task = new MoveUnitTask(ai, {
        tile: targetTile,
        unit: unit,
      });

      task.tick();

      const progressState = task.getProgressState();
      expect(progressState).toContain(unit.tile.id.toString());
      expect(progressState).toContain(unit.actionPointsLeft.toString());
      expect(progressState).toContain("path");
    });

    it("should track progress state without path", () => {
      const mapData = [
        "W . . . . . . . . .",
        " . . . . . . . . . .",
        ". . . . . . . . . .",
        " . . . . . . . . . .",
        ". . . . . . . . . .",
      ];

      game = makeGame(mapData, gameOptions);
      ai = new AIPlayer(game.players[0]);
      const unit = game.players[0].units[0];
      const targetTile = game.map.tiles[2][0];

      unit.path = null;

      const task = new MoveUnitTask(ai, {
        tile: targetTile,
        unit: unit,
      });

      const progressState = task.getProgressState();
      expect(progressState).toContain(unit.tile.id.toString());
      expect(progressState).toContain(unit.actionPointsLeft.toString());
      expect(progressState).toContain("nopath");
    });
  });

  describe("Serialization", () => {
    it("should serialize task data correctly", () => {
      const mapData = ["W . . . .", " . . . . .", ". . . . ."];

      game = makeGame(mapData, gameOptions);
      ai = new AIPlayer(game.players[0]);
      const unit = game.players[0].units[0];
      const targetTile = game.map.tiles[2][0];

      const task = new MoveUnitTask(ai, {
        tile: targetTile,
        unit: unit,
      });

      const serialized = task.serialize();

      expect(serialized).toEqual({
        tile: {
          id: targetTile.id,
          x: targetTile.x,
          y: targetTile.y,
        },
        unit: {
          id: unit.id,
          name: unit.definition.name,
        },
      });
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle movement with rivers", () => {
      const mapData = ["W . . . .", " . . . . .", ". . . . ."];

      game = makeGame(mapData, gameOptions);

      // Add rivers to create pathfinding challenges
      const centerTile = game.map.tiles[1][1];
      putRiver(centerTile, TileDirection.E);
      putRiver(centerTile, TileDirection.W);

      ai = new AIPlayer(game.players[0]);
      const unit = game.players[0].units[0];
      const targetTile = game.map.tiles[4][2];

      const task = new MoveUnitTask(ai, {
        tile: targetTile,
        unit: unit,
      });

      task.tick();

      expect(unit.path).toBeTruthy();
      expect(unit.order).toBe("go");
      expect(task.result).toBeNull();
    });

    it("should handle zero action points gracefully", () => {
      const mapData = ["W . . . .", " . . . . .", ". . . . ."];

      game = makeGame(mapData, gameOptions);
      ai = new AIPlayer(game.players[0]);
      const unit = game.players[0].units[0];
      const targetTile = game.map.tiles[2][0];

      // Set unit to have no action points
      unit.actionPointsLeft = 0;

      const task = new MoveUnitTask(ai, {
        tile: targetTile,
        unit: unit,
      });

      // Should not throw error even with zero action points
      expect(() => task.tick()).not.toThrow();
      expect(unit.path).toBeTruthy();
      expect(unit.order).toBe("go");
    });
  });
});
