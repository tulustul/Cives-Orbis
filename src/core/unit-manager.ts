import { collector } from "./collector";
import { getUnitById } from "./data-manager";
import { moveAlongPath } from "./movement";
import { PlayerCore } from "./player";
import { TileCore } from "./tile";
import { UnitCore } from "./unit";
import { zocAddUnit, zocForgetUnit } from "./zoc";

export class UnitsManager {
  units: UnitCore[] = [];

  unitsMap = new Map<number, UnitCore>();

  private lastId = 0;

  spawn(id: string, tile: TileCore, player: PlayerCore) {
    const definition = getUnitById(id);

    const unit = new UnitCore(tile, definition, player, this);
    unit.id = this.lastId++;

    this.units.push(unit);
    this.unitsMap.set(unit.id, unit);
    player.units.push(unit);
    tile.units.push(unit);

    unit.player.exploreTiles(unit.tile.getTilesInRange(2));
    unit.player.showTiles(unit.tile.getTilesInRange(2));

    unit.player.unitsWithoutOrders.push(unit);

    collector.units.add(unit);

    zocAddUnit(unit);

    // if (unit.definition.trait === UnitTrait.military) {
    //   unit.suppliesBlocker = new SuppliesBlocker(tile, player);
    // }

    // if (unit.definition.trait === UnitTrait.supply) {
    //   unit.suppliesProducer = new SuppliesProducer(
    //     tile,
    //     player,
    //     unit.definition.supplyRange,
    //   );
    // }

    return unit;
  }

  destroy(unit: UnitCore) {
    // TODO rewrite to sets for better performance?
    this.unitsMap.delete(unit.id);

    let index = this.units.indexOf(unit);
    if (index !== -1) {
      this.units.splice(index, 1);
    }

    index = unit.player.units.indexOf(unit);
    if (index !== -1) {
      unit.player.units.splice(index, 1);
    }

    index = unit.tile.units.indexOf(unit);
    if (index !== -1) {
      unit.tile.units.splice(index, 1);
    }

    zocForgetUnit(unit);

    unit.suppliesBlocker?.update(unit.suppliesBlocker.tile);
    unit.suppliesProducer?.forget();

    unit.player.updateUnitsWithoutOrders();
    collector.unitsDestroyed.add(unit.id);
  }

  nextTurn() {
    for (const unit of this.units) {
      // Heal unit if on friendly territory
      if (
        unit.health < 100 &&
        unit.tile.areaOf?.player === unit.player
        // unit.supplies >= 100
      ) {
        unit.health = Math.min(100, unit.health + 10);
        collector.units.add(unit);
      }

      if (unit.path) {
        moveAlongPath(unit);
      }
      if (unit.order === "skip") {
        unit.setOrder(null);
      }

      if (unit.actionPointsLeft < unit.definition.actionPoints) {
        unit.actionPointsLeft = unit.definition.actionPoints;
        if (unit.isPlayerTracked) {
          collector.units.add(unit);
        }
      }

      //   if (unit.isSupplied) {
      //     if (unit.supplies < 100) {
      //       unit.supplies = 100;
      //       collector.units.add(unit);
      //     }
      //   } else {
      //     unit.supplies = Math.max(0, unit.supplies - 20);
      //     if (!unit.supplies) {
      //       // unit.health -= 10; // TODO disabled until fully implemented
      //       if (unit.health <= 0) {
      //         this.destroy(unit);
      //       }
      //     }
      //     collector.units.add(unit);
      //   }
    }
  }
}
