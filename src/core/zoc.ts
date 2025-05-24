// Zone of control

import { TileCore } from "./tile";
import { UnitCore } from "./unit";

export function zocForgetUnit(unit: UnitCore) {
  for (const tile of unit.zoc) {
    tile.zocUnits.delete(unit);
    if (tile.zocUnits.size === 0) {
      tile.zocPlayer = null;
    } else if (tile.zocNoMansLand) {
      updateNoMansLand(tile);
    }
    if (!tile.zocNoMansLand && tile.zocUnits.size) {
      tile.zocPlayer = Array.from(tile.zocUnits)[0].player;
    }
  }
  unit.zoc = [];
}

export function zocAddUnit(unit: UnitCore) {
  if (!unit.isMilitary || unit.parent) {
    return;
  }

  unit.tile.zocPlayer = unit.player;
  unit.tile.zocUnits.add(unit);
  unit.zoc.push(unit.tile);

  for (let dir = 0; dir < unit.tile.fullNeighbours.length; dir++) {
    const tile = unit.tile.fullNeighbours[dir];
    if (!tile) {
      continue;
    }
    if (unit.tile.passableArea !== tile.passableArea || tile.city) {
      continue;
    }
    if (unit.tile.riverParts.includes(dir)) {
      continue;
    }
    tile.zocUnits.add(unit);
    if (!tile.getBestEnemyMilitaryUnit(unit)) {
      tile.zocPlayer = unit.player;
      unit.zoc.push(tile);
      updateNoMansLand(tile);
    }
  }
}

function updateNoMansLand(tile: TileCore) {
  tile.zocNoMansLand = false;
  if (tile.zocUnits.size > 1) {
    const players = new Set(Array.from(tile.zocUnits).map((u) => u.player));
    if (players.size > 1) {
      tile.zocPlayer = null;
      tile.zocNoMansLand = true;
    }
  }
}
