import { LandForm, SeaLevel, TileDirection } from "@/shared";
import { Game } from "./game";
import { moveAlongPath } from "./movement";
import {
  makeGame,
  SymbolCallbacks,
  GameFactoryOptions,
  alterGame,
} from "./tests/game-factory";
import { dumpMap, putRiver } from "./tests/map-utils";
import { zocAddUnit, zocForgetUnit } from "./zoc";

const symbolCallbacks: SymbolCallbacks = {
  "0": (game, tile) =>
    game.unitsManager.spawn("unit_warrior", tile, game.players[0]),
  "1": (game, tile) =>
    game.unitsManager.spawn("unit_warrior", tile, game.players[1]),
  M: (_, tile) => (tile.landForm = LandForm.mountains),
  "~": (_, tile) => (tile.seaLevel = SeaLevel.shallow),
  C: (game, tile) => game.citiesManager.spawn(tile, game.players[0], true),
};

const gameOptions: Partial<GameFactoryOptions> = {
  playersCount: 2,
  symbolCallbacks,
};

function dumpZoc(game: Game) {
  return dumpMap(
    game.map,
    (tile) =>
      ((tile.zocNoMansLand && "-") || tile.zocPlayer?.id.toString()) ?? ".",
  );
}

describe("zone of control", () => {
  it("add and forget", () => {
    const mapData = [
      ". . . . .",
      " . . . . .",
      ". . 0 . .",
      " . . . . .",
      ". . . . .",
    ];

    const game = makeGame(mapData, gameOptions);

    expect(dumpZoc(game)).toEqual([
      ". . . . .",
      " . 0 0 . .",
      ". 0 0 0 .",
      " . 0 0 . .",
      ". . . . .",
    ]);

    const unit = game.players[0].units[0];
    zocForgetUnit(unit);
    expect(dumpZoc(game)).toEqual([
      ". . . . .",
      " . . . . .",
      ". . . . .",
      " . . . . .",
      ". . . . .",
    ]);

    zocAddUnit(unit);
    expect(dumpZoc(game)).toEqual([
      ". . . . .",
      " . 0 0 . .",
      ". 0 0 0 .",
      " . 0 0 . .",
      ". . . . .",
    ]);
  });

  it("no mans land", () => {
    const mapData = [
      ". . . . .",
      " . 1 . . .",
      ". . 0 . 1",
      " . . 1 . .",
      ". . . . .",
    ];

    const game = makeGame(mapData, gameOptions);

    expect(dumpZoc(game)).toEqual([
      ". 1 1 . .",
      " 1 1 - 1 1",
      ". - 0 - 1",
      " . - 1 1 1",
      ". . 1 1 .",
    ]);

    const unit = game.players[1].units[0];
    zocForgetUnit(unit);
    expect(dumpZoc(game)).toEqual([
      ". . . . .",
      " . 0 0 1 1",
      ". 0 0 - 1",
      " . - 1 1 1",
      ". . 1 1 .",
    ]);
  });

  it("movement should update zoc", () => {
    const mapData = [
      ". . . 1 .",
      " . . . . .",
      ". . . 1 .",
      " 0 . . . .",
      ". . . . .",
    ];

    const game = makeGame(mapData, gameOptions);

    // spawned unit should have correct zoc
    expect(dumpZoc(game)).toEqual([
      ". . 1 1 1",
      " . . 1 1 .",
      "0 0 1 1 1",
      " 0 0 1 1 .",
      "0 0 . . .",
    ]);

    const unit = game.players[0].units[0];
    unit.path = [[unit.tile.fullNeighbours[TileDirection.E]!]];
    moveAlongPath(unit);

    // unit movement should update the zoc
    expect(dumpZoc(game)).toEqual([
      ". . 1 1 1",
      " . . 1 1 .",
      ". 0 - 1 1",
      " 0 0 - 1 .",
      ". 0 0 . .",
    ]);
  });

  it("cannot pass water and mountains", () => {
    const mapData = [
      ". . ~ . .",
      " . ~ ~ . .",
      ". . . M .",
      " . . M M .",
      ". . . . .",
    ];
    const game = makeGame(mapData, gameOptions);

    const unitsMapData = [
      ". . . . .",
      " . . . . .",
      ". . 0 . .",
      " . . . . .",
      ". . . . .",
    ];
    alterGame(game, unitsMapData, gameOptions);

    expect(dumpZoc(game)).toEqual([
      ". . . . .",
      " . . . . .",
      ". 0 0 . .",
      " . 0 . . .",
      ". . . . .",
    ]);
  });

  it("cannot pass cities", () => {
    const mapData = [
      ". . . . .",
      " . . . . .",
      ". C 1 . .",
      " . . . . .",
      ". . . . .",
    ];
    const game = makeGame(mapData, gameOptions);
    expect(dumpZoc(game)).toEqual([
      ". . . . .",
      " . 1 1 . .",
      ". . 1 1 .",
      " . 1 1 . .",
      ". . . . .",
    ]);
  });

  it("cannot pass rivers", () => {
    const mapData = [
      ". . . . .",
      " . . . . .",
      ". . . . .",
      " . . . . .",
      ". . . . .",
    ];
    const game = makeGame(mapData, gameOptions);

    const tile = game.map.tiles[2][2];
    putRiver(tile, TileDirection.E);
    putRiver(tile, TileDirection.SW);
    game.unitsManager.spawn("unit_warrior", tile, game.players[0]);

    expect(dumpZoc(game)).toEqual([
      ". . . . .",
      " . 0 0 . .",
      ". 0 0 . .",
      " . . 0 . .",
      ". . . . .",
    ]);
  });
});
