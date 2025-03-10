import { CityCore, CityVisibility } from "@/core/city";
import { Game } from "@/core/game";
import { PlayerCore } from "@/core/player";
import { ResourceCore } from "@/core/resources";
import { TileCore } from "@/core/tile";
import { TilesMapCore } from "@/core/tiles-map";
import { UnitCore, UnitOrder } from "@/core/unit";
import { Yields } from "@/core/yields";
import { BaseTile, PlayerYields } from "@/shared";
import { UnitMoveCore } from "../collector";
import {
  ProductDefinition,
  ProductType,
  UnitDefinition,
  UnitTrait,
} from "../data.interface";
import { CombatSimulation } from "../combat";
import { Bonuses } from "../bonus";
import { UnitAction } from "../unit-actions";

export interface GameChanneled {
  turn: number;
  map: MapChanneled;
  players: PlayerChanneled[];
  trackedPlayer: TrackedPlayerChanneled;
  units: UnitChanneled[];
  cities: CityChanneled[];
}

export type GameInfo = {
  mapWidth: number;
  mapHeight: number;
  aiOnly: boolean;
  turn: number;
};

export type GameStartInfo = {
  gameInfo: GameInfo;
  tileToGo: TileCoords | null;
  unitIdToSelect: number | null;
  aiOnly: boolean;
};

export interface MapChanneled {
  width: number;
  height: number;
  tiles: TileChanneled[][];
}

export interface TileChanneled extends BaseTile {
  areaOf: number | null;
  cityId: number | null;
  unitsIds: number[];
  resource: ResourceChanneled | null;
  roads: string;
  playerColor: number | null;
}

export interface TileDetailsChanneled extends Omit<TileChanneled, "unitsIds"> {
  units: UnitChanneled[];
  zocPlayerId: number | null;
  zocNoMansLand: boolean;
  isSupplied: boolean;
  isExplored: boolean;
}

export type CombatSimulationChanneled = {
  attacker: UnitDetailsChanneled;
  defender: UnitDetailsChanneled;
  simulation: CombatSimulation;
};

export type TileHoverDetails = {
  tile: TileDetailsChanneled;
  combatSimulation: CombatSimulationChanneled | null;
};

export interface CityChanneled {
  id: number;
  visibilityLevel: CityVisibility;
  name: string;
  size: number;
  tile: TileCoords;
  playerId: number;
  cssColor: string;

  totalFood: number;
  foodToGrow: number;
  foodPerTurn: number;
  turnsToGrow: number;

  totalProduction: number;
  productionPerTurn: number;
  productionRequired: number | null;
  turnsToProductionEnd: number | null;
  productName: string | null;
}

export type CityBuildingChanneled = {
  id: string;
  name: string;
  definition: ProductDefinitionChanneled;
};

export interface CityDetailsChanneled {
  id: number;
  visibilityLevel: CityVisibility;
  name: string;
  size: number;
  tile: TileCoords;
  playerId: number;

  totalFood: number;
  foodToGrow: number;
  turnsToGrow: number;

  totalProduction: number;
  turnsToProductionEnd: number | null;
  foodConsumed: number;

  totalCulture: number;
  cultureToExpand: number;

  tileYields: Yields;
  yields: Yields;
  perTurn: Yields;

  buildings: CityBuildingChanneled[];

  tiles: TileCoords[];
  workedTiles: TilesCoordsWithNeighbours[];

  turnsToExpand: number;

  availableProducts: CityProductChanneled[];
  product: CityProductChanneled | null;
}

export type CityProductChanneled = {
  enabled: boolean;
  turnsToProduce: number;
  definition: ProductDefinitionChanneled;
};

export type ProductDefinitionChanneled = {
  id: string;
  productType: ProductType;
  name: string;
  productionCost: number;
  bonuses: Bonuses;
};

export interface PlayerChanneled {
  id: number;
  color: number;
  cssColor: string;
  areaId: number;
  isAi: boolean;
}

