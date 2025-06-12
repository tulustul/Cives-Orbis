// Zone of control

import { PlayerCore } from "./player";
import { TileCore } from "./tile";
import { UnitCore } from "./unit";

export function zocForgetUnit(unit: UnitCore) {
  for (const tile of unit.zoc) {
    tile.zocUnits.delete(unit);
    updateZocPlayer(tile);
  }
  unit.zoc = [];
}

export function zocAddUnit(unit: UnitCore) {
  if (!unit.isMilitary || unit.parent) {
    return;
  }

  unit.tile.zocUnits.add(unit);
  unit.zoc.push(unit.tile);
  updateZocPlayer(unit.tile, unit.player);

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
    unit.zoc.push(tile);
    updateZocPlayer(tile);
  }
}

function updateZocPlayer(tile: TileCore, player?: PlayerCore) {
  const oldPlayer = tile.zocPlayer;

  _updateZocPlayer(tile, player);

  if (
    tile.areaOf &&
    ((tile.zocPlayer && tile.zocPlayer.isEnemyWith(tile.areaOf.player)) ||
      (!tile.zocPlayer &&
        oldPlayer &&
        oldPlayer.isEnemyWith(tile.areaOf.player)))
  ) {
    tile.areaOf?.update();
  }
}

function _updateZocPlayer(tile: TileCore, player?: PlayerCore) {
  if (player) {
    tile.zocPlayer = player;
    return;
  }

  if (tile.zocUnits.size === 0) {
    tile.zocPlayer = null;
    return;
  }

  for (const unit of tile.zocUnits) {
    if (!player) {
      player = unit.player;
    } else if (unit.player !== player) {
      tile.zocPlayer = null;
      break;
    }
  }

  tile.zocPlayer = player ?? null;
}
