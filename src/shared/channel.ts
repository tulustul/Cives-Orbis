import { CombatSimulationChanneled } from "./combat";
import {
  CityVisibility,
  EntityType,
  KnowledgeTechState,
  NationColors,
  PlayerYields,
  TechEra,
  TechLayout,
  TileRoad,
  UnitAction,
  UnitOrder,
  Yields,
} from "./data";
import { CityEffect } from "./effects";
import { Climate, LandForm, SeaLevel, TileDirection } from "./tile";

export enum FogOfWarStatus {
  unexplored = 0,
  explored = 1,
  visible = 2,
}

export type GameChanneled = {
  turn: number;
  map: MapChanneled;
  players: PlayerChanneled[];
  trackedPlayer: TrackedPlayerChanneled;
  units: UnitChanneled[];
  cities: CityChanneled[];
};

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

export type MapChanneled = {
  width: number;
  height: number;
  tiles: TileChanneled[][];
};

export type CityRenderType = "normal" | "walled";

export type TileChanneled = {
  id: number;

  x: number;
  y: number;

  climate: Climate;
  landForm: LandForm;
  seaLevel: SeaLevel;
  riverParts: TileDirection[];
  forest: boolean;
  wetlands: boolean;
  improvement: string | null;
  road: TileRoad | null;

  yields: Yields;
  areaOf: number | null;
  cityId: number | null;
  district: string | null;
  districtDirection: TileDirection;
  cityType: CityRenderType | null;
  unitsIds: number[];
  resource: ResourceChanneled | null;
  roads: string;
  coasts: string;
  playerColor: NationColors | null;
  fullNeighbours: (number | null)[];
  landFormNeighbours: number;
  river: number;
  forestData: number;
  roadData: number;
};

export type TileOwnershipChanneled = TileCoords & {
  colors: NationColors | null;
  borders: number;
};

export type TileDetailsChanneled = Omit<TileChanneled, "unitsIds"> & {
  units: UnitChanneled[];
  zocPlayerId: number | null;
  zocNoMansLand: boolean;
  isSupplied: boolean;
  isExplored: boolean;
  passableArea: number | null;
};

export type TileHoverDetails = {
  tile: TileDetailsChanneled;
  combatSimulation: CombatSimulationChanneled | null;
};

export type UnitDefChanneled = EntityMinimalChanneled & {
  entityType: "unit";
  cost: number;
  technology: EntityMinimalChanneled | null;
  actionPoints: number;
  strength: number;
  capacity: number;
};

export type BuildingChanneled = EntityMinimalChanneled & {
  entityType: "building" | "idleProduct" | "district";
  cost: number;
  technology: EntityMinimalChanneled | null;
  effects: CityEffect[];
};

export type DistrictChanneled = EntityMinimalChanneled & {
  entityType: "district";
  cost: number;
  technology: EntityMinimalChanneled | null;
  effects: CityEffect[];
};

export type TileImprovementChanneled = EntityMinimalChanneled & {
  entityType: "tileImprovement";
  technology: EntityMinimalChanneled | null;
};

export type CityDefenseChanneled = {
  maxHealth: number;
  currentHealth: number;
  strength: number;
  defenseBonus: number;
};

export type CityChanneled = {
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

  defense: CityDefenseChanneled;
};

export type CityStorage = {
  resource: EntityMinimalChanneled;
  amount: number;
  limit: number;
  yield: number;
};

export type CityDetailsChanneled = {
  id: number;
  visibilityLevel: CityVisibility;
  name: string;
  size: number;
  tile: TileCoords;
  playerId: number;
  colors: NationColors;

  totalFood: number;
  foodToGrow: number;
  turnsToChangeSize: number;

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
  defense: CityDefenseChanneled;
};

export type CityProductChanneled = {
  enabled: boolean;
  turnsToProduce: number;
  definition: ProductChanneled;
};

export type PlayerChanneled = {
  id: number;
  name: string;
  colors: NationColors;
  isAi: boolean;
};

export type TrackedPlayerChanneled = {
  id: number;
  colors: NationColors;
  exploredTiles: TileCoords[];
  visibleTiles: TileCoords[];
  units: number[];
  cities: number[];

  yields: PlayerYields;
  isAi: boolean;
};

export type UnitChanneled = {
  id: number;
  name: string;
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
};

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

export type UnitMoveChanneled = {
  unitId: number;
  tiles: TileCoordsWithUnits[];
};

export type ResourceChanneled = {
  id: string;
  name: string;
  quantity: number;
};

export type ResourceDefinitionChannel = EntityMinimalChanneled & {
  entityType: "resource";
};

export type ResourceWithTileChanneled = ResourceChanneled & {
  tile: TileCoords;
};

export type TileCoords = {
  id: number;
  x: number;
  y: number;
};

export type ProductChanneled = BuildingChanneled | UnitDefChanneled;

export type EntityChanneled =
  | TechDefChanneled
  | ProductChanneled
  | TileImprovementChanneled
  | ResourceDefinitionChannel;

export type TileFogOfWar = TileCoords & {
  exploredBorder: number;
  visibleBorder: number;
  status: FogOfWarStatus;
};

export type CityOverviewChanneled = {
  id: number;
  name: string;
  population: number;
  yields: Yields;
};

export type PlayerEconomyChanneled = {
  cities: CityOverviewChanneled[];
};

export type UnitIdAndName = {
  id: number;
  name: string;
};
