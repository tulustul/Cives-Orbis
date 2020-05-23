/// <reference lib="webworker" />

import { SimplexMapGenerator } from "./map-generators/simplex";
import { MapGeneratorOptions } from "./api/game.interface";
import { Game } from "./core/game";
import { PlayerCore, PLAYER_COLORS } from "./core/player";
import { AIPlayer } from "./ai/ai-player";
import { collector } from "./core/collector";
import { UnitAction } from "./core/unit-actions";
import { UnitOrder, UNITS_MAP } from "./core/unit";
import { findPath } from "./core/pathfinding";
import { BaseTile } from "./shared";
import { BUILDINGS_MAP } from "./core/buildings";
import { IDLE_PRODUCTS_MAP } from "./core/idle-product";
import {
  gameToChannel,
  trackedPlayerToChannel,
  unitDetailsToChannel,
  cityDetailsToChannel,
  GameChanneled,
} from "./core/serialization/channel";
import { dumpGame, loadGame } from "./core/serialization/dump";

let game: Game;

const HANDLERS = {
  "game.new": newGameHandler,
  "game.saveDump": saveDumpHandler,
  "game.loadDump": loadDumpHandler,
  "game.nextPlayer": nextPlayerHandler,

  "trackedPlayer.revealWorld": revealWorld,
  "trackedPlayer.set": setTrackedPlayer,

  "unit.getDetails": getUnitDetails,
  "unit.doAction": unitDoAction,
  "unit.setOrder": unitSetOrder,
  "unit.findPath": unitFindPath,
  "unit.disband": unitDisband,
  "unit.moveAlongPath": unitMoveAlongPath,
  "unit.getRange": unitGetRange,

  "tile.update": tileUpdate,
  "tile.bulkUpdate": tileBulkUpdate,

  "city.getDetails": getCityDetails,
  "city.produce": cityProduce,
  "city.getRange": cityGetRange,
};

addEventListener("message", ({ data }) => {
  const handler = HANDLERS[data.command];
  if (!handler) {
    console.error(`No handler for command "${data.command}".`);
    return;
  }

  const result = handler(data.data);

  const changes = collector.flush();

  postMessage({ result, changes });
});

function newGameHandler(data: MapGeneratorOptions): GameChanneled {
  game = new Game();

  for (let i = 0; i < data.humanPlayersCount + data.aiPlayersCount; i++) {
    const player = new PlayerCore(game, PLAYER_COLORS[i]);

    if (i >= data.humanPlayersCount) {
      player.ai = new AIPlayer(player);
    }

    game.addPlayer(player);
  }

  const generator = new SimplexMapGenerator(game.players.length);
  game.map = generator.generate(
    data.width,
    data.height,
    data.seed,
    data.uniformity,
    data.seaLevel,
  );
  game.map.precompute();

  for (let i = 0; i < game.players.length; i++) {
    game.unitsManager.spawn(
      "settler",
      generator.getStartingLocations()[i],
      game.players[i],
    );
  }

  return gameToChannel(game);
}

function saveDumpHandler(): string {
  return JSON.stringify(dumpGame(game));
}

function loadDumpHandler(data: string) {
  game = loadGame(JSON.parse(data));
  return gameToChannel(game);
}

function nextPlayerHandler() {
  game.nextPlayer();
}

function revealWorld() {
  for (let x = 0; x < game.map.width; x++) {
    game.trackedPlayer.exploreTiles(game.map.tiles[x]);
  }
}

function setTrackedPlayer(playerId: number) {
  const player = game.players.find((p) => p.id === playerId);

  if (!player) {
    console.error(
      `trackedPlayer.set: cannot find player with id "${playerId}".`,
    );
    return;
  }

  game.trackedPlayer = player;

  return trackedPlayerToChannel(game.trackedPlayer);
}

function getUnitDetails(unitId: number) {
  const unit = game.unitsManager.unitsMap.get(unitId);
  if (!unit) {
    return null;
  }

  return unitDetailsToChannel(unit);
}

function unitDoAction(data: { unitId: number; action: UnitAction }) {
  const unit = game.unitsManager.unitsMap.get(data.unitId);
  if (!unit) {
    return null;
  }

  unit.doAction(data.action);

  return unitDetailsToChannel(unit);
}

function unitSetOrder(data: { unitId: number; order: UnitOrder }) {
  const unit = game.unitsManager.unitsMap.get(data.unitId);
  if (!unit) {
    return null;
  }

  unit.setOrder(data.order);

  return unitDetailsToChannel(unit);
}

function unitFindPath(data: { unitId: number; destinationId: number }) {
  const unit = game.unitsManager.unitsMap.get(data.unitId);
  const tile = game.map.tilesMap.get(data.destinationId);
  if (!unit || !tile) {
    return null;
  }

  unit.path = findPath(unit, tile);

  return unitDetailsToChannel(unit);
}

function unitDisband(unitId: number) {
  const unit = game.unitsManager.unitsMap.get(unitId);
  if (!unit) {
    return null;
  }

  game.unitsManager.destroy(unit);
}

function unitMoveAlongPath(unitId: number) {
  const unit = game.unitsManager.unitsMap.get(unitId);
  if (!unit) {
    return null;
  }

  game.unitsManager.moveAlongPath(unit);

  return unitDetailsToChannel(unit);
}

function unitGetRange(unitId: number): number[] {
  const unit = game.unitsManager.unitsMap.get(unitId);
  if (!unit) {
    return [];
  }

  const tiles = unit.getRange();

  return Array.from(tiles).map((tile) => tile.id);
}

export function tileUpdate(tile: Partial<BaseTile>) {
  const tileCore = game.map.tilesMap.get(tile.id!);
  if (!tileCore) {
    return;
  }

  Object.assign(tileCore, tile);
  tileCore.update();
}

export function tileBulkUpdate(tiles: Partial<BaseTile>[]) {
  for (const tile of tiles) {
    tileUpdate(tile);
  }
}

export function getCityDetails(cityId: number) {
  const city = game.citiesManager.citiesMap.get(cityId);
  if (!city) {
    return;
  }

  return cityDetailsToChannel(city);
}

export function cityProduce(data) {
  const city = game.citiesManager.citiesMap.get(data.cityId);

  if (!city) {
    return;
  }

  if (data.type === "building") {
    city.produceBuilding(BUILDINGS_MAP.get(data.productId)!);
  } else if (data.type === "unit") {
    city.produceUnit(UNITS_MAP.get(data.productId)!);
  } else {
    city.workOnIdleProduct(IDLE_PRODUCTS_MAP.get(data.productId)!);
  }

  return cityDetailsToChannel(city);
}

export function cityGetRange(cityId: number) {
  const city = game.citiesManager.citiesMap.get(cityId);

  if (!city) {
    return;
  }

  return Array.from(city.tiles).map((tile) => tile.id);
}
