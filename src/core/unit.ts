import { UnitAction, UnitOrder, UnitTrait } from "@/shared";
import { TileCore } from "./tile";
import { PlayerCore } from "./player";
import { ACTIONS } from "./unit-actions";
import { collector } from "./collector";
import { UnitsManager } from "./unit-manager";
import { getMoveCost, getMoveResult, MoveResult } from "./movement";
import { SuppliesBlocker, SuppliesProducer } from "./supplies";
import { UnitDefinition } from "./data/types";

export class UnitCore {
  id!: number;
  actionPointsLeft: number;
  maxHealth = 100;
  health = this.maxHealth;
  supplies = 100;
  path: TileCore[][] | null = null;
  parent: UnitCore | null = null;
  children: UnitCore[] = [];

  order: UnitOrder | null = null;

  zoc: TileCore[] = [];

  suppliesProducer: SuppliesProducer | null = null;
  suppliesBlocker: SuppliesBlocker | null = null;

  hasWage = true;

  constructor(
    public tile: TileCore,
    public definition: UnitDefinition,
    public player: PlayerCore,
    private unitManager: UnitsManager,
  ) {
    this.actionPointsLeft = definition.actionPoints;
  }

  doAction(action: UnitAction) {
    if (!this.canDoAction(action)) {
      return;
    }

    ACTIONS[action].fn(this.player.game, this);

    if (!collector.unitsDestroyed.has(this.id)) {
      if (this.isPlayerTracked) {
        collector.units.add(this);
      }
    }
  }

  canDoAction(action: UnitAction): boolean {
    if (!this.actionPointsLeft) {
      return false;
    }

    return this.checkActionRequirements(action);
  }

  checkActionRequirements(action: UnitAction): boolean {
    if (!this.definition.actions.includes(action)) {
      return false;
    }

    for (const r of ACTIONS[action].requirements) {
      if (!r.check(this, action)) {
        return false;
      }
    }

    return true;
  }

  getFailedActionRequirements(action: UnitAction): string[] {
    return ACTIONS[action].requirements
      .filter((r) => !r.check(this, action))
      .map((r) => r.id);
  }

  setOrder(order: UnitOrder | null) {
    this.order = order;
    this.player.updateUnitsWithoutOrders();
    if (order !== "go") {
      this.path = null;
    }
    if (this.isPlayerTracked) {
      collector.units.add(this);
    }
  }

  getPathDestination(): TileCore | null {
    if (!this.path) {
      return null;
    }

    const lastPathTurn = this.path[this.path.length - 1];
    return lastPathTurn[lastPathTurn.length - 1];
  }

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

  addChild(unit: UnitCore) {
    if (this.children.includes(unit)) {
      return;
    }
    if (unit.parent) {
      unit.parent.removeChild(unit);
    }
    this.children.push(unit);
    unit.parent = this;
    collector.units.add(this);
  }

  removeChild(unit: UnitCore) {
    const index = this.children.findIndex((u) => u === unit);
    if (index !== -1) {
      this.children.splice(index, 1);
      unit.parent = null;
      collector.units.add(this);
    }
  }

  destroy() {
    this.unitManager.destroy(this);
  }

  getVisibleTiles(): Set<TileCore> {
    return this.tile.getTilesInRange(2);
  }

  get isSupplied() {
    if (this.definition.trait !== UnitTrait.military) {
      return true;
    }
    return this.tile.isSuppliedByPlayer(this.player);
  }

  get isPlayerTracked() {
    return this.player.game.trackedPlayer === this.player;
  }

  get strength() {
    return this.definition.strength;
  }

  get wage() {
    return 0.5;
  }
}
