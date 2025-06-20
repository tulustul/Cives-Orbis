/// <reference lib="webworker" />

import { AIPlayer } from "@/ai/ai-player";
import { RealisticMapGenerator } from "@/map-generators/realistic";
import {
  AiDebugMapAnalysis,
  AiDebugTasks,
  AiDebugUnitsRegistry,
  AiDebugUnitsRegistryUnit,
} from "@/shared/debug";
import {
  CityChanneled,
  CityDetailsChanneled,
  CityGetDistrictAvailableTilesOptions,
  CityGetWorkTilesResult,
  CityProduceOptions,
  CityRange,
  CityWorkTileOptions,
  EntityChanneled,
  EntityGetFailedWeakRequirements,
  FogOfWarFilter,
  GameGetEntityOptions,
  GameStartInfo,
  GrantRevokeTechOptions,
  MapGeneratorOptions,
  Option,
  PlayerEconomyChanneled,
  PlayerEditorGiveGoldOptions,
  PlayerTask,
  PlayerYields,
  Requirement,
  ResourceSpawnOptions,
  ResourceWithTileChanneled,
  StatsGetChanneled,
  StatsGetOptions,
  TileChanneled,
  TileDetailsChanneled,
  TileGetHoverDetailsOptions,
  TileGetInRangeOptions,
  TileHoverDetails,
  TileInfluence,
  TileOwnershipChanneled,
  TilesCoordsWithNeighbours,
  TilesFogOfWarChanneled,
  TileUpdateOptions,
  UnitChanneled,
  UnitDoActionOptions,
  UnitFindPathOptions,
  UnitGetFailedActionRequirementsOptions,
  UnitSetOrderOptions,
  UnitSpawnOptions,
} from "../shared";
import { CityCore } from "./city";
import { collector } from "./collector";
import { CombatSimulation, simulateCombat } from "./combat";
import { dataManager } from "./data/dataManager";
import {
  Entity,
  HaveRequirements,
  Nation,
  ResourceDefinition,
} from "./data/types";
import { Game } from "./game";
import { getTilesInRange } from "./hex-math";
import { moveAlongPath } from "./movement";
import { findPath } from "./pathfinding";
import { PlayerCore } from "./player";
import { getFailedWeakRequirements } from "./requirements";
import { ResourceDeposit } from "./resources";
import {
  cityDetailsToChannel,
  cityToChannel,
  cityToOverviewChanneled,
  combatSimulationToChannel,
  entityToChannel,
  gameToGameStartInfo,
  knowledgeTechToChannel,
  mapAnalysisToChannel,
  playerToChannel,
  resourceWithTileToChannel,
  tileDetailsToChannel,
  tilesToTileCoordsWithNeighbours,
  tileToChannel,
  tileToFogOfWar,
  tileToTileOwnershipChannel,
  trackedPlayerToChannel,
  unitDetailsToChannel,
  unitToChannel,
} from "./serialization/channel";
import { dumpGame, loadGame } from "./serialization/dump";

let game: Game;

