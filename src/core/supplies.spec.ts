// import { LandForm, SeaLevel, TileDirection } from "@/shared";
// import { Game } from "./game";
// import { moveAlongPath } from "./movement";
// import { PlayerCore } from "./player";
// import {} from "./supplies";
// import {
//   GameFactoryOptions,
//   makeGame,
//   SymbolCallbacks,
// } from "./tests/game-factory";
// import { dumpMap } from "./tests/map-utils";

it("_", () => {});

// const symbolCallbacks: SymbolCallbacks = {
//   "0": (game, tile) =>
//     game.unitsManager.spawn("unit_warrior", tile, game.players[0]),
//   "1": (game, tile) =>
//     game.unitsManager.spawn("unit_warrior", tile, game.players[1]),
//   M: (_, tile) => (tile.landForm = LandForm.mountains),
//   "~": (_, tile) => (tile.seaLevel = SeaLevel.shallow),
//   C: (game, tile) => game.citiesManager.spawn(tile, game.players[0], true),
//   s: (game, tile) =>
//     game.unitsManager.spawn("unit_supply_wagon", tile, game.players[0]),
// };

// const gameOptions: Partial<GameFactoryOptions> = {
//   playersCount: 2,
//   symbolCallbacks,
// };

// function dumpSupplies(game: Game, player: PlayerCore) {
//   return dumpMap(game.map, (tile) =>
//     tile.isSuppliedByPlayer(player) ? "x" : ".",
//   );
// }

// describe("supply lines", () => {
//   it("add and forget city", () => {
//     const mapData = [
//       ". . . . . . . .",
//       " . C . . . . . .",
//       ". . . . . . . .",
//       " . . . . . . . .",
//       ". . . . . . . .",
//       ". . . . . . . .",
//       ". . . . . . . .",
//       ". . . . . . . .",
//     ];

//     const game = makeGame(mapData, gameOptions);

//     expect(dumpSupplies(game, game.players[0])).toEqual([
//       "x x x x x x x .",
//       " x x x x x x x .",
//       "x x x x x x x .",
//       " x x x x x x . .",
//       "x x x x x x . .",
//       " x x x x x . . .",
//       "x x x x x . . .",
//       " . . . . . . . .",
//     ]);

//     const city = game.citiesManager.cities[0];
//     city.suppliesProducers.forget();

//     expect(dumpSupplies(game, game.players[0])).toEqual([
//       ". . . . . . . .",
//       " . . . . . . . .",
//       ". . . . . . . .",
//       " . . . . . . . .",
//       ". . . . . . . .",
//       " . . . . . . . .",
//       ". . . . . . . .",
//       " . . . . . . . .",
//     ]);

//     city.suppliesProducers.add();

//     expect(dumpSupplies(game, game.players[0])).toEqual([
//       "x x x x x x x .",
//       " x x x x x x x .",
//       "x x x x x x x .",
//       " x x x x x x . .",
//       "x x x x x x . .",
//       " x x x x x . . .",
//       "x x x x x . . .",
//       " . . . . . . . .",
//     ]);
//   });

//   it("add and forget supply unit", () => {
//     const mapData = [
//       ". . . . . . . .",
//       " . s . . . . . .",
//       ". . . . . . . .",
//       " . . . . . . . .",
//       ". . . . . . . .",
//       ". . . . . . . .",
//       ". . . . . . . .",
//       ". . . . . . . .",
//     ];

//     const game = makeGame(mapData, gameOptions);

//     expect(dumpSupplies(game, game.players[0])).toEqual([
//       "x x x x x x . .",
//       " x x x x x x . .",
//       "x x x x x x . .",
//       " x x x x x . . .",
//       "x x x x x . . .",
//       " x x x x . . . .",
//       ". . . . . . . .",
//       " . . . . . . . .",
//     ]);

//     const unit = game.unitsManager.units[0];
//     unit.suppliesProducer?.forget();

//     expect(dumpSupplies(game, game.players[0])).toEqual([
//       ". . . . . . . .",
//       " . . . . . . . .",
//       ". . . . . . . .",
//       " . . . . . . . .",
//       ". . . . . . . .",
//       " . . . . . . . .",
//       ". . . . . . . .",
//       " . . . . . . . .",
//     ]);

//     unit.suppliesProducer?.add();

//     expect(dumpSupplies(game, game.players[0])).toEqual([
//       "x x x x x x . .",
//       " x x x x x x . .",
//       "x x x x x x . .",
//       " x x x x x . . .",
//       "x x x x x . . .",
//       " x x x x . . . .",
//       ". . . . . . . .",
//       " . . . . . . . .",
//     ]);
//   });

//   it("enemy blocking supply lines", () => {
//     const mapData = [
//       ". . . . . . . .",
//       " . C . . . . . .",
//       ". . . . . 1 . .",
//       " . . . . . . . .",
//       ". . . 1 . . . .",
//       ". . . . . . . .",
//       ". . . . . . . .",
//       ". . . . . . . .",
//     ];

//     const game = makeGame(mapData, gameOptions);

//     expect(dumpSupplies(game, game.players[0])).toEqual([
//       "x x x x x x x .",
//       " x x x x . . . .",
//       "x x x x . . . .",
//       " x x . . . . . .",
//       "x x . . . . . .",
//       " x x . . . . . .",
//       "x x x . . . . .",
//       " . . . . . . . .",
//     ]);

//     // Destroy the unit.
//     let unit = game.unitsManager.units[1];
//     unit.destroy();
//     expect(dumpSupplies(game, game.players[0])).toEqual([
//       "x x x x x x x .",
//       " x x x x x x x .",
//       "x x x x x x x .",
//       " x x . . x x . .",
//       "x x . . . x . .",
//       " x x . . . . . .",
//       "x x x . . . . .",
//       " . . . . . . . .",
//     ]);

//     // // Move the other unit.
//     unit = game.unitsManager.units[0];
//     unit.path = [[unit.tile.fullNeighbours[TileDirection.NW]!]];
//     moveAlongPath(unit);
//     expect(dumpSupplies(game, game.players[0])).toEqual([
//       "x x x x x x x .",
//       " x x x x x x x .",
//       "x x . . x x x .",
//       " x . . . x x . .",
//       "x x . . x x . .",
//       " x x x . . . . .",
//       "x x x . . . . .",
//       " . . . . . . . .",
//     ]);
//   });
// });
