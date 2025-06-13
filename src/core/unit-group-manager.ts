import { collector } from "./collector";
import { moveAlongPath } from "./movement";
import { PlayerCore } from "./player";
import { TileCore } from "./tile";
import { UnitGroup } from "./unitGroup";
import { zocAddUnit, zocForgetUnit } from "./zoc";

export class UnitGroupsManager {
  groups: UnitGroup[] = [];

  groupsMap = new Map<number, UnitGroup>();

  private lastId = 0;

  spawn(tile: TileCore, player: PlayerCore) {
    const group = new UnitGroup(tile, player, this);
    group.id = this.lastId++;

    this.groups.push(group);
    this.groupsMap.set(group.id, group);
    player.unitGroups.push(group);
    tile.units.push(group);

    player.exploreTiles(group.tile.getTilesInRange(2));
    player.showTiles(group.tile.getTilesInRange(2));

    group.player.unitGroupsWithoutOrders.push(group);

    collector.unitGroups.add(group);

    zocAddUnit(group);

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

    return group;
  }

  destroy(group: UnitGroup) {
    this.groupsMap.delete(group.id);

    let index = this.groups.indexOf(group);
    if (index !== -1) {
      this.groups.splice(index, 1);
    }

    index = group.player.unitGroups.indexOf(group);
    if (index !== -1) {
      group.player.unitGroups.splice(index, 1);
    }

    index = group.tile.units.indexOf(group);
    if (index !== -1) {
      group.tile.units.splice(index, 1);
    }

    zocForgetUnit(group);

    // group.suppliesBlocker?.update(group.suppliesBlocker.tile);
    // group.suppliesProducer?.forget();

    group.player.updateUnitsWithoutOrders();

    collector.unitsGroupsDestroyed.add(group.id);
  }

  nextTurn() {
    for (const group of this.groups) {
      if (group.path) {
        moveAlongPath(group);
      }
      if (group.order === "skip") {
        group.setOrder(null);
      }

      if (group.actionPointsLeft < group.actionPointsMax) {
        group.actionPointsLeft = group.actionPointsMax;
        if (group.isPlayerTracked) {
          collector.unitGroups.add(group);
        }
      }

      //   if (unit.isSupplied) {
      //     if (unit.supplies < 100) {
      //       unit.supplies = 100;
      //       collector.groups.add(unit);
      //     }
      //   } else {
      //     unit.supplies = Math.max(0, unit.supplies - 20);
      //     if (!unit.supplies) {
      //       // unit.health -= 10; // TODO disabled until fully implemented
      //       if (unit.health <= 0) {
      //         this.destroy(unit);
      //       }
      //     }
      //     collector.groups.add(unit);
      //   }
    }
  }
}
