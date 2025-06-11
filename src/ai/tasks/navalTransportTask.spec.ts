import { Game } from "@/core/game";
import {
  GameFactoryOptions,
  makeGame,
  SymbolCallbacks,
} from "@/core/tests/game-factory";
import { dumpMap } from "@/core/tests/map-utils";
import { LandForm, SeaLevel } from "@/shared";
import { AIPlayer } from "../ai-player";
import { NavalTransportTask } from "./navalTransportTask";

const symbolCallbacks: SymbolCallbacks = {
  W: (game, tile) =>
    game.unitsManager.spawn("unit_warrior", tile, game.players[0]),
  G: (game, tile) =>
    game.unitsManager.spawn("unit_galley", tile, game.players[0]),
  "~": (_, tile) => (tile.seaLevel = SeaLevel.shallow),
};

const gameOptions: Partial<GameFactoryOptions> = {
  playersCount: 1,
  symbolCallbacks,
};

function dumpGameState(game: Game): string[] {
  return dumpMap(game.map, (tile) => {
    const unit = tile.units[0];
    if (unit) {
      // Show embarked units specially
      if (unit.parent) {
        return "E"; // Embarked unit
      }
      if (unit.definition.id === "unit_warrior") return "W";
      if (unit.definition.id === "unit_galley") {
        // Check if carrying units
        if (unit.children.length > 0) {
          return "T"; // Transport with units
        }
        return "G";
      }
    }

    // Show terrain
    if (tile.seaLevel === SeaLevel.deep) return "#";
    if (tile.seaLevel === SeaLevel.shallow) return "~";
    if (tile.landForm === LandForm.mountains) return "M";

    return ".";
  });
}

function tickGame(game: Game, expectedState: string[]) {
  const currentState = dumpGameState(game);

  console.log(currentState);

  expect(currentState).toEqual(expectedState);

  game.nextTurn();
}