export interface TrackedPlayerChanneled {
  id: number;
  color: number;
  exploredTiles: TileCoords[];
  visibleTiles: TileCoords[];
  units: number[];
  cities: number[];

  yields: PlayerYields;
  isAi: boolean;
}

export interface UnitChanneled {
  id: number;
  tile: TileCoordsWithUnits;
  definitionId: string;
  type: "military" | "civilian";
  actions: "all" | "some" | "none";
  cssColor: string;
  parentId: number | null;
  childrenIds: number[];
  actionPointsLeft: number;
  health: number;
  supplies: number;
  playerId: number;
  canControl: boolean;
  order: UnitOrder | null;
}

export type UnitPathChanneled = {
  turns: TileCoords[][];
  startTurn: number;
  endType: "move" | "attack";
};

export type UnitDetailsChanneled = {
  id: number;
  tile: TileCoords;
  definition: UnitDefinition;
  type: "military" | "civilian";
  trait: UnitTrait;
  cssColor: string;
  parentId: number | null;
  childrenIds: number[];
  actionPointsLeft: number;
  health: number;
  supplies: number;
  order: UnitOrder | null;
  path: UnitPathChanneled | null;
  isSupplied: boolean;
  playerId: number;
  canControl: boolean;
  actions: UnitAction[];
};

export type TileCoordsWithUnits = TileCoords & {
  units: { id: number; parentId: number | null }[];
};

export type TilesCoordsWithNeighbours = TileCoords & {
  fullNeighbours: (number | null)[];
};

export interface UnitMoveChanneled {
  unitId: number;
  tiles: TileCoordsWithUnits[];
}

export interface ResourceChanneled {
  id: string;
  name: string;
  quantity: number;
}

export type AreaChanneled = {
  id: number;
  color: number;
  tiles: TilesCoordsWithNeighbours[];
};

export type TileCoords = {
  id: number;
  x: number;
  y: number;
};

export function gameToChannel(game: Game): GameChanneled {
  return {
    turn: game.turn,
    map: mapToChannel(game.map),
    players: game.players.map((p) => playerToChannel(p)),
    trackedPlayer: trackedPlayerToChannel(game.trackedPlayer),
    units: game.unitsManager.units.map((u) => unitToChannel(u)),
    cities: game.citiesManager.cities.map((c) => cityToChannel(c)),
  };
}

export function gameToGameStartInfo(game: Game): GameStartInfo {
  const unitToSelect = game.trackedPlayer.unitsWithoutOrders[0];
  const city = game.trackedPlayer.cities[0];
  let tileToGo = unitToSelect ? unitToSelect.tile : city ? city.tile : null;
  if (!tileToGo) {
    tileToGo = game.trackedPlayer.units[0]?.tile ?? null;
  }

  return {
    gameInfo: {
      mapWidth: game.map.width,
      mapHeight: game.map.height,
      aiOnly: game.players.every((p) => p.ai),
      turn: game.turn,
    },
    tileToGo: tileToGo ? tileToTileCoords(tileToGo) : null,
    unitIdToSelect: unitToSelect?.id ?? null,
    aiOnly: game.players.every((p) => p.ai),
  };
}

export function mapToChannel(map: TilesMapCore): MapChanneled {
  const tiles: TileChanneled[][] = [];
  for (let x = 0; x < map.width; x++) {
    const row: TileChanneled[] = [];
    tiles.push(row);
    for (let y = 0; y < map.height; y++) {
      row.push(tileToChannel(map.tiles[x][y]));
    }
  }

  return {
    width: map.width,
    height: map.height,
    tiles,
  };
}