const HANDLERS = {
  "game.new": newGameHandler,
  "game.dump": dumpHandler,
  "game.load": loadHandler,
  "game.nextPlayer": nextPlayerHandler,
  "game.getInfo": getGameInfo,
  "game.getAllPlayers": getAllPlayers,
  "game.editor.getEntityOptions": gameGetEntityOptions,

  "trackedPlayer.revealWorld": revealWorld,
  "trackedPlayer.set": setTrackedPlayer,

  "player.getSuppliedTiles": playerGetSuppliedTiles,
  "player.getYields": playertGetYields,
  "player.getEconomyOverview": playerGetEconomyOverview,
  "player.editor.grantRevokeTech": playerGrantRevokeTech,
  "player.editor.revealMap": playerRevealMap,
  "player.editor.giveGold": playerEditorGiveGold,
  "player.debug.getAiTasks": playerDebugGetAiTasks,
  "player.debug.getAiUnitsRegistry": playerDebugGetAiUnitsRegistry,
  "player.debug.getAiMapAnalysis": playerDebugGetAiMapAnalysis,
  "player.debug.getAiTileAnalysis": playerDebugGetAiTileAnalysis,

  "unit.spawn": unitSpawn,
  "unit.getDetails": getUnitDetails,
  "unit.doAction": unitDoAction,
  "unit.setOrder": unitSetOrder,
  "unit.findPath": unitFindPath,
  "unit.disband": unitDisband,
  "unit.moveAlongPath": unitMoveAlongPath,
  "unit.getRange": unitGetRange,
  "unit.getFailedActionRequirements": unitGetFailedActionRequirements,
  "unit.getAll": unitGetAll,

  "tile.getAll": tileGetAll,
  "tile.getOwnership": tileGetOwnership,
  "tile.getFogOfWar": tileGetFogOfWar,
  "tile.getDetails": tileGetDetails,
  "tile.getHoverDetails": tileGetHoverDetails,
  "tile.getInRange": tileGetInRange,
  "tile.update": tileUpdate,
  "tile.bulkUpdate": tileBulkUpdate,

  "resource.getAll": resourceGetAll,
  "resource.editor.spawn": resourceSpawn,

  "city.getAll": cityGetAll,
  "city.getDetails": cityGetCityDetails,
  "city.produce": cityProduce,
  "city.getRange": cityGetRange,
  "city.workTile": cityWorkTile,
  "city.unworkTile": cityUnworkTile,
  "city.optimizeYields": cityOptimizeYields,
  "city.getDistrictAvailableTiles": cityGetDistrictAvailableTiles,

  "entity.getFailedWeakRequirements": entityGetFailedWeakRequirements,
  "entity.getDetails": entityGetDetails,

  "stats.get": statsGet,

  "tech.getAll": techGetAll,
  "tech.getResearch": techGetResearch,
  "tech.research": techResearch,
};

