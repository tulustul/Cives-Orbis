import { Game } from "../game";
import { CityCore } from "@/core/city";
import { Yields } from "@/core/yields";
import { PlayerCore } from "@/core/player";
import { AIPlayer } from "@/ai/ai-player";
import { Climate, LandForm, SeaLevel, TileDirection } from "@/shared";
import { TileImprovement, TileRoad } from "@/core/tile-improvements";
import { TileCore } from "@/core/tile";
import { TilesMapCore } from "@/core/tiles-map";
import { UnitCore, UnitOrder } from "@/core/unit";
import { ProductDefinition, ProductType } from "@/core/data.interface";
import {
  getUnitById,
  getBuildingById,
  getIdleProductById,
  getTechById,
} from "../data-manager";
import { ResourceDeposit } from "../resources";
import { RESOURCES_DEFINITIONS } from "@/data/resources";
import { Stats, StatsData } from "../stats";
import { Knowledge } from "../knowledge";

export interface GameSerialized {
  turn: number;
  map: MapSerialized;
  players: PlayerSerialized[];
  activePlayerIndex: number;
  trackedPlayerId: number;
  units: UnitSerialized[];
  cities: CitySerialized[];
  stats: StatsSerialized[];
}

type StatsSerialized = {
  playerId: number;
  data: StatsData;
};

interface MapSerialized {
  width: number;
  height: number;
  tiles: TileSerialized[];
}

type ResourceSerialized = {
  id: string;
  quantity: number;
};

interface TileSerialized {
  climate?: Climate;
  landForm?: LandForm;
  seaLevel?: SeaLevel;
  improvement?: TileImprovement | null;
  road?: TileRoad | null;
  riverParts?: TileDirection[];
  forest?: boolean;
  wetlands?: boolean;
  resource?: ResourceSerialized;
}

interface ProductSerialized {
  type: ProductType;
  id: string;
}

interface CitySerialized {
  id: number;
  name: string;
  size: number;
  tile: number;
  player: number;
  totalFood: number;
  totalCulture: number;
  totalProduction: number;
  product: ProductSerialized | null;
  tiles: number[];
  workedTiles: number[];
  buildings: string[];
}

interface PlayerSerialized {
  id: number;
  ai: boolean;
  color: number;
  exploredTiles: number[];
  yieldsTotal: Yields;
  knowledge: KnowledgeSerialized;
}

type KnowledgeSerialized = {
  knownTechs: string[];
  currentTech: string | null;
  techQueue: string[];
  accumulated: Record<string, number>;
  overflow: number;
};

interface UnitSerialized {
  id: number;
  tile: number;
  definition: string;
  actionPointsLeft: number;
  health: number;
  supplies: number;
  player: number;
  order: UnitOrder | null;
  path: number[][] | null;
  parent: number | null;
}

export function dumpGame(game: Game): GameSerialized {
  return {
    turn: game.turn,
    trackedPlayerId: game.trackedPlayer.id,
    activePlayerIndex: game.activePlayerIndex,
    map: dumpMap(game.map),
    players: game.players.map((p) => dumpPlayer(p)),
    units: game.unitsManager.units.map((u) => dumpUnit(u)),
    cities: game.citiesManager.cities.map((c) => dumpCity(c)),
    stats: dumpStats(game.stats),
  };
}

export function loadGame(data: GameSerialized) {
  const game = new Game();

  game.turn = data.turn;

  // First deserialize map as other entities depend on it.
  game.map = loadMap(data.map);

  // Then players as unit deserialization needs them.
  for (const playerData of data.players) {
    const player = loadPlayer(game, playerData);
    game.addPlayer(player);
  }
  game.activePlayerIndex = data.activePlayerIndex;

  for (const unitData of data.units) {
    loadUnit(game, unitData);
  }
  for (const unitData of data.units) {
    if (unitData.parent) {
      const parent = game.unitsManager.unitsMap.get(unitData.parent);
      const child = game.unitsManager.unitsMap.get(unitData.id);
      if (parent && child) {
        parent.addChild(child);
      }
    }
  }

  for (const city of data.cities) {
    loadCity(game, city);
  }

  loadStats(game, data.stats);

  game.preprocessEntities();

  return game;
}

function dumpMap(map: TilesMapCore): MapSerialized {
  return {
    width: map.width,
    height: map.height,
    tiles: dumpTiles(map),
  };
}

