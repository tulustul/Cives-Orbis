/// <reference lib="webworker" />

import { AIPlayer } from "./ai/ai-player";
import { CityCore } from "./core/city";
import { collector } from "./core/collector";
import { CombatSimulation, simulateCombat } from "./core/combat";
import {
  getBuildingById,
  getEntityById,
  getIdleProductById,
  getResourceDefinitionById,
  getUnitById,
} from "./core/data-manager";
import { ResourceDefinition } from "./core/data.interface";
import { Game } from "./core/game";
import { moveAlongPath } from "./core/movement";
import { findPath } from "./core/pathfinding";
import { PLAYER_COLORS, PlayerCore } from "./core/player";
import { getFailedWeakRequirements } from "./core/requirements";
import { ResourceCore } from "./core/resources";
import {
  AreaChanneled,
  CityDetailsChanneled,
  cityDetailsToChannel,
  cityToChannel,
  GameStartInfo,
  gameToGameStartInfo,
  TileChanneled,
  TileDetailsChanneled,
  tileDetailsToChannel,
  TilesCoordsWithNeighbours,
  tilesToTileCoordsWithNeighbours,
  tileToChannel,
  tileToTileCoords,
  trackedPlayerToChannel,
  UnitChanneled,
  unitDetailsToChannel,
  unitToChannel,
} from "./core/serialization/channel";
import { dumpGame, loadGame } from "./core/serialization/dump";
import { UnitOrder } from "./core/unit";
import { UnitAction } from "./core/unit-actions";
import { RealisticMapGenerator } from "./map-generators/realistic";
import { BaseTile, PlayerTask } from "./shared";
import { getTilesInRange } from "./shared/hex-math";

let game: Game;

const HANDLERS = {
  "game.new": newGameHandler,
  "game.dump": dumpHandler,
  "game.load": loadHandler,
  "game.nextPlayer": nextPlayerHandler,
  "game.getInfo": getGameInfo,

  "trackedPlayer.revealWorld": revealWorld,
  "trackedPlayer.set": setTrackedPlayer,

  "player.getSuppliedTiles": getSuppliedTiles,

  "unit.spawn": unitSpawn,
  "unit.getDetails": getUnitDetails,
  "unit.doAction": unitDoAction,
  "unit.setOrder": unitSetOrder,
  "unit.findPath": unitFindPath,
  "unit.disband": unitDisband,
  "unit.moveAlongPath": unitMoveAlongPath,
  "unit.getRange": unitGetRange,
  "unit.getFailedActionRequirements": unitGetFailedActionRequirements,
  "unit.simulateCombat": unitSimulateCombat,
  "unit.getAll": unitGetAll,

  "tile.getAll": tileGetAll,
  "tile.getAllVisible": tileGetAllVisible,
  "tile.getAllExplored": tileGetAllExplored,
  "tile.getDetails": tileGetDetails,
  "tile.getInRange": tileGetInRange,
  "tile.update": tileUpdate,
  "tile.bulkUpdate": tileBulkUpdate,
  "tile.setResource": tileSetResource,

  "city.getAllRevealed": getAllRevealed,
  "city.getDetails": getCityDetails,
  "city.produce": cityProduce,
  "city.getRange": cityGetRange,
  "city.getWorkTiles": cityGetWorkTiles,
  "city.workTile": cityWorkTile,
  "city.unworkTile": cityUnworkTile,
  "city.optimizeYields": cityOptimizeYields,

  "area.getAll": getAllArea,
  "area.getTiles": getAreaTiles,

  "entity.getFailedWeakRequirements": entityGetFailedWeakRequirements,
};

addEventListener("message", ({ data }) => {
  console.debug("Core: received command", data.command);

  const handler = (HANDLERS as any)[data.command];
  if (!handler) {
    console.error(`No handler for command "${data.command}".`);
    return;
  }

  const result = handler(data.data);

  const changes = collector.flush();

  game.trackedPlayer.updateCitiesWithoutProduction();
  game.trackedPlayer.updateUnitsWithoutOrders();
  const nextTask = getNextTask();

  postMessage({ result, changes, nextTask });
});

