import { SeaLevel } from "@/shared";
import { Game } from "@/core/game";
import { PlayerCore } from "@/core/player";
import { TileCore } from "@/core/tile";
import { TilesMapCore } from "@/core/tiles-map";
import { dataManager } from "../data/dataManager";

export type SymbolCallbacks = {
  [key: string]: (game: Game, tile: TileCore) => void;
};

export type GameFactoryOptions = {
  playersCount: number;
  symbolCallbacks: SymbolCallbacks;
};

const defaultOptions: GameFactoryOptions = {
  playersCount: 1,
  symbolCallbacks: {},
};

function makeMap(
  mapData: string[],
  game: Game,
  symbolCallbacks: SymbolCallbacks,
) {
  const symbols = tokenizeMapSymbols(mapData);

  const height = symbols.length;
  const width = symbols[0].length;

  game.map = new TilesMapCore(width, height);
  game.map.precompute();

  alterMap(mapData, game, symbolCallbacks);
}

function alterMap(
  mapData: string[],
  game: Game,
  symbolCallbacks: SymbolCallbacks,
) {
  const symbols = tokenizeMapSymbols(mapData);
  if (symbols.length !== game.map.height) {
    throw `makeMap: number of rows in the map data (${symbols.length}) does not match the map height (${game.map.height})`;
  }
  for (const row of symbols) {
    if (row.length !== game.map.width) {
      throw `makeMap: each row must have the same number of symbols - map width (${game.map.width}); row width (${row.length})`;
    }
  }

  // The order of the loops is important here. It executes the callbacks in the order of a human reading the map. It makes it easier to reason about the map data.
  for (let y = 0; y < game.map.height; y++) {
    for (let x = 0; x < game.map.width; x++) {
      const tile = game.map.tiles[x][y];
      tile.seaLevel = SeaLevel.none;
      const symbol = symbols[tile.y][tile.x];
      if (symbol !== ".") {
        const callback = symbolCallbacks[symbol];
        if (!callback) {
          throw `makeMap: I don't know what to do with the symbol "${symbol}"`;
        }
        callback(game, tile);
      }
    }
  }

  game.map.precompute();
}

function tokenizeMapSymbols(mapData: string[]) {
  return mapData
    .map((line) => line.trim())
    .filter((line) => !!line)
    .map((line) => line.split(" "));
}

export function makeGame(
  mapData: string[],
  userOptions: Partial<GameFactoryOptions>,
): Game {
  const options = { ...defaultOptions, ...userOptions };

  const game = new Game();

  for (let i = 0; i < options.playersCount; i++) {
    game.addPlayer(new PlayerCore(game, dataManager.nations.pickRandom()));
  }

  makeMap(mapData, game, options.symbolCallbacks);

  game.start();

  return game;
}

export function alterGame(
  game: Game,
  mapData: string[],
  userOptions: Partial<GameFactoryOptions>,
) {
  const options = { ...defaultOptions, ...userOptions };
  alterMap(mapData, game, options.symbolCallbacks);
}
