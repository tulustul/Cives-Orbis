import {
  Climate,
  LandForm,
  ProductType,
  SeaLevel,
  TileDirection,
  UnitOrder,
  Yields,
  TileRoad,
  StatsData,
} from "@/shared";
import { AIPlayer } from "@/ai/ai-player";
import { CityCore } from "@/core/city";
import { ProductDefinition } from "@/core/data/types";
import { PlayerCore } from "@/core/player";
import { TileCore } from "@/core/tile";
import { TilesMapCore } from "@/core/tiles-map";
import { UnitCore } from "@/core/unit";
import { Game } from "@/core/game";
import { Knowledge } from "@/core/knowledge";
import { ResourceDeposit } from "@/core/resources";
import { Stats } from "@/core/stats";
import { dataManager } from "@/core/data/dataManager";

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
  improvement?: string;
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

type DistrictSerialized = {
  defId: string;
  tileId: number;
};

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
  districtTile: number | null;
  tiles: number[];
  workedTiles: number[];
  buildings: string[];
  storage: { id: string; amount: number }[];
  health: number;
  districts: DistrictSerialized[];
}

interface PlayerSerialized {
  id: number;
  ai: boolean;
  nation: string;
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
  const result: Partial<TileSerialized>[] = [];
  let lastTile: Partial<TileCore> = {};
  for (let x = 0; x < map.width; x++) {
    for (let y = 0; y < map.height; y++) {
      const tile = map.tiles[x][y];
      const diff: TileSerialized = {};

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
      if (tile.road !== lastTile.road) {
        diff.road = tile.road;
      }

      if (tile.improvement) {
        diff.improvement = tile.improvement.id;
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

      if (tileData.improvement) {
        tile.improvement = dataManager.tileImprovements.get(
          tileData.improvement,
        );
      }

      tile.road = tileData.road !== undefined ? tileData.road! : lastTile.road;

      if (tileData.resource) {
        const resourceDef = dataManager.resources.get(tileData.resource.id);
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
    nation: player.nation.id,
    exploredTiles: Array.from(player.exploredTiles).map((t) => t.id),
    yieldsTotal: player.yields.total,
    knowledge: dumpKnowledge(player.knowledge),
  };
}

function loadPlayer(game: Game, data: PlayerSerialized) {
  const nation = dataManager.nations.get(data.nation);
  const player = new PlayerCore(game, nation);

  if (data.ai) {
    player.ai = new AIPlayer(player);
  }

  const tiles = data.exploredTiles.map(
    (tileId) => game.map.tilesMap.get(tileId)!,
  );
  player.exploreTiles(tiles);
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
    data.knownTechs.map((id) => dataManager.technologies.get(id)),
  );
  knowledge.researchingTech = data.currentTech
    ? dataManager.technologies.get(data.currentTech)
    : null;
  knowledge.techQueue = data.techQueue.map((id) =>
    dataManager.technologies.get(id),
  );
  knowledge.accumulated = new Map(
    Object.entries(data.accumulated).map(([id, value]) => [
      dataManager.technologies.get(id),
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

  city.defense.health = cityData.health ?? 0;

  for (const tileIndex of cityData.tiles) {
    city.expansion.addTile(game.map.tilesMap.get(tileIndex)!);
  }

  for (const tileIndex of cityData.workedTiles) {
    city.workers.workTile(game.map.tilesMap.get(tileIndex)!);
  }

  if (cityData.product) {
    let productDefinition: ProductDefinition;

    if (cityData.product.type === "unit") {
      productDefinition = dataManager.units.get(cityData.product.id);
    } else if (cityData.product.type === "building") {
      productDefinition = dataManager.buildings.get(cityData.product.id)!;
    } else if (cityData.product.type === "idleProduct") {
      productDefinition = dataManager.idleProducts.get(cityData.product.id)!;
    } else if (cityData.product.type === "district") {
      productDefinition = dataManager.districts.get(cityData.product.id)!;
    } else {
      throw new Error(
        `Unknown product type: ${cityData.product.type} for id ${cityData.product.id}`,
      );
    }

    city.production.product = productDefinition;
  }

  if (cityData.districtTile !== null) {
    city.production.districtTile =
      game.map.tilesMap.get(cityData.districtTile) ?? null;
  }

  city.production.buildings = cityData.buildings.map((b) =>
    dataManager.buildings.get(b),
  );
  city.production.buildingsIds = new Set(
    city.production.buildings.map((b) => b.id),
  );
  city.update();
  for (const storageItem of cityData.storage) {
    const resourceDef = dataManager.resources.get(storageItem.id);
    city.storage.addResource(resourceDef, storageItem.amount);
  }

  for (const districtData of cityData.districts) {
    const def = dataManager.districts.get(districtData.defId);
    const tile = game.map.getTileSafe(districtData.tileId);
    city.districts.add(def, tile);
  }
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
    districtTile: city.production.districtTile
      ? city.production.districtTile.id
      : null,
    tiles: Array.from(city.expansion.tiles).map((tile) => tile.id),
    workedTiles: Array.from(city.workers.workedTiles).map((tile) => tile.id),
    buildings: city.production.buildings.map((b) => b.id),
    storage: Array.from(city.storage.resources.values()).map((storageItem) => ({
      id: storageItem.resource.id,
      amount: storageItem.amount,
    })),
    health: city.defense.health,
    districts: city.districts.all.map((district) => ({
      defId: district.def.id,
      tileId: district.tile.id,
    })),
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