export function tileToChannel(tile: TileCore): TileChanneled {
  return {
    id: tile.id,
    x: tile.x,
    y: tile.y,
    climate: tile.climate,
    forest: tile.forest,
    improvement: tile.improvement,
    landForm: tile.landForm,
    riverParts: tile.riverParts,
    road: tile.road,
    seaLevel: tile.seaLevel,
    wetlands: tile.wetlands,
    yields: tile.yields,
    areaOf: tile.areaOf ? tile.areaOf.id : null,
    unitsIds: tile.units.map((u) => u.id),
    cityId: tile.city ? tile.city.id : null,
    resource: tile.resource ? resourceToChannel(tile.resource) : null,
    roads: tile.fullNeighbours
      .map((n) => (!n || n.road === null ? "0" : "1"))
      .join(""),
    playerColor: tile.areaOf?.player.color ?? null,
  };
}

export function resourceToChannel(resource: ResourceCore): ResourceChanneled {
  return {
    id: resource.definition.id,
    name: resource.definition.name,
    quantity: resource.quantity,
  };
}

export function cityToChannel(city: CityCore): CityChanneled {
  return {
    id: city.id,
    visibilityLevel: city.getVisibilityFor(city.player.game.trackedPlayer),
    name: city.name,
    size: city.size,
    playerId: city.player.id,
    cssColor: city.player.cssColor,
    tile: tileToTileCoords(city.tile),

    totalFood: city.totalFood,
    foodToGrow: city.getFoodToGrow(),
    foodPerTurn: city.perTurn.food,
    turnsToGrow: city.turnsToGrow,

    totalProduction: city.totalProduction,
    productionPerTurn: city.yields.production,
    productionRequired: city.product ? city.product.productionCost : null,
    turnsToProductionEnd: city.turnsToProductionEnd,
    productName: city.product ? city.product.name : null,
  };
}

export function cityDetailsToChannel(city: CityCore): CityDetailsChanneled {
  city.updateProductsList();

  return {
    id: city.id,
    visibilityLevel: city.getVisibilityFor(city.player.game.trackedPlayer),
    name: city.name,
    size: city.size,
    playerId: city.player.id,
    tile: tileToTileCoords(city.tile),

    totalFood: city.totalFood,
    foodToGrow: city.getFoodToGrow(),
    turnsToGrow: city.turnsToGrow,

    totalProduction: city.totalProduction,
    turnsToProductionEnd: city.turnsToProductionEnd,
    buildings: city.buildings.map((b) => ({
      id: b.id,
      name: b.name,
      definition: {
        id: b.id,
        productType: b.productType,
        name: b.name,
        productionCost: b.productionCost,
        bonuses: b.bonuses,
      },
    })),
    cultureToExpand: city.getCultureToExpand(),
    foodConsumed: city.foodConsumed,
    perTurn: city.perTurn,
    tileYields: city.tileYields,
    tiles: Array.from(city.tiles).map(tileToTileCoords),
    totalCulture: city.totalCulture,
    workedTiles: Array.from(city.workedTiles).map(
      tilesToTileCoordsWithNeighbours
    ),
    yields: city.yields,
    turnsToExpand: city.turnsToExpand,
    availableProducts: [
      ...city.availableUnits,
      ...city.availableBuildings,
      ...city.availableIdleProducts,
    ].map((p) => cityProductToChannel(city, p, city.disabledProducts)),
    product: city.product ? cityProductToChannel(city, city.product) : null,
  };
}

export function playerToChannel(player: PlayerCore): PlayerChanneled {
  return {
    id: player.id,
    color: player.color,
    cssColor: player.cssColor,
    areaId: player.area.id,
    isAi: !!player.ai,
  };
}

export function trackedPlayerToChannel(
  player: PlayerCore
): TrackedPlayerChanneled {
  return {
    id: player.id,
    color: player.color,
    exploredTiles: Array.from(player.exploredTiles).map(tileToTileCoords),
    visibleTiles: Array.from(player.visibleTiles).map(tileToTileCoords),
    units: player.units.map((u) => u.id),
    cities: player.cities.map((c) => c.id),
    yields: player.yields,
    isAi: !!player.ai,
  };
}

