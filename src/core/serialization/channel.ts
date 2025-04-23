import { CityCore, CityVisibility } from "@/core/city";
import { Game } from "@/core/game";
import { PlayerCore } from "@/core/player";
import { ResourceDeposit } from "@/core/resources";
import { TileCore } from "@/core/tile";
import { TilesMapCore } from "@/core/tiles-map";
import { UnitCore, UnitOrder } from "@/core/unit";
import { Yields } from "@/core/yields";
import { BaseTile, PlayerYields, SeaLevel } from "@/shared";
import { Bonuses } from "../bonus";
import { UnitMoveCore } from "../collector";
import { CombatSimulation } from "../combat";
import {
  Building,
  Entity,
  EntityType,
  IdleProduct,
  NationColors,
  ProductDefinition,
  ProductType,
  TechEra,
  TechLayout,
  Technology,
  TileImprovementDefinition,
  UnitDefinition,
  UnitTrait,
  UnitType,
} from "../data.interface";
import { Knowledge, KnowledgeTechState } from "../knowledge";
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
  coasts: string;
  playerColor: NationColors | null;
  fullNeighbours: (number | null)[];
}

export type TileOwnershipChanneled = TileCoords & {
  colors: NationColors | null;
  borders: number;
};

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
  colors: NationColors;

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

export type CityStorage = {
  resource: EntityMinimalChanneled;
  amount: number;
};

export interface CityDetailsChanneled {
  id: number;
  visibilityLevel: CityVisibility;
  name: string;
  size: number;
  tile: TileCoords;
  playerId: number;
  colors: NationColors;

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

  buildings: BuildingChanneled[];

  tiles: TileCoords[];
  workedTiles: TilesCoordsWithNeighbours[];

  turnsToExpand: number;

  availableProducts: CityProductChanneled[];
  product: CityProductChanneled | null;

  storage: CityStorage[];
}

export type CityProductChanneled = {
  enabled: boolean;
  turnsToProduce: number;
  definition: ProductChanneled;
};

export type ProductDefinitionChanneled = {
  id: string;
  entityType: ProductType;
  name: string;
  productionCost: number;
  bonuses: Bonuses;
};

export interface PlayerChanneled {
  id: number;
  name: string;
  colors: NationColors;
  isAi: boolean;
}

export interface TrackedPlayerChanneled {
  id: number;
  colors: NationColors;
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
  colors: NationColors;
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
  definition: UnitDefChanneled;
  type: "military" | "civilian";
  trait: UnitTrait;
  colors: NationColors;
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

export type ResourceChanneled = {
  id: string;
  name: string;
  quantity: number;
};

export type ResourceWithTileChanneled = ResourceChanneled & {
  tile: TileCoords;
};

export type AreaChanneled = {
  id: number;
  primaryColor: string;
  secondaryColor: string;
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
    coasts: getCoasts(tile),
    playerColor: tile.areaOf?.player.nation.colors ?? null,
    fullNeighbours: tile.fullNeighbours.map((t) => t?.id ?? null),
  };
}

export function tileToTileOwnershipChannel(
  tile: TileCore,
  game: Game | null = null,
): TileOwnershipChanneled {
  let borders = 0;
  let colors: NationColors | null = null;
  if (tile.areaOf && (!game || game.trackedPlayer.exploredTiles.has(tile))) {
    const player = tile.areaOf.player;
    colors = player.nation.colors;
    borders = tile.fullNeighbours.reduce<number>((acc, n, i) => {
      if (n && n.areaOf?.player !== player) {
        return acc | (1 << i);
      }
      return acc;
    }, 0);
  }

  return { ...tileToTileCoords(tile), colors, borders };
}

function getCoasts(tile: TileCore): string {
  if (tile.seaLevel === SeaLevel.none) {
    return "";
  }

  const coasts = tile.fullNeighbours
    .map((n) => (n && n.seaLevel === SeaLevel.none ? "1" : "0"))
    .join("");

  if (coasts === "00000000") {
    return "";
  }

  return coasts;
}

export function resourceToChannel(
  resource: ResourceDeposit,
): ResourceChanneled {
  return {
    id: resource.def.id,
    name: resource.def.name,
    quantity: resource.quantity,
  };
}

export function resourceWithTileToChannel(
  resource: ResourceDeposit,
): ResourceWithTileChanneled {
  return {
    id: resource.def.id,
    name: resource.def.name,
    quantity: resource.quantity,
    tile: tileToTileCoords(resource.tile),
  };
}

export function cityToChannel(city: CityCore): CityChanneled {
  return {
    id: city.id,
    visibilityLevel: city.getVisibilityFor(city.player.game.trackedPlayer),
    name: city.name,
    playerId: city.player.id,
    colors: city.player.nation.colors,
    tile: tileToTileCoords(city.tile),
    foodPerTurn: city.perTurn.food,

    size: city.population.total,
    totalFood: city.population.totalFood,
    foodToGrow: city.population.getFoodToGrow(),
    turnsToGrow: city.population.turnsToGrow,

    productionPerTurn: city.yields.production,
    totalProduction: city.production.totalProduction,
    productionRequired: city.production.product
      ? city.production.product.productionCost
      : null,
    turnsToProductionEnd: city.production.turnsToProductionEnd,
    productName: city.production.product ? city.production.product.name : null,
  };
}

