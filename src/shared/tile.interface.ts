import { TileImprovement, TileRoad } from "../core/tile-improvements";
import { Yields } from "../core/yields";
import { ResourceDefinition } from "../core/data.interface";

export enum TileDirection {
  NW,
  NE,
  E,
  SE,
  SW,
  W,
  NONE,
}

export enum Climate {
  tropical,
  savanna,
  desert,
  temperate,
  tundra,
  arctic,
}

export enum LandForm {
  plains,
  hills,
  mountains,
}

export enum SeaLevel {
  none,
  shallow,
  deep,
}

export interface BaseTile {
  id: number;

  x: number;
  y: number;

  climate: Climate;
  landForm: LandForm;
  seaLevel: SeaLevel;
  riverParts: TileDirection[];
  forest: boolean;
  wetlands: boolean;
  improvement: TileImprovement | null;
  road: TileRoad | null;

  yields: Yields;
}

export const FORESTABLE_CLIMATES = new Set<Climate>([
  Climate.temperate,
  Climate.tropical,
  Climate.tundra,
]);

export const WETLANDS_CLIMATES = new Set<Climate>([
  Climate.temperate,
  Climate.tropical,
]);

export function isForestable(tile: BaseTile): boolean {
  return (
    tile.seaLevel === SeaLevel.none &&
    tile.landForm === LandForm.plains &&
    FORESTABLE_CLIMATES.has(tile.climate)
  );
}

export function areWetlandsPossible(tile: BaseTile): boolean {
  return !!(
    tile.seaLevel === SeaLevel.none &&
    tile.landForm === LandForm.plains &&
    tile.riverParts.length &&
    WETLANDS_CLIMATES.has(tile.climate)
  );
}

export function isImprovementPossible(
  tile: BaseTile,
  improvement: TileImprovement | null,
): boolean {
  if (improvement === null) {
    return true;
  } else if (improvement === TileImprovement.farm) {
    return (
      tile.seaLevel === SeaLevel.none &&
      tile.landForm === LandForm.plains &&
      tile.climate !== Climate.arctic &&
      !tile.forest &&
      !tile.wetlands
    );
  } else if (improvement === TileImprovement.mine) {
    return tile.landForm === LandForm.hills;
  } else if (improvement === TileImprovement.sawmill) {
    return tile.forest && !tile.wetlands;
  } else {
    return false;
  }
}

export function isRoadPossible(tile: BaseTile) {
  return (
    tile.seaLevel === SeaLevel.none && tile.landForm !== LandForm.mountains
  );
}

export function isResourcePossible(
  tile: BaseTile,
  resourceDef: ResourceDefinition | null,
) {
  if (!resourceDef) {
    return true;
  }

  const dis = resourceDef.depositDef?.distribution;
  if (!dis) {
    return false;
  }

  if (dis.seaLevel !== undefined && dis.seaLevel !== tile.seaLevel) {
    return false;
  }

  if (dis.climates !== undefined && !dis.climates.includes(tile.climate)) {
    return false;
  }

  if (dis.forest !== undefined && dis.forest !== tile.forest) {
    return false;
  }

  return true;
}
