import {
  ResourceDefinition,
  ResourceDistribution,
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

  const requiredImpr = tile.resource?.def.depositDef?.requiredImprovement;
  if (requiredImpr) {
    return requiredImpr.id === impr.id;
  }

  if (impr.requireResource) {
    return false;
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

export function getResourceDistribution(
  tile: TileCore,
  resourceDef: ResourceDefinition | null,
): ResourceDistribution | null {
  if (!resourceDef) {
    return null;
  }

  for (const d of resourceDef.distribution) {
    if (
      (d.seaLevel === undefined || d.seaLevel === tile.seaLevel) &&
      (d.landForm === undefined || d.landForm === tile.landForm) &&
      (d.climate === undefined || d.climate === tile.climate) &&
      (d.forest === undefined || d.forest === tile.forest) &&
      (d.river === undefined || d.river === tile.riverParts.length > 0) &&
      (d.coast === undefined || d.coast === tile.coast) &&
      (d.wetlands === undefined || d.wetlands === tile.wetlands)
    ) {
      return d;
    }
  }

  return null;
}