function dumpTiles(map: TilesMapCore): TileSerialized[] {
  // Store only changes from the last tile to keep save size minimal
  const result: Partial<Omit<TileCore, "resource">>[] = [];
  let lastTile: Partial<TileCore> = {};
  for (let x = 0; x < map.width; x++) {
    for (let y = 0; y < map.height; y++) {
      const tile = map.tiles[x][y];
      const diff: Partial<Omit<TileCore, "resource">> & {
        resource?: ResourceSerialized;
      } = {};

      if (tile.seaLevel !== lastTile.seaLevel) {
        diff.seaLevel = tile.seaLevel;
      }
      if (tile.climate !== lastTile.climate) {
        diff.climate = tile.climate;
      }
      if (tile.landForm !== lastTile.landForm) {
        diff.landForm = tile.landForm;
      }
      if (tile.forest !== lastTile.forest) {
        diff.forest = tile.forest;
      }
      if (tile.wetlands !== lastTile.wetlands) {
        diff.wetlands = tile.wetlands;
      }
      if (tile.improvement !== lastTile.improvement) {
        diff.improvement = tile.improvement;
      }
      if (tile.road !== lastTile.road) {
        diff.road = tile.road;
      }

      // Resources don't repeat.
      if (tile.resource) {
        diff.resource = {
          id: tile.resource.def.id,
          quantity: tile.resource.quantity,
        };
      }

      // The rivers tend to not repeat in subsequent tiles so instead of using diff let's just ignore empty rivers.
      if (tile.riverParts.length) {
        diff.riverParts = tile.riverParts;
      }

      result.push(diff);
      lastTile = tile;
    }
  }
  return result;
}

function loadMap(mapData: MapSerialized) {
  const map = new TilesMapCore(mapData.width, mapData.height);
  let lastTile: TileCore = map.tiles[0][0];
  let index = 0;

  for (let x = 0; x < mapData.width; x++) {
    for (let y = 0; y < mapData.height; y++) {
      const tileData = mapData.tiles[index];
      const tile = map.tiles[x][y];

      tile.climate =
        tileData.climate !== undefined ? tileData.climate! : lastTile.climate;

      tile.seaLevel =
        tileData.seaLevel !== undefined
          ? tileData.seaLevel!
          : lastTile.seaLevel;

      tile.landForm =
        tileData.landForm !== undefined
          ? tileData.landForm!
          : lastTile.landForm;

      tile.improvement =
        tileData.improvement !== undefined
          ? tileData.improvement!
          : lastTile.improvement;

      tile.road = tileData.road !== undefined ? tileData.road! : lastTile.road;

      if (tileData.resource) {
        const resourceDef = RESOURCES_DEFINITIONS.find(
          (r) => r.id === tileData.resource?.id,
        );
        if (resourceDef) {
          tile.resource = ResourceDeposit.from({
            def: resourceDef,
            tile,
            quantity: tileData.resource.quantity,
            difficulty: 0,
          });
        }
      }

      tile.riverParts = tileData.riverParts || [];

      tile.forest =
        tileData.forest !== undefined ? tileData.forest! : lastTile.forest;

      lastTile = tile;
      index++;
    }
  }

  map.precompute();

  return map;
}

function dumpPlayer(player: PlayerCore): PlayerSerialized {
  return {
    id: player.id,
    ai: !!player.ai,
    color: player.color,
    exploredTiles: Array.from(player.exploredTiles).map((t) => t.id),
    yieldsTotal: player.yields.total,
    knowledge: dumpKnowledge(player.knowledge),
  };
}

function loadPlayer(game: Game, data: PlayerSerialized) {
  const player = new PlayerCore(game, data.color || 0);

  if (data.ai) {
    player.ai = new AIPlayer(player);
  }

  for (const tileId of data.exploredTiles) {
    player.exploredTiles.add(game.map.tilesMap.get(tileId)!);
  }
  player.updateViewBoundingBox(player.exploredTiles);
  player.yields.total = data.yieldsTotal;
  player.updateYields();
  player.knowledge = loadKnowledge(player, data.knowledge);
  return player;
}

function dumpKnowledge(knowledge: Knowledge): KnowledgeSerialized {
  const accumulated: Record<string, number> = {};

  for (const [tech, value] of knowledge.accumulated.entries()) {
    accumulated[tech.id] = value;
  }

  return {
    accumulated,
    currentTech: knowledge.researchingTech?.id || null,
    knownTechs: Array.from(knowledge.discoveredTechs).map((t) => t.id),
    overflow: knowledge.overflow,
    techQueue: knowledge.techQueue.map((t) => t.id),
  };
}