export function unitToChannel(unit: UnitCore): UnitChanneled {
  return {
    id: unit.id,
    type: unit.definition.strength > 0 ? "military" : "civilian",
    tile: tileToTileCoordsWithUnits(unit.tile),
    definitionId: unit.definition.id,
    cssColor: unit.player.cssColor,
    parentId: unit.parent?.id || null,
    childrenIds: unit.children.map((c) => c.id),
    health: unit.health,
    supplies: unit.supplies,
    actionPointsLeft: unit.actionPointsLeft,
    playerId: unit.player.id,
    canControl: unit.player === unit.player.game.trackedPlayer,
    order: unit.order,
    actions:
      unit.actionPointsLeft === unit.definition.actionPoints
        ? "all"
        : unit.actionPointsLeft > 0
        ? "some"
        : "none",
  };
}

export function unitDetailsToChannel(unit: UnitCore): UnitDetailsChanneled {
  return {
    id: unit.id,
    type: unit.definition.strength > 0 ? "military" : "civilian",
    tile: tileToTileCoords(unit.tile),
    definition: unit.definition,
    trait: unit.definition.trait,
    cssColor: unit.player.cssColor,
    parentId: unit.parent?.id || null,
    childrenIds: unit.children.map((c) => c.id),
    actionPointsLeft: unit.actionPointsLeft,
    health: unit.health,
    supplies: unit.supplies,
    order: unit.order,
    path: unitToUnitPathChannelled(unit),
    isSupplied: unit.isSupplied,
    playerId: unit.player.id,
    canControl: unit.player === unit.player.game.trackedPlayer,
    actions: unit.definition.actions.filter((action) =>
      unit.checkActionRequirements(action)
    ),
  };
}

export function unitToUnitPathChannelled(
  unit: UnitCore
): UnitPathChanneled | null {
  if (!unit.path) {
    return null;
  }

  const i = unit.path.length - 1;
  const lastTile = unit.path[i][unit.path[i].length - 1];

  return {
    turns: unit.path?.map((row) => row.map(tileToTileCoords)) || null,
    startTurn: unit.actionPointsLeft > 0 ? 0 : 1,
    endType: lastTile.getFirstEnemyUnit(unit) ? "attack" : "move",
  };
}

export function unitMoveToChannel(move: UnitMoveCore): UnitMoveChanneled {
  return {
    unitId: move.unit.id,
    tiles: move.tiles.map(tileToTileCoordsWithUnits),
  };
}

export function tileDetailsToChannel(
  tile: TileCore,
  forPlayer: PlayerCore
): TileDetailsChanneled {
  return {
    ...tileToChannel(tile),
    zocPlayerId: tile.zocPlayer?.id ?? null,
    zocNoMansLand: tile.zocNoMansLand,
    isSupplied: tile.isSuppliedByPlayer(forPlayer),
    units: tile.units.map((u) => unitToChannel(u)),
    isExplored: forPlayer.exploredTiles.has(tile),
  };
}

export function tileToTileCoords(tile: TileCore): TileCoords {
  return { id: tile.id, x: tile.x, y: tile.y };
}

export function tileToTileCoordsWithUnits(tile: TileCore): TileCoordsWithUnits {
  return {
    ...tileToTileCoords(tile),
    units: tile.units.map((u) => {
      return { id: u.id, parentId: u.parent?.id ?? null };
    }),
  };
}

export function tilesToTileCoordsWithNeighbours(
  tile: TileCore
): TilesCoordsWithNeighbours {
  return {
    ...tileToTileCoords(tile),
    fullNeighbours: tile.fullNeighbours.map((t) => t?.id ?? null),
  };
}

export function cityProductToChannel(
  city: CityCore,
  product: ProductDefinition,
  disabledProducts?: Set<ProductDefinition>
): CityProductChanneled {
  return {
    enabled: disabledProducts ? !disabledProducts.has(product) : true,
    turnsToProduce: Math.ceil(product.productionCost / city.yields.production),
    definition: {
      id: product.id,
      productType: product.productType,
      name: product.name,
      productionCost: product.productionCost,
      bonuses: product.bonuses,
    },
  };
}