addEventListener("message", async ({ data }) => {
  console.debug("Core: received command", data.command);

  const handler = (HANDLERS as any)[data.command];
  if (!handler) {
    console.error(`No handler for command "${data.command}".`);
    return;
  }

  let result = handler(data.data);

  if (result instanceof Promise) {
    result = await result;
  }

  const changes = collector.flush(game);

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

  if (p.unitsWithoutOrders.length) {
    return {
      task: "unit",
      id: p.unitsWithoutOrders[0].id,
    };
  }

  if (p.citiesWithoutProduction.length) {
    return {
      task: "city",
      id: p.citiesWithoutProduction[0].id,
    };
  }

  if (!p.knowledge.researchingTech) {
    return { task: "chooseTech" };
  }

  return null;
}

async function newGameHandler(
  options: MapGeneratorOptions,
): Promise<GameStartInfo> {
  await dataManager.ready;

  game = new Game();

  const generator = new RealisticMapGenerator(
    options.humanPlayersCount + options.aiPlayersCount,
  );
  game.map = generator.generate(
    options.width,
    options.height,
    options.seed,
    options.uniformity,
    options.seaLevel,
    options.resources,
  );
  game.map.precompute();

  const nationsExcluded: Nation[] = [];
  let i = 0;
  for (const tile of generator.getStartingLocations()) {
    const nation = dataManager.nations.pickRandom(nationsExcluded);
    nationsExcluded.push(nation);

    const player = new PlayerCore(game, nation);

    if (i++ >= options.humanPlayersCount) {
      player.ai = new AIPlayer(player);
    }

    game.addPlayer(player);

    game.unitsManager.spawn("unit_settler", tile, player);
    game.unitsManager.spawn("unit_scout", tile, player);
    game.unitsManager.spawn("unit_warrior", tile, player);
    player.yields.total.gold = 10;
  }

  game.start();

  const startInfo = gameToGameStartInfo(game);

  collector.flush(game);
  collector.changes.push({ type: "game.start", data: startInfo });
  collector.changes.push({
    type: "trackedPlayer.yields",
    data: game.trackedPlayer.yields,
  });

  return startInfo;
}

function getGameInfo() {
  return gameToGameStartInfo(game);
}

function getAllPlayers() {
  return game.players.map(playerToChannel);
}

function gameGetEntityOptions(options: GameGetEntityOptions): Option<string>[] {
  const entities = dataManager.providers[options.entityType].all;
  return entities.map((entity) => {
    return {
      label: entity.name,
      value: entity.id,
    };
  });
}

function dumpHandler(): string {
  // TODO we might compress the save
  return JSON.stringify(dumpGame(game));
}

async function loadHandler(data: string) {
  await dataManager.ready;

  game = loadGame(JSON.parse(data));

  const startInfo = gameToGameStartInfo(game);

  collector.flush(game);
  collector.changes.push({ type: "game.start", data: startInfo });
  collector.changes.push({
    type: "trackedPlayer.yields",
    data: game.trackedPlayer.yields,
  });

  return startInfo;
}

function nextPlayerHandler() {
  game.trackedPlayer.moveAllUnits();

  // Some units may still have moves available.
  const task = getNextTask();
  if (!task) {
    game.nextPlayer();
  }
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

  const data = trackedPlayerToChannel(game.trackedPlayer);

  collector.research = player.knowledge.researchingTech;
  collector.trackedPlayerYields = game.trackedPlayer.yields;

  collector.changes.push({
    type: "trackedPlayer.changed",
    data,
  });

  return data;
}

function playerGetSuppliedTiles(playerId: number): TilesCoordsWithNeighbours[] {
  const player = game.playersMap.get(playerId);
  if (!player) {
    return [];
  }

  return Array.from(player.suppliedTiles).map(tilesToTileCoordsWithNeighbours);
}

function playertGetYields(): PlayerYields {
  return game.trackedPlayer.yields;
}

function playerGetEconomyOverview(): PlayerEconomyChanneled {
  return {
    cities: game.trackedPlayer.cities.map(cityToOverviewChanneled),
  };
}

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

function unitDoAction(data: UnitDoActionOptions) {
  const unit = game.unitsManager.unitsMap.get(data.unitId);
  if (!unit) {
    return null;
  }

  unit.doAction(data.action);

  return unitDetailsToChannel(unit);
}

function unitSetOrder(data: UnitSetOrderOptions) {
  const unit = game.unitsManager.unitsMap.get(data.unitId);
  if (!unit) {
    return null;
  }

  unit.setOrder(data.order);

  return unitDetailsToChannel(unit);
}

function unitFindPath(data: UnitFindPathOptions) {
  const unit = game.unitsManager.unitsMap.get(data.unitId);
  const tile = game.map.tilesMap.get(data.destinationId);
  if (!unit || !tile) {
    return null;
  }

  // const startTime = performance.now();
  unit.path = findPath(unit, tile);
  // const endTime = performance.now();
  // console.log(`findPath took ${(endTime - startTime).toFixed(2)} milliseconds`);

  return unitDetailsToChannel(unit);
}

function unitDisband(unitId: number): void {
  const unit = game.unitsManager.unitsMap.get(unitId);
  if (!unit) {
    return;
  }

  unit.destroy();
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

function unitGetFailedActionRequirements(
  data: UnitGetFailedActionRequirementsOptions,
): string[] {
  const unit = game.unitsManager.unitsMap.get(data.unitId);
  if (!unit) {
    return [];
  }

  return unit.getFailedActionRequirements(data.action);
}

function unitGetAll(): UnitChanneled[] {
  return game.unitsManager.units.map((unit) => unitToChannel(unit));
}

export function tileGetAll(): TileChanneled[] {
  return Array.from(game.map.tilesMap.values()).map(tileToChannel);
}

export function tileGetOwnership(
  options: FogOfWarFilter,
): TileOwnershipChanneled[] {
  return Array.from(game.map.tilesMap.values()).map((t) =>
    tileToTileOwnershipChannel(t, game, options.fogOfWarEnabled),
  );
}

export function tileGetFogOfWar(): TilesFogOfWarChanneled {
  const tiles = Array.from(game.map.tilesMap.values()).map((t) =>
    tileToFogOfWar(t, game),
  );
  return {
    tiles,
    viewBoundingBox: game.trackedPlayer.viewBoundingBox,
  };
}

export function tileGetDetails(tileId: number): TileDetailsChanneled | null {
  const tile = game.map.tilesMap.get(tileId);
  if (!tile) {
    return null;
  }

  return tileDetailsToChannel(tile, game.trackedPlayer);
}

export function tileGetHoverDetails(
  options: TileGetHoverDetailsOptions,
): TileHoverDetails | null {
  const tile = game.map.tilesMap.get(options.tileId);
  if (!tile) {
    return null;
  }

  let simulation: CombatSimulation | null = null;

  if (options.selectedUnitId && game.trackedPlayer.visibleTiles.has(tile)) {
    const selectedUnit = game.unitsManager.unitsMap.get(options.selectedUnitId);
    if (selectedUnit) {
      simulation = simulateCombat(selectedUnit, tile);
    }
  }

  return {
    tile: tileDetailsToChannel(tile, game.trackedPlayer),
    combatSimulation: simulation ? combatSimulationToChannel(simulation) : null,
  };
}

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

export function tileUpdate(options: TileUpdateOptions) {
  const tile = game.map.tilesMap.get(options.id);
  if (!tile) {
    return;
  }

  const _tile = {
    ...options,
    improvement: options.improvement
      ? dataManager.tileImprovements.get(options.improvement)
      : null,
  };

  Object.assign(tile, _tile);
  tile.updateWithNeighbours();
}

export function tileBulkUpdate(tiles: TileUpdateOptions[]) {
  for (const tile of tiles) {
    tileUpdate(tile);
  }
}

export function resourceSpawn(options: ResourceSpawnOptions) {
  const tile = game.map.tilesMap.get(options.tileId);
  if (!tile) {
    return;
  }

  let resource: ResourceDefinition | null = null;
  if (options.resourceId) {
    resource = dataManager.resources.get(options.resourceId);
  }

  if (tile.resource) {
    if (game.trackedPlayer.exploredTiles.has(tile)) {
      collector.depletedResourceDeposits.add(tile.resource);
    }
  }

  if (resource) {
    tile.resource = ResourceDeposit.from({
      def: resource,
      tile,
      quantity: options.quantity,
      difficulty: 0,
    });

    if (game.trackedPlayer.exploredTiles.has(tile)) {
      collector.discoveredResourceDeposits.add(tile.resource);
    }
  } else {
    tile.resource = null;
  }
  tile.update();
}

export function resourceGetAll(
  options: FogOfWarFilter,
): ResourceWithTileChanneled[] {
  let resources: ResourceDeposit[];
  if (options.fogOfWarEnabled) {
    resources = Array.from(game.trackedPlayer.discoveredResourceDeposits);
  } else {
    resources = game.map.getAllResources();
  }
  return resources.map(resourceWithTileToChannel);
}

export function cityGetAll(options: FogOfWarFilter): CityChanneled[] {
  let cities = game.citiesManager.cities;

  if (options.fogOfWarEnabled) {
    cities = cities.filter((city) =>
      game.trackedPlayer.exploredTiles.has(city.tile),
    );
  }

  return cities.map(cityToChannel);
}

export function cityGetCityDetails(
  cityId: number,
): CityDetailsChanneled | null {
  const city = game.citiesManager.citiesMap.get(cityId);
  if (!city) {
    return null;
  }

  return cityDetailsToChannel(city);
}

export function cityProduce(options: CityProduceOptions) {
  const city = game.citiesManager.citiesMap.get(options.cityId);

  if (!city) {
    return;
  }

  if (options.entityType === "building") {
    city.production.produceBuilding(
      dataManager.buildings.get(options.productId)!,
    );
  } else if (options.entityType === "unit") {
    city.production.produceUnit(dataManager.units.get(options.productId)!);
  } else if (options.entityType === "idleProduct") {
    city.production.workOnIdleProduct(
      dataManager.idleProducts.get(options.productId)!,
    );
  } else if (options.entityType === "district") {
    const tile = game.map.tilesMap.get(options.tileId!);
    if (!tile) {
      throw new Error(`Tile with ID ${options.tileId} not found.`);
    }
    const def = dataManager.districts.get(options.productId)!;
    city.production.produceDistrict(def, tile);
  } else {
    throw new Error(
      `Unknown entity type for city production: ${options.entityType}`,
    );
  }

  return cityDetailsToChannel(city);
}

export function cityGetRange(cityId: number): CityRange | null {
  const city = game.citiesManager.citiesMap.get(cityId);

  if (!city) {
    return null;
  }
  return {
    tiles: Array.from(city.expansion.tiles).map(
      tilesToTileCoordsWithNeighbours,
    ),
    workedTiles: Array.from(city.workers.workedTiles).map(
      tilesToTileCoordsWithNeighbours,
    ),
    blockedTiles: Array.from(city.workers.blockedTiles).map(
      tilesToTileCoordsWithNeighbours,
    ),
  };
}

export function cityWorkTile(options: CityWorkTileOptions) {
  const city = game.citiesManager.citiesMap.get(options.cityId);
  const tile = game.map.tilesMap.get(options.tileId);

  if (!city || !tile) {
    return null;
  }

  city.workers.workTile(tile);

  return cityDetailsToChannel(city);
}

export function cityUnworkTile(options: CityWorkTileOptions) {
  const city = game.citiesManager.citiesMap.get(options.cityId);
  const tile = game.map.tilesMap.get(options.tileId);

  if (!city || !tile) {
    return null;
  }

  city.workers.unworkTile(tile);

  return cityDetailsToChannel(city);
}

export function cityOptimizeYields(cityId: number) {
  const city = game.citiesManager.citiesMap.get(cityId);

  if (!city) {
    return null;
  }

  city.workers.optimizeYields();

  return cityDetailsToChannel(city);
}

export function cityGetDistrictAvailableTiles(
  options: CityGetDistrictAvailableTilesOptions,
): TilesCoordsWithNeighbours[] {
  const city = game.citiesManager.citiesMap.get(options.cityId);
  const district = dataManager.districts.get(options.districtId);

  if (!city || !district) {
    return [];
  }

  const tiles = city.districts.getAvailableTiles(district);

  return tiles.map(tilesToTileCoordsWithNeighbours);
}

export function entityGetFailedWeakRequirements(
  data: EntityGetFailedWeakRequirements,
): Requirement[] {
  const entity = dataManager.get(data.entityId);

  if (
    entity.entityType !== "unit" &&
    entity.entityType !== "building" &&
    entity.entityType !== "idleProduct"
  ) {
    return [];
  }

  let city: CityCore | null = null;
  if (data.cityId !== null) {
    city = game.citiesManager.citiesMap.get(data.cityId)!;
  }

  return getFailedWeakRequirements(
    entity as Entity & HaveRequirements,
    game.trackedPlayer,
    city,
  );
}

export function entityGetDetails(entityId: string): EntityChanneled {
  return entityToChannel(dataManager.get(entityId));
}

export function statsGet(options: StatsGetOptions): StatsGetChanneled[] {
  return game.players.map((player) => {
    return {
      player: playerToChannel(player),
      data: game.stats.data.get(player)![options.type],
    } as StatsGetChanneled;
  });
}

function techGetAll() {
  return dataManager.technologies.all.map((tech) =>
    knowledgeTechToChannel(game.trackedPlayer.knowledge, tech),
  );
}

function techGetResearch() {
  const knowledge = game.trackedPlayer.knowledge;
  if (!knowledge.researchingTech) {
    return null;
  }
  return knowledgeTechToChannel(knowledge, knowledge.researchingTech);
}

function techResearch(techId: string) {
  const tech = dataManager.technologies.get(techId);
  game.trackedPlayer.knowledge.research(tech);
}

function playerGrantRevokeTech(options: GrantRevokeTechOptions) {
  const tech = dataManager.technologies.get(options.techId);
  const player = game.players.find((p) => p.id === options.playerId);
  if (!player) {
    return;
  }

  if (options.grantRevoke === "grant") {
    player.knowledge.addTech(tech);
  } else {
    player.knowledge.removeTech(tech);
  }
}

function playerRevealMap() {
  const tiles = game.map.tilesMap.values();
  game.trackedPlayer.exploreTiles(tiles);
}

function playerDebugGetAiTasks(): AiDebugTasks | null {
  if (!game.trackedPlayer.ai) {
    return null;
  }
  return game.trackedPlayer.ai.serialize();
}

function playerDebugGetAiUnitsRegistry(): AiDebugUnitsRegistry | null {
  if (!game.trackedPlayer.ai) {
    return null;
  }

  const units: AiDebugUnitsRegistryUnit[] = game.trackedPlayer.units.map(
    (unit) => {
      return {
        id: unit.id,
        name: unit.definition.name,
        assignment:
          game.trackedPlayer.ai!.units.assignments.get(unit)?.type ?? null,
      };
    },
  );
  return { units };
}

function playerDebugGetAiMapAnalysis(): AiDebugMapAnalysis | null {
  if (!game.trackedPlayer.ai) {
    return null;
  }

  return mapAnalysisToChannel(game.trackedPlayer.ai.mapAnalysis);
}

function playerDebugGetAiTileAnalysis(tileId: number): TileInfluence | null {
  if (!game.trackedPlayer.ai) {
    return null;
  }

  const tile = game.map.tilesMap.get(tileId);
  if (!tile) {
    return null;
  }

  return game.trackedPlayer.ai.mapAnalysis.heatMap.influences.get(tile) ?? null;
}

function playerEditorGiveGold(options: PlayerEditorGiveGoldOptions): void {
  const player = game.playersMap.get(options.playerId);
  if (!player) {
    return;
  }
  player.yields.total.gold += options.amount;
  if (game.trackedPlayer.id === player.id) {
    collector.trackedPlayerYields = player.yields;
  }
}