function getNextTask(): PlayerTask | null {
  const p = game.trackedPlayer;

  if (p.ai) {
    // Don't force the player to do anything if we are just observing AI playing.
    return null;
  }

  if (p.citiesWithoutProduction.length) {
    return {
      task: "city",
      id: p.citiesWithoutProduction[0].id,
    };
  }

  if (p.unitsWithoutOrders.length) {
    return {
      task: "unit",
      id: p.unitsWithoutOrders[0].id,
    };
  }

  return null;
}

export interface MapGeneratorOptions {
  width: number;
  height: number;
  uniformity: number;
  seaLevel: number;
  resources: number;
  humanPlayersCount: number;
  aiPlayersCount: number;
  seed?: string;
}

function newGameHandler(options: MapGeneratorOptions): GameStartInfo {
  game = new Game();

  for (let i = 0; i < options.humanPlayersCount + options.aiPlayersCount; i++) {
    const player = new PlayerCore(game, PLAYER_COLORS[i]);

    if (i >= options.humanPlayersCount) {
      player.ai = new AIPlayer(player);
    }

    game.addPlayer(player);
  }

  const generator = new RealisticMapGenerator(game.players.length);
  game.map = generator.generate(
    options.width,
    options.height,
    options.seed,
    options.uniformity,
    options.seaLevel,
    options.resources,
  );
  game.map.precompute();

  for (let i = 0; i < game.players.length; i++) {
    const startTile = generator.getStartingLocations()[i];
    game.unitsManager.spawn("unit_settler", startTile, game.players[i]);
    game.unitsManager.spawn("unit_scout", startTile, game.players[i]);
    game.unitsManager.spawn("unit_warrior", startTile, game.players[i]);
  }

  game.start();

  const startInfo = gameToGameStartInfo(game);
  collector.changes.push({ type: "game.start", data: startInfo });

  return startInfo;
}

function getGameInfo() {
  return gameToGameStartInfo(game);
}

function dumpHandler(): string {
  // TODO we might compress the save
  return JSON.stringify(dumpGame(game));
}

function loadHandler(data: string) {
  game = loadGame(JSON.parse(data));

  const startInfo = gameToGameStartInfo(game);
  collector.changes.push({ type: "game.start", data: startInfo });

  return startInfo;
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
    return;
  }

  game.trackedPlayer = player;

  return trackedPlayerToChannel(game.trackedPlayer);
}

function getSuppliedTiles(playerId: number): TilesCoordsWithNeighbours[] {
  const player = game.playersMap.get(playerId);
  if (!player) {
    return [];
  }

  return Array.from(player.suppliedTiles).map(tilesToTileCoordsWithNeighbours);
}

export type UnitSpawnOptions = {
  tileId: number;
  playerId: number;
  definitionId: string;
};
function unitSpawn(options: UnitSpawnOptions): void {
  const tile = game.map.tilesMap.get(options.tileId);
  const player = game.playersMap.get(options.playerId);

  if (!tile || !player) {
    return;
  }

  game.unitsManager.spawn(options.definitionId, tile, player);
}

function getUnitDetails(unitId: number) {
  const unit = game.unitsManager.unitsMap.get(unitId);
  if (!unit) {
    return null;
  }

  return unitDetailsToChannel(unit);
}

export type UnitDoActionOptions = {
  unitId: number;
  action: UnitAction;
};
function unitDoAction(data: UnitDoActionOptions) {
  const unit = game.unitsManager.unitsMap.get(data.unitId);
  if (!unit) {
    return null;
  }

  unit.doAction(data.action);

  return unitDetailsToChannel(unit);
}

export type UnitSetOrderOptions = {
  unitId: number;
  order: UnitOrder;
};
function unitSetOrder(data: UnitSetOrderOptions) {
  const unit = game.unitsManager.unitsMap.get(data.unitId);
  if (!unit) {
    return null;
  }

  unit.setOrder(data.order);

  return unitDetailsToChannel(unit);
}

export type UnitFindPathOptions = {
  unitId: number;
  destinationId: number;
};
function unitFindPath(data: UnitFindPathOptions) {
  const unit = game.unitsManager.unitsMap.get(data.unitId);
  const tile = game.map.tilesMap.get(data.destinationId);
  if (!unit || !tile) {
    return null;
  }

  unit.path = findPath(unit, tile);

  return unitDetailsToChannel(unit);
}