function loadKnowledge(player: PlayerCore, data: KnowledgeSerialized) {
  const knowledge = new Knowledge(player);

  knowledge.discoveredTechs = new Set(
    data.knownTechs.map((id) => getTechById(id)),
  );
  knowledge.researchingTech = data.currentTech
    ? getTechById(data.currentTech)
    : null;
  knowledge.techQueue = data.techQueue.map((id) => getTechById(id));
  knowledge.accumulated = new Map(
    Object.entries(data.accumulated).map(([id, value]) => [
      getTechById(id),
      value,
    ]),
  );
  knowledge.overflow = data.overflow;

  knowledge.update();

  return knowledge;
}

function loadCity(game: Game, cityData: CitySerialized) {
  const tile = game.map.tilesMap.get(cityData.tile)!;
  const player = game.players[cityData.player];
  const city = game.citiesManager.spawn(tile, player, false);

  if (!city) {
    return;
  }

  city.name = cityData.name;

  city.population.population.set("peasant", cityData.size);
  city.population.computeTotal();

  city.population.totalFood = cityData.totalFood;
  city.production.totalProduction = cityData.totalProduction;

  city.expansion.totalCulture = cityData.totalCulture;

  for (const tileIndex of cityData.tiles) {
    city.expansion.addTile(game.map.tilesMap.get(tileIndex)!);
  }

  for (const tileIndex of cityData.workedTiles) {
    city.workers.workTile(game.map.tilesMap.get(tileIndex)!);
  }

  if (cityData.product) {
    let productDefinition: ProductDefinition;

    if (cityData.product.type === "unit") {
      productDefinition = getUnitById(cityData.product.id);
    } else if (cityData.product.type === "building") {
      productDefinition = getBuildingById(cityData.product.id)!;
    } else {
      productDefinition = getIdleProductById(cityData.product.id)!;
    }

    city.production.product = productDefinition;
  }

  city.production.buildings = cityData.buildings.map(
    (b) => getBuildingById(b)!,
  );
  city.production.buildingsIds = new Set(
    city.production.buildings.map((b) => b.id),
  );
  city.updateYields();
}

function dumpCity(city: CityCore): CitySerialized {
  return {
    id: city.id,
    name: city.name,
    size: city.population.total,
    player: city.player.id,
    tile: city.tile.id,
    totalFood: city.population.totalFood,
    totalProduction: city.production.totalProduction,
    totalCulture: city.expansion.totalCulture,
    product: city.production.product
      ? {
          type: city.production.product.entityType,
          id: city.production.product.id,
        }
      : null,
    tiles: Array.from(city.expansion.tiles).map((tile) => tile.id),
    workedTiles: Array.from(city.workers.workedTiles).map((tile) => tile.id),
    buildings: city.production.buildings.map((b) => b.id),
  };
}

function dumpStats(stats: Stats): StatsSerialized[] {
  return Array.from(stats.data.entries()).map(([player, data]) => ({
    playerId: player.id,
    data,
  }));
}

function loadStats(game: Game, stats: StatsSerialized[]) {
  game.stats.prepare();
  for (const { playerId, data } of stats) {
    const player = game.playersMap.get(playerId);
    if (player) {
      game.stats.data.set(player, data);
    }
  }
}

function dumpUnit(unit: UnitCore): UnitSerialized {
  return {
    id: unit.id,
    tile: unit.tile.id,
    definition: unit.definition.id,
    actionPointsLeft: unit.actionPointsLeft,
    health: unit.health,
    supplies: unit.supplies,
    player: unit.player.id,
    order: unit.order,
    path: unit.path?.map((row) => row.map((tile) => tile.id)) || null,
    parent: unit.parent ? unit.parent.id : null,
  };
}

function loadUnit(game: Game, unitData: UnitSerialized) {
  const tile = game.map.tilesMap.get(unitData.tile)!;
  const player = game.players[unitData.player];
  const unit = game.unitsManager.spawn(unitData.definition, tile, player);
  unit.actionPointsLeft = unitData.actionPointsLeft;
  unit.health = unitData.health;
  unit.supplies = unitData.supplies;
  unit.order = unitData.order;

  unit.path =
    unitData.path?.map((row) =>
      row.map((tileId) => game.map.tilesMap.get(tileId)!),
    ) || null;
}
