import { collector } from "./collector";
import { dataManager } from "./data/dataManager";
import { Game } from "./game";
import { PlayerCore } from "./player";
import { TileCore } from "./tile";
import { UnitCore } from "./unit";

export class UnitsManager {
  units: UnitCore[] = [];

  unitsMap = new Map<number, UnitCore>();

  private lastId = 0;

  constructor(private game: Game) {}

  spawn(id: string, tile: TileCore, player: PlayerCore) {
    const definition = dataManager.units.get(id);

    let group = tile.units.find((u) => u.player === player);
    if (!group) {
      group = this.game.unitGroupsManager.spawn(tile, player);
    }

    const unit = new UnitCore(tile, definition, player, this, group);
    unit.id = this.lastId++;

    this.units.push(unit);
    this.unitsMap.set(unit.id, unit);
    player.units.push(unit);

    collector.unitGroups.add(group);

    return unit;
  }

  destroy(unit: UnitCore) {
    this.unitsMap.delete(unit.id);

    let index = this.units.indexOf(unit);
    if (index !== -1) {
      this.units.splice(index, 1);
    }

    index = unit.player.units.indexOf(unit);
    if (index !== -1) {
      unit.player.units.splice(index, 1);
    }

    unit.player.yields.costs.gold -= unit.wage;
  }

  nextTurn() {
    for (const unit of this.units) {
      if (!unit.hasWage) {
        unit.changeCount(-10);
        if (unit.count <= 0) {
          this.destroy(unit);
        } else {
          collector.unitGroups.add(unit.group);
        }
      }
    }
  }
}