function unitDisband(unitId: number): void {
  const unit = game.unitsManager.unitsMap.get(unitId);
  if (!unit) {
    return;
  }

  game.unitsManager.destroy(unit);
}

function unitMoveAlongPath(unitId: number) {
  const unit = game.unitsManager.unitsMap.get(unitId);
  if (!unit) {
    return null;
  }

  moveAlongPath(unit);

  return unitDetailsToChannel(unit);
}

function unitGetRange(unitId: number): TilesCoordsWithNeighbours[] {
  const unit = game.unitsManager.unitsMap.get(unitId);
  if (!unit) {
    return [];
  }

  const tiles = unit.getRange();

  return Array.from(tiles).map(tilesToTileCoordsWithNeighbours);
}

export type UnitGetFailedActionRequirementsOptions = {
  unitId: number;
  action: UnitAction;
};
function unitGetFailedActionRequirements(
  data: UnitGetFailedActionRequirementsOptions,
): string[] {
  const unit = game.unitsManager.unitsMap.get(data.unitId);
  if (!unit) {
    return [];
  }

  return unit.getFailedActionRequirements(data.action);
}

export type UnitSimulateCombatOptions = {
  attackerId: number;
  defenderId: number;
};
function unitSimulateCombat(
  data: UnitSimulateCombatOptions,
): CombatSimulation | null {
  const attacker = game.unitsManager.unitsMap.get(data.attackerId);
  const defender = game.unitsManager.unitsMap.get(data.defenderId);
  if (!attacker || !defender) {
    return null;
  }

  return simulateCombat(attacker, defender);
}

function unitGetAll(): UnitChanneled[] {
  return game.unitsManager.units.map((unit) => unitToChannel(unit));
}

export function tileGetAll(): TileChanneled[] {
  return Array.from(game.map.tilesMap.values()).map(tileToChannel);
}

export function tileGetAllExplored() {
  return Array.from(game.trackedPlayer.exploredTiles).map(tileToTileCoords);
}

export function tileGetAllVisible() {
  return Array.from(game.trackedPlayer.visibleTiles).map(tileToTileCoords);
}

export function tileGetDetails(tileId: number): TileDetailsChanneled | null {
  const tile = game.map.tilesMap.get(tileId);
  if (!tile) {
    return null;
  }

  return tileDetailsToChannel(tile, game.trackedPlayer);
}

export type TileGetInRangeOptions = {
  tileId: number;
  range: number;
};
export function tileGetInRange(
  options: TileGetInRangeOptions,
): TilesCoordsWithNeighbours[] {
  const tile = game.map.tilesMap.get(options.tileId);
  if (!tile) {
    return [];
  }
  return Array.from(getTilesInRange(tile, options.range)).map(
    tilesToTileCoordsWithNeighbours,
  );
}

export type TileUpdateOptions = { id: number } & Partial<
  Pick<
    BaseTile,
    | "climate"
    | "landForm"
    | "seaLevel"
    | "riverParts"
    | "forest"
    | "wetlands"
    | "improvement"
    | "road"
  >
>;
export function tileUpdate(options: TileUpdateOptions) {
  const tile = game.map.tilesMap.get(options.id);
  if (!tile) {
    return;
  }

  console.log({ options, tile });
  if (options.road !== undefined && options.road !== tile.road) {
    for (const n of tile.neighbours) {
      collector.tiles.add(n);
    }
  }

  Object.assign(tile, options);
  tile.update();

  console.log(collector.tiles);
}

export function tileBulkUpdate(tiles: TileUpdateOptions[]) {
  for (const tile of tiles) {
    tileUpdate(tile);
  }
}

export type TileSetResourceOptions = {
  tileId: number;
  resourceId: string | null;
  quantity: number;
};
export function tileSetResource(options: TileSetResourceOptions) {
  const tile = game.map.tilesMap.get(options.tileId);
  if (!tile) {
    return;
  }

  let resource: ResourceDefinition | null = null;
  if (options.resourceId) {
    resource = getResourceDefinitionById(options.resourceId);
  }

  if (resource) {
    tile.resource = new ResourceCore(resource, tile, options.quantity);
  } else {
    tile.resource = null;
  }
  tile.update();
}