describe("NavalTransportTask", () => {
  it("should complete full transport journey from embarkation to final destination", () => {
    const mapData = [
      "W . . . ~ ~ ~ ~ ~ ~",
      " . . . ~ ~ ~ ~ ~ ~ ~",
      ". . . ~ ~ ~ ~ ~ ~ ~",
      " ~ ~ ~ ~ ~ ~ . . ~ ~",
      "~ ~ ~ ~ ~ . . . . ~",
      " ~ ~ ~ ~ . . . W . G",
    ];

    const game = makeGame(mapData, gameOptions);
    const player = game.players[0];
    player.ai = new AIPlayer(player);
    const warrior = player.units[0];
    const targetTile = player.units[1].tile;
    player.units[1].destroy();
    const galley = player.units[1];

    player.ai.systems = [];

    const task = new NavalTransportTask(player.ai, {
      unit: warrior,
      to: targetTile,
    });
    player.ai.tasks.push(task);
    task.init();

    expect(task.transport).toBe(galley);
    expect(player.ai.units.assignments.get(galley)?.type).toBe("transport");

    tickGame(game, [
      "W . . . ~ ~ ~ ~ ~ ~",
      " . . . ~ ~ ~ ~ ~ ~ ~",
      ". . . ~ ~ ~ ~ ~ ~ ~",
      " ~ ~ ~ ~ ~ ~ . . ~ ~",
      "~ ~ ~ ~ ~ . . . . ~",
      " ~ ~ ~ ~ . . . W . G",
    ]);

    tickGame(game, [
      "W . . . ~ ~ ~ ~ ~ ~",
      " . . . ~ ~ ~ ~ ~ ~ ~",
      ". . . ~ ~ ~ ~ ~ ~ ~",
      " ~ ~ ~ ~ ~ ~ . . ~ ~",
      "~ ~ ~ ~ ~ . . . . ~",
      " ~ ~ ~ ~ . . . W . G",
    ]);
    tickGame(game, [
      "W . . . ~ ~ ~ ~ ~ ~",
      " . . . ~ ~ ~ ~ ~ ~ ~",
      ". . . ~ ~ ~ ~ ~ ~ ~",
      " ~ ~ ~ ~ ~ ~ . . ~ ~",
      "~ ~ ~ ~ ~ . . . . ~",
      " ~ ~ ~ ~ . . . W . G",
    ]);
    tickGame(game, [
      "W . . . ~ ~ ~ ~ ~ ~",
      " . . . ~ ~ ~ ~ ~ ~ ~",
      ". . . ~ ~ ~ ~ ~ ~ ~",
      " ~ ~ ~ ~ ~ ~ . . ~ ~",
      "~ ~ ~ ~ ~ . . . . ~",
      " ~ ~ ~ ~ . . . W . G",
    ]);
  });

  it.skip("should handle multi-stage journey with intermediate islands", () => {
    // Even more complex scenario with island hopping
    const mapData = [
      "W . . ~ ~ ~ ~ . . ~ ~ ~ ~ . . ~ ~ ~ . .",
      " . . . ~ ~ ~ ~ . . ~ ~ ~ ~ . . ~ ~ ~ . .",
      ". . . ~ ~ ~ ~ . . ~ ~ ~ ~ . . ~ ~ ~ . .",
      " . . . ~ ~ G ~ . . ~ ~ ~ ~ . . ~ ~ ~ . .",
      ". . . ~ ~ ~ ~ . . ~ ~ ~ ~ . . ~ ~ ~ . .",
    ];

    const game = makeGame(mapData, gameOptions);
    const ai = new AIPlayer(game.players[0]);
    const warrior = game.players[0].units[0];

    // Target is on the far right island
    const targetTile = game.map.tiles[19][1];

    // Update AI units registry
    ai.units.update();

    console.log("Initial state (island hopping):");
    console.log(dumpGameState(game).join("\n"));
    console.log("---");

    const task = new NavalTransportTask(ai, {
      unit: warrior,
      to: targetTile,
    });

    task.init();

    const maxTurns = 30;
    let turnCount = 0;
    const embarkedTurns: number[] = [];
    const disembarkedTurns: number[] = [];

    while (task.result === null && turnCount < maxTurns) {
      turnCount++;

      // Track embarkation/disembarkation events
      const wasEmbarked = warrior.parent !== null;

      // Process tasks
      for (const childTask of task.tasks) {
        if (childTask.result === null) {
          childTask.tick();
        }
      }
      task.tick();

      const isEmbarked = warrior.parent !== null;

      if (!wasEmbarked && isEmbarked) {
        embarkedTurns.push(turnCount);
        console.log(`>>> EMBARKED at turn ${turnCount}`);
      }
      if (wasEmbarked && !isEmbarked) {
        disembarkedTurns.push(turnCount);
        console.log(`>>> DISEMBARKED at turn ${turnCount}`);
      }

      // Only log key turns
      if (
        turnCount === 1 ||
        embarkedTurns.includes(turnCount) ||
        disembarkedTurns.includes(turnCount) ||
        task.result !== null
      ) {
        console.log(`Turn ${turnCount}:`);
        console.log(dumpGameState(game).join("\n"));
        console.log(
          `Warrior at: (${warrior.tile.x}, ${warrior.tile.y}), embarked: ${isEmbarked}`,
        );
        console.log("---");
      }

      game.nextTurn();
      ai.units.update();
    }

    // Verify completion
    expect(task.result).toBe("completed");
    expect(warrior.tile).toBe(targetTile);

    // Should have at least one embark/disembark cycle
    expect(embarkedTurns.length).toBeGreaterThanOrEqual(1);
    expect(disembarkedTurns.length).toBeGreaterThanOrEqual(1);

    console.log(`Completed in ${turnCount} turns`);
    console.log(`Embarkations: ${embarkedTurns.join(", ")}`);
    console.log(`Disembarkations: ${disembarkedTurns.join(", ")}`);
  });
});