export function cityDetailsToChannel(city: CityCore): CityDetailsChanneled {
  city.production.updateProductsList();

  return {
    id: city.id,
    visibilityLevel: city.getVisibilityFor(city.player.game.trackedPlayer),
    name: city.name,
    size: city.population.total,
    playerId: city.player.id,
    tile: tileToTileCoords(city.tile),
    perTurn: city.perTurn,
    tileYields: city.tileYields,
    yields: city.yields,
    colors: city.player.nation.colors,

    totalFood: city.population.totalFood,
    foodToGrow: city.population.getFoodToGrow(),
    turnsToGrow: city.population.turnsToGrow,
    foodConsumed: city.population.foodConsumed,

    totalProduction: city.production.totalProduction,
    turnsToProductionEnd: city.production.turnsToProductionEnd,
    buildings: city.production.buildings.map(buildingToChannel),
    availableProducts: [
      ...city.production.availableUnits,
      ...city.production.availableBuildings,
      ...city.production.availableIdleProducts,
    ].map((p) =>
      cityProductToChannel(city, p, city.production.disabledProducts),
    ),
    product: city.production.product
      ? cityProductToChannel(city, city.production.product)
      : null,

    cultureToExpand: city.expansion.getCultureToExpand(),
    tiles: Array.from(city.expansion.tiles).map(tileToTileCoords),
    totalCulture: city.expansion.totalCulture,
    turnsToExpand: city.expansion.turnsToExpand,

    workedTiles: Array.from(city.workers.workedTiles).map(
      tilesToTileCoordsWithNeighbours,
    ),
    storage: Array.from(city.storage.resources.entries()).map(
      ([resource, amount]) => ({
        resource: entityToMinimalChannel(resource),
        amount,
      }),
    ),
  };
}

export function playerToChannel(player: PlayerCore): PlayerChanneled {
  return {
    id: player.id,
    name: player.nation.name,
    colors: player.nation.colors,
    isAi: !!player.ai,
  };
}

export function trackedPlayerToChannel(
  player: PlayerCore,
): TrackedPlayerChanneled {
  return {
    id: player.id,
    colors: player.nation.colors,
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
    colors: unit.player.nation.colors,
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
    definition: unitDefToChannel(unit.definition),
    trait: unit.definition.trait,
    colors: unit.player.nation.colors,
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
      unit.checkActionRequirements(action),
    ),
  };
}

export function unitToUnitPathChannelled(
  unit: UnitCore,
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
  forPlayer: PlayerCore,
): TileDetailsChanneled {
  let units: UnitChanneled[] = [];
  if (forPlayer.visibleTiles.has(tile)) {
    units = tile.units.map((u) => unitToChannel(u));
  }
  return {
    ...tileToChannel(tile),
    zocPlayerId: tile.zocPlayer?.id ?? null,
    zocNoMansLand: tile.zocNoMansLand,
    isSupplied: tile.isSuppliedByPlayer(forPlayer),
    units,
    isExplored: forPlayer.exploredTiles.has(tile),
  };
}

export function tileToTileCoords(tile: TileCore): TileCoords {
  return { id: tile.id, x: tile.x, y: tile.y };
}

export enum FogOfWarStatus {
  unexplored = 0,
  explored = 1,
  visible = 2,
}

export type TileFogOfWar = TileCoords & {
  exploredBorder: number;
  visibleBorder: number;
  status: FogOfWarStatus;
};

export function tileToFogOfWar(tile: TileCore, game: Game): TileFogOfWar {
  let visibleBorder = 0;
  let exploredBorder = 0;

  let status = FogOfWarStatus.unexplored;
  if (game.trackedPlayer.visibleTiles.has(tile)) {
    status = FogOfWarStatus.visible;
    for (let i = 0; i < tile.fullNeighbours.length; i++) {
      const n = tile.fullNeighbours[i];
      if (n && !game.trackedPlayer.visibleTiles.has(n)) {
        visibleBorder += 1 << i;
      }
      if (n && !game.trackedPlayer.exploredTiles.has(n)) {
        exploredBorder += 1 << i;
      }
    }
  } else if (game.trackedPlayer.exploredTiles.has(tile)) {
    status = FogOfWarStatus.explored;
    for (let i = 0; i < tile.fullNeighbours.length; i++) {
      const n = tile.fullNeighbours[i];
      if (n && !game.trackedPlayer.exploredTiles.has(n)) {
        exploredBorder += 1 << i;
      }
    }
  }

  return {
    id: tile.id,
    x: tile.x,
    y: tile.y,
    visibleBorder,
    exploredBorder,
    status,
  };
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
  tile: TileCore,
): TilesCoordsWithNeighbours {
  return {
    ...tileToTileCoords(tile),
    fullNeighbours: tile.fullNeighbours.map((t) => t?.id ?? null),
  };
}