export function getAllRevealed() {
  return game.citiesManager.cities
    .filter((city) => game.trackedPlayer.exploredTiles.has(city.tile))
    .map(cityToChannel);
}

export function getCityDetails(cityId: number): CityDetailsChanneled | null {
  const city = game.citiesManager.citiesMap.get(cityId);
  if (!city) {
    return null;
  }

  return cityDetailsToChannel(city);
}

export type CityProduceOptions = {
  cityId: number;
  productId: string;
  productType: "building" | "unit" | "idleProduct";
};
export function cityProduce(options: CityProduceOptions) {
  const city = game.citiesManager.citiesMap.get(options.cityId);

  if (!city) {
    return;
  }

  if (options.productType === "building") {
    city.produceBuilding(getBuildingById(options.productId)!);
  } else if (options.productType === "unit") {
    city.produceUnit(getUnitById(options.productId)!);
  } else {
    city.workOnIdleProduct(getIdleProductById(options.productId)!);
  }

  return cityDetailsToChannel(city);
}

export function cityGetRange(
  cityId: number,
): TilesCoordsWithNeighbours[] | null {
  const city = game.citiesManager.citiesMap.get(cityId);

  if (!city) {
    return null;
  }

  return Array.from(city.tiles).map(tilesToTileCoordsWithNeighbours);
}

export type CityGetWorkTilesResult = {
  workedTiles: TilesCoordsWithNeighbours[];
  notWorkedTiles: TilesCoordsWithNeighbours[];
};
export function cityGetWorkTiles(
  cityId: number,
): CityGetWorkTilesResult | null {
  const city = game.citiesManager.citiesMap.get(cityId);

  if (!city) {
    return null;
  }

  return {
    workedTiles: Array.from(city.workedTiles).map(
      tilesToTileCoordsWithNeighbours,
    ),
    notWorkedTiles: Array.from(city.notWorkedTiles).map(
      tilesToTileCoordsWithNeighbours,
    ),
  };
}

export type CityWorkTileOptions = {
  cityId: number;
  tileId: number;
};
export function cityWorkTile(options: CityWorkTileOptions) {
  const city = game.citiesManager.citiesMap.get(options.cityId);
  const tile = game.map.tilesMap.get(options.tileId);

  if (!city || !tile) {
    return null;
  }

  city.workTile(tile);

  return cityDetailsToChannel(city);
}

export function cityUnworkTile(options: CityWorkTileOptions) {
  const city = game.citiesManager.citiesMap.get(options.cityId);
  const tile = game.map.tilesMap.get(options.tileId);

  if (!city || !tile) {
    return null;
  }

  city.unworkTile(tile);

  return cityDetailsToChannel(city);
}

export function cityOptimizeYields(cityId: number) {
  const city = game.citiesManager.citiesMap.get(cityId);

  if (!city) {
    return null;
  }

  city.optimizeYields();

  return cityDetailsToChannel(city);
}

export function getAllArea(): AreaChanneled[] {
  return Array.from(game.areasManager.areasMap.values()).map((area) => ({
    id: area.id,
    color: area.color,
    tiles: Array.from(area.tiles).map(tilesToTileCoordsWithNeighbours),
  }));
}

export function getAreaTiles(areaId: number): TilesCoordsWithNeighbours[] {
  const area = game.areasManager.areasMap.get(areaId);
  if (!area) {
    return [];
  }

  return Array.from(area.tiles).map(tilesToTileCoordsWithNeighbours);
}

export function entityGetFailedWeakRequirements(data: any): [string, any][] {
  const entityId: string = data.entityId;
  const cityId: number | null = data.cityId;

  const entity = getEntityById(entityId);
  if (!entity) {
    return [];
  }

  let city: CityCore | null = null;
  if (cityId) {
    city = game.citiesManager.citiesMap.get(cityId)!;
  }

  return getFailedWeakRequirements(entity, game.trackedPlayer, city);
}
