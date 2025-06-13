import { UnitAction, UnitOrder, UnitTrait } from "@/shared";
import { collector } from "./collector";
import { UnitDefinition } from "./data/types";
import { getMoveCost, getMoveResult, MoveResult } from "./movement";
import { PlayerCore } from "./player";
import { TileCore } from "./tile";
import { UnitCore } from "./unit";
import { UnitGroupsManager } from "./unit-group-manager";

export class UnitGroup {
  id!: number;
  actionPointsMax = 0;
  actionPointsLeft = 0;
  path: TileCore[][] | null = null;
  units: UnitCore[] = [];
  zoc: TileCore[] = [];
  order: UnitOrder | null = null;

  isNaval = false;
  isLand = false;

  isMilitary = false;
  isExplorer = false;
  isWorker = false;
  isTransport = false;
  isSettler = false;

  traits = new Set<UnitTrait>();

  hasChildren = false;

  isAlive = true;

  totalCount = 0;
  totalStrength = 0;

  constructor(
    public tile: TileCore,
    public player: PlayerCore,
    private unitsGroupManager: UnitGroupsManager,
  ) {}

  getRange(): Set<TileCore> {
    const result = new Set<TileCore>([this.tile]);
    const actionPointsLeftAtTile = new Map<TileCore, number>();

    this._getRange(
      this.tile,
      this.actionPointsLeft,
      result,
      actionPointsLeftAtTile,
    );

    if (result.size === 1) {
      result.delete(this.tile);
    }

    return result;
  }

  private _getRange(
    tile = this.tile,
    actionPointsLeft = this.actionPointsLeft,
    result: Set<TileCore>,
    actionPointsLeftAtTile: Map<TileCore, number>,
  ) {
    if (actionPointsLeft <= 0) {
      return result;
    }

    for (const neighbour of tile.neighbours) {
      const moveResult = getMoveResult(this, tile, neighbour);
      const cost = getMoveCost(this, moveResult, tile, neighbour);

      if (moveResult === MoveResult.none) {
        continue;
      }

      const oldActionPointsLeft = actionPointsLeftAtTile.get(neighbour);
      const newActionPointsLeft = actionPointsLeft - cost;

      if (!oldActionPointsLeft || newActionPointsLeft > oldActionPointsLeft) {
        actionPointsLeftAtTile.set(neighbour, newActionPointsLeft);

        result.add(neighbour);

        if (moveResult !== MoveResult.attack) {
          this._getRange(
            neighbour,
            newActionPointsLeft,
            result,
            actionPointsLeftAtTile,
          );
        }
      }
    }

    return result;
  }

  destroy() {
    this.actionPointsLeft = 0;
    this.unitsGroupManager.destroy(this);
  }

  getVisibleTiles(): Set<TileCore> {
    return this.tile.getTilesInRange(2);
  }

  setOrder(order: UnitOrder | null) {
    this.order = order;
    this.player.updateUnitsWithoutOrders();
    if (order !== "go") {
      this.path = null;
    }
    if (this.isPlayerTracked) {
      collector.unitGroups.add(this);
    }
  }

  changeCount(count: number) {
    this.totalCount += count;
  }

  get isPlayerTracked() {
    return this.player.game.trackedPlayer === this.player;
  }

  doAction(action: UnitAction) {}

  merge(...groups: UnitGroup[]) {
    for (const otherGroup of groups) {
      for (const unit of otherGroup.units) {
        this._addUnit(unit);
      }
      this.unitsGroupManager.destroy(otherGroup);
    }
  }

  addUnit(unit: UnitCore) {
    this._addUnit(unit);
    collector.unitGroups.add(this);
  }

  private _addUnit(unit: UnitCore) {
    const existingUnit = this.units.find(
      (u) => u.definition === unit.definition,
    );
    if (existingUnit) {
      existingUnit.count += unit.count;
    } else {
      unit.group = this;
      this.units.push(unit);
    }
    this.actionPointsLeft = Math.min(
      this.actionPointsLeft,
      unit.actionPointsLeft,
    );
  }

  split(unitsCount: Map<UnitDefinition, number>): UnitGroup | null {
    const units: UnitCore[] = [];
    for (const [unitDef, count] of unitsCount.entries()) {
      const existingUnitIndex = this.units.findIndex(
        (u) => u.definition === unitDef,
      );
      if (existingUnitIndex === -1) {
        continue;
      }

      const existingUnit = this.units[existingUnitIndex];

      if (existingUnit.count === count) {
        this.units.splice(existingUnitIndex, 1);
        units.push(existingUnit);
        continue;
      }

      existingUnit.count -= count;
    }

    if (units.length === 0) {
      return null;
    }

    collector.unitGroups.add(this);

    const newGroup = this.unitsGroupManager.spawn(this.tile, this.player);
    for (const unit of units) {
      newGroup.addUnit(unit);
    }
    newGroup.update();
    newGroup.actionPointsLeft = this.actionPointsLeft;

    return newGroup;
  }

  update() {
    this.isMilitary = false;
    this.isExplorer = false;
    this.isWorker = false;
    this.isTransport = false;
    this.isSettler = false;
    this.isNaval = false;
    this.isLand = false;
    this.hasChildren = false;
    this.totalCount = 0;
    this.totalStrength = 0;
    this.actionPointsMax = Infinity;
    this.traits.clear();
    for (const unit of this.units) {
      this.isMilitary ||= unit.isMilitary;
      this.isExplorer ||= unit.isExplorer;
      this.isTransport ||= unit.isTransport;
      this.isWorker ||= unit.isWorker;
      this.isSettler ||= unit.isSettler;
      this.isLand ||= unit.isLand;
      this.isNaval ||= unit.isNaval;
      this.hasChildren ||= unit.children.length > 0;
      this.totalCount += unit.count;
      this.totalStrength += unit.count * unit.strength;
      this.actionPointsMax = Math.min(
        this.actionPointsMax,
        unit.definition.actionPoints,
      );
      for (const trait of unit.definition.traits) {
        this.traits.add(trait);
      }
    }
  }
}
