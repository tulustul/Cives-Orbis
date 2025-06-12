import {
  PlayerChanneled,
  TileFogOfWar,
  TilesCoordsWithNeighbours,
} from "./channel";
import {
  EntityType,
  PlayerViewBoundingBox,
  ProductType,
  StatsData,
  TileRoad,
  UnitAction,
  UnitOrder,
} from "./data";
import { Climate, LandForm, SeaLevel, TileDirection } from "./tile";

export type MapGeneratorOptions = {
  width: number;
  height: number;
  uniformity: number;
  seaLevel: number;
  humanPlayersCount: number;
  aiPlayersCount: number;
  resources?: number;
  seed?: string;
};

export type GameGetEntityOptions = {
  entityType: EntityType;
};

export type UnitSpawnOptions = {
  tileId: number;
  playerId: number;
  definitionId: string;
};

export type UnitDoActionOptions = {
  unitId: number;
  action: UnitAction;
};

export type UnitSetOrderOptions = {
  unitId: number;
  order: UnitOrder | null;
};

export type UnitFindPathOptions = {
  unitId: number;
  destinationId: number;
};

export type UnitGetFailedActionRequirementsOptions = {
  unitId: number;
  action: UnitAction;
};

export type UnitSimulateCombatOptions = {
  attackerId: number;
  defenderId: number;
};

export type TilesFogOfWarChanneled = {
  tiles: TileFogOfWar[];
  viewBoundingBox: PlayerViewBoundingBox;
};

export type TileGetHoverDetailsOptions = {
  tileId: number;
  selectedUnitId: number | null;
};

export type TileGetInRangeOptions = {
  tileId: number;
  range: number;
};

export type TileUpdateOptions = {
  id: number;
  improvement?: string;
  climate?: Climate;
  landForm?: LandForm;
  seaLevel?: SeaLevel;
  riverParts?: TileDirection[];
  forest?: boolean;
  wetlands?: boolean;
  road?: TileRoad | null;
};

export type ResourceSpawnOptions = {
  tileId: number;
  resourceId: string | null;
  quantity: number;
};

export type FogOfWarFilter = {
  fogOfWarEnabled: boolean;
};

export type CityProduceOptions = {
  cityId: number;
  productId: string;
  entityType: ProductType;
  tileId?: number;
};

export type CityRange = {
  tiles: TilesCoordsWithNeighbours[];
  workedTiles: TilesCoordsWithNeighbours[];
  blockedTiles: TilesCoordsWithNeighbours[];
};

export type CityGetWorkTilesResult = {
  workedTiles: TilesCoordsWithNeighbours[];
  blockedTiles: TilesCoordsWithNeighbours[];
  notWorkedTiles: TilesCoordsWithNeighbours[];
};

export type CityWorkTileOptions = {
  cityId: number;
  tileId: number;
};

export type EntityGetFailedWeakRequirements = {
  entityId: string;
  cityId: number | null;
};

export type StatsGetOptions = {
  type: keyof StatsData;
};

export type StatsGetChanneled = {
  player: PlayerChanneled;
  data: number[];
};

export type GrantOrRevoke = "grant" | "revoke";

export type GrantRevokeTechOptions = {
  playerId: number;
  techId: string;
  grantRevoke: GrantOrRevoke;
};

export type PlayerEditorGiveGoldOptions = {
  playerId: number;
  amount: number;
};

export type CityGetDistrictAvailableTilesOptions = {
  cityId: number;
  districtId: string;
};
