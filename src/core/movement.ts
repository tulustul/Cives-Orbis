import { collector } from "./collector";
import { attack } from "./combat";
import { TileCore } from "./tile";
import { UnitGroup } from "./unitGroup";
import { zocAddUnit, zocForgetUnit } from "./zoc";

export enum MoveResult {
  none,
  move,
  embark,
  disembark,
  attack,
}

export function getMoveResult(
  unit: UnitGroup,
  from: TileCore,
  to: TileCore,
): MoveResult {
  if (!unit.player.exploredTiles.has(to)) {
    return MoveResult.move;
  }

  if (unit.isNaval) {
    // if (
    //   to.passableArea &&
    //   from.passableArea !== to.passableArea &&
    //   !unit.isLand
    // ) {
    //   if (to.isLand && to.city?.tile.coast) {
    //     if (unit.isMilitary || to.city?.player !== unit.player) {
    //       return MoveResult.attack;
    //     } else if (to.city?.player === unit.player) {
    //       return MoveResult.move;
    //     } else {
    //       return MoveResult.none;
    //     }
    //   }
    //   if (to.isWater && from.city) {
    //     return MoveResult.move;
    //   }
    //   return MoveResult.none;
    // }
    if (to.isLand && !unit.isLand) {
      return MoveResult.none;
    }
  }

  if (unit.isLand) {
    // TODO
    // if (to.isWater && to.getEmbarkmentTarget(unit)) {
    //   return MoveResult.embark;
    // }
    if (unit.hasChildren && from.isWater && to.isLand) {
      return MoveResult.disembark;
    }
    if (
      !to.passableArea ||
      (from.passableArea !== to.passableArea && !unit.isNaval)
    ) {
      return MoveResult.none;
    }
  }

  if (unit.player.visibleTiles.has(to)) {
    const enemyUnit = to.getEnemyUnit(unit);
    const enemyCity = to.city && to.city.player !== unit.player;
    if (enemyUnit || enemyCity) {
      if (unit.isMilitary) {
        return MoveResult.attack;
      } else {
        return MoveResult.none;
      }
    }
  }

  return MoveResult.move;
}

export function getMoveCost(
  unit: UnitGroup,
  moveResult: MoveResult,
  from: TileCore,
  to: TileCore,
): number {
  const cost = from.neighboursCosts.get(to) ?? Infinity;

  if (moveResult === MoveResult.move) {
    return cost;
  }

  if (moveResult === MoveResult.attack) {
    return cost * 3;
  }

  if (moveResult === MoveResult.embark || moveResult === MoveResult.disembark) {
    return Math.max(1, unit.actionPointsLeft);
  }

  return Infinity;
}

export function move(unit: UnitGroup, tile: TileCore) {
  if (!unit.actionPointsLeft) {
    return;
  }

  const moveResult = getMoveResult(unit, unit.tile, tile);
  const cost = getMoveCost(unit, moveResult, unit.tile, tile);

  if (moveResult === MoveResult.none) {
    return;
  }

  if (moveResult === MoveResult.embark) {
    // TODO
    // const embarkmentTarget = tile.getEmbarkmentTarget(unit);
    // if (embarkmentTarget) {
    //   embarkmentTarget.addChild(unit);
    // }
    // _move(unit, tile, cost);
  } else if (moveResult === MoveResult.disembark) {
    // TODO
    // unit.parent?.removeChild(unit);
    // _move(unit, tile, cost);
  } else if (moveResult === MoveResult.attack) {
    if (attack(unit, tile)) {
      _move(unit, tile, cost);
    }
  } else if (moveResult === MoveResult.move) {
    _move(unit, tile, cost);
  }
}

function _move(unit: UnitGroup, tile: TileCore, cost: number) {
  zocForgetUnit(unit);
  // unit.suppliesProducer?.forget();

  const index = unit.tile.units.indexOf(unit);
  if (index !== -1) {
    unit.tile.units.splice(index, 1);
  }
  tile.units.push(unit);
  unit.tile = tile;

  unit.actionPointsLeft = Math.max(unit.actionPointsLeft - cost, 0);

  const visibleTiles = unit.getVisibleTiles();
  unit.player.exploreTiles(visibleTiles);
  unit.player.showTiles(visibleTiles);

  zocAddUnit(unit);
  // if (unit.suppliesProducer) {
  //   unit.suppliesProducer.tile = tile;
  //   unit.suppliesProducer.add();
  // }
  // unit.suppliesBlocker?.update(tile);
}

export function moveAlongPath(unit: UnitGroup) {
  if (!unit.path || !unit.isAlive) {
    unit.setOrder(null);
    return;
  }

  unit.setOrder(unit.path.length ? "go" : null);

  const tiles: TileCore[] = [unit.tile];

  if (unit.actionPointsLeft && unit.path.length) {
    collector.addMove(unit, tiles);
  }

  while (unit.actionPointsLeft && unit.path.length) {
    const targetTile = unit.path[0][0];
    if (targetTile !== unit.tile) {
      const moveResult = getMoveResult(unit, unit.tile, targetTile);
      if (moveResult === MoveResult.none) {
        unit.path = null;
        unit.setOrder(null);
        return;
      }
      move(unit, targetTile);
      if (unit.tile.id === targetTile.id) {
        tiles.push(targetTile);
      }
    }

    if (unit.actionPointsLeft) {
      unit.path[0].shift();
      if (!unit.path[0].length) {
        unit.path.shift();
      }
    }
    if (!unit.path.length) {
      unit.path = null;
      unit.setOrder(null);
      return;
    }
  }
}
