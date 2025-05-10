import {
  ResourceDefinition,
  TileImprovementDefinition,
} from "@/core/data/types";
import { PlayerCore } from "@/core/player";
import { TileCore } from "@/core/tile";
import { Climate, LandForm, SeaLevel } from "@/shared";

const FORESTABLE_CLIMATES = new Set<Climate>([
  Climate.temperate,
  Climate.tropical,
  Climate.tundra,
]);

const WETLANDS_CLIMATES = new Set<Climate>([
  Climate.temperate,
  Climate.tropical,
]);

export function isForestable(tile: TileCore): boolean {
  return (
    tile.seaLevel === SeaLevel.none &&
    tile.landForm !== LandForm.mountains &&
    FORESTABLE_CLIMATES.has(tile.climate)
  );
}

export function areWetlandsPossible(tile: TileCore): boolean {
  return !!(
    tile.seaLevel === SeaLevel.none &&
    tile.landForm === LandForm.plains &&
    tile.riverParts.length &&
    WETLANDS_CLIMATES.has(tile.climate)
  );
}

export function isImprovementPossible(
  player: PlayerCore,
  tile: TileCore,
  impr: TileImprovementDefinition | null,
): boolean {
  if (tile.city) {
    return false;
  }

  if (impr === null) {
    return true;
  }

  if (tile.improvement?.id === impr.id) {
    return false;
  }

  if (tile.areaOf && tile.areaOf?.player !== player) {
    return false;
  }

  if (!player.knowledge.discoveredEntities.tileImprovement.has(impr)) {
    return false;
  }

  if (impr.requireResource) {
    return tile.resource?.def.depositDef?.requiredImprovement.id === impr.id;
  }

  return (
    (!impr.climates || impr.climates.includes(tile.climate)) &&
    (!impr.landForms || impr.landForms.includes(tile.landForm)) &&
    (impr.river === undefined || impr.river === tile.riverParts.length > 0) &&
    (impr.forest === undefined || impr.forest === tile.forest)
  );
}

export function isRoadPossible(tile: TileCore) {
  return (
    tile.seaLevel === SeaLevel.none && tile.landForm !== LandForm.mountains
  );
}

export function isResourcePossible(
  tile: TileCore,
  resourceDef: ResourceDefinition | null,
) {
  if (!resourceDef || tile.landForm === LandForm.mountains) {
    return false;
  }

  const dis = resourceDef.depositDef?.distribution;
  if (!dis) {
    return false;
  }

  if (dis.seaLevels !== undefined && !dis.seaLevels.includes(tile.seaLevel)) {
    return false;
  }

  if (dis.landForms !== undefined && !dis.landForms.includes(tile.landForm)) {
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