export function cityProductToChannel(
  city: CityCore,
  product: ProductDefinition,
  disabledProducts?: Set<ProductDefinition>,
): CityProductChanneled {
  return {
    enabled: disabledProducts ? !disabledProducts.has(product) : true,
    turnsToProduce: Math.ceil(product.productionCost / city.yields.production),
    definition: productToChannel(product),
  };
}

export type EntityMinimalChanneled = {
  id: string;
  name: string;
  entityType: EntityType;
};

export type TechDefChanneled = EntityMinimalChanneled & {
  entityType: "technology";
  cost: number;
  requiredTechs: string[];
  unlocks: EntityMinimalChanneled[];
  era: TechEra;
  layout: TechLayout;
};

export type TechKnowledgeChanneled = {
  def: TechDefChanneled;
  turns: number;
  state: KnowledgeTechState;
  queuePosition: number | null;
  accumulated: number;
  nextAccumulated: number;
};

export function entityToMinimalChannel(entity: Entity): EntityMinimalChanneled {
  return {
    id: entity.id,
    name: entity.name,
    entityType: entity.entityType,
  };
}

export function techToChannel(entity: Technology): TechDefChanneled {
  return {
    id: entity.id,
    entityType: entity.entityType,
    name: entity.name,
    cost: entity.cost,
    requiredTechs: entity.requiredTechnologies.map((t) => t.id),
    unlocks: entity.unlocks.map(entityToMinimalChannel),
    era: entity.era,
    layout: entity.layout,
  };
}

export function knowledgeTechToChannel(
  knowledge: Knowledge,
  tech: Technology,
): TechKnowledgeChanneled {
  const accumulated = knowledge.accumulated.get(tech) ?? 0;
  return {
    def: techToChannel(tech),
    turns: knowledge.getTurnsToResearch(tech),
    state: knowledge.getTechState(tech),
    queuePosition: knowledge.getTechQueuePosition(tech),
    accumulated,
    nextAccumulated: accumulated + knowledge.player.yields.income.knowledge,
  };
}

export type UnitDefChanneled = EntityMinimalChanneled & {
  entityType: "unit";
  cost: number;
  technology: EntityMinimalChanneled | null;
  actionPoints: number;
  strength: number;
  type: UnitType;
  trait: UnitTrait;
  capacity: number;
};

export function unitDefToChannel(entity: UnitDefinition): UnitDefChanneled {
  return {
    id: entity.id,
    entityType: entity.entityType,
    name: entity.name,
    cost: entity.productionCost,
    technology: entity.technology
      ? entityToMinimalChannel(entity.technology)
      : null,
    type: entity.type,
    trait: entity.trait,
    actionPoints: entity.actionPoints,
    strength: entity.strength,
    capacity: entity.capacity,
  };
}

export type BuildingChanneled = EntityMinimalChanneled & {
  entityType: "building" | "idleProduct";
  cost: number;
  technology: EntityMinimalChanneled | null;
  bonuses: Bonuses;
};

export type TileImprovementChanneled = EntityMinimalChanneled & {
  entityType: "tileImprovement";
  technology: EntityMinimalChanneled | null;
};

export function buildingToChannel(
  entity: Building | IdleProduct,
): BuildingChanneled {
  return {
    id: entity.id,
    entityType: entity.entityType,
    name: entity.name,
    cost: entity.productionCost,
    technology: entity.technology
      ? entityToMinimalChannel(entity.technology)
      : null,
    bonuses: entity.bonuses,
  };
}

export function tileImprovementToChannel(
  entity: TileImprovementDefinition,
): TileImprovementChanneled {
  return {
    id: entity.id,
    entityType: entity.entityType,
    name: entity.name,
    technology: entity.technology
      ? entityToMinimalChannel(entity.technology)
      : null,
  };
}

export function productToChannel(entity: Entity): ProductChanneled {
  if (entity.entityType === "unit") {
    return unitDefToChannel(entity as UnitDefinition);
  }

  if (entity.entityType === "building") {
    return buildingToChannel(entity as Building);
  }

  if (entity.entityType === "idleProduct") {
    return buildingToChannel(entity as IdleProduct);
  }

  throw new Error(`Unknown entity type ${entity.entityType}`);
}

export function entityToChannel(entity: Entity): EntityChanneled {
  if (entity.entityType === "technology") {
    return techToChannel(entity as Technology);
  }

  if (entity.entityType === "tileImprovement") {
    return tileImprovementToChannel(entity as TileImprovementDefinition);
  }

  return productToChannel(entity);
}

export type ProductChanneled = BuildingChanneled | UnitDefChanneled;

export type EntityChanneled =
  | TechDefChanneled
  | ProductChanneled
  | TileImprovementChanneled;
