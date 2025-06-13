import { UnitAction, UnitOrder } from "@/shared";
import { collector } from "./collector";
import { UnitDefinition } from "./data/types";
import { PlayerCore } from "./player";
import { SuppliesBlocker, SuppliesProducer } from "./supplies";
import { TileCore } from "./tile";
import { ACTIONS } from "./unit-actions";
import { UnitsManager } from "./unit-manager";
import { UnitGroup } from "./unitGroup";

export class UnitCore {
  id!: number;
  actionPointsLeft: number;
  // maxHealth = 100;
  // health = this.maxHealth;
  supplies = 100;
  path: TileCore[][] | null = null;
  parent: UnitCore | null = null;
  children: UnitCore[] = [];
  count = 1;

  order: UnitOrder | null = null;

  zoc: TileCore[] = [];

  suppliesProducer: SuppliesProducer | null = null;
  suppliesBlocker: SuppliesBlocker | null = null;

  isLand: boolean;
  isNaval: boolean;
  isMilitary: boolean;
  isTransport: boolean;
  isWorker: boolean;
  isExplorer: boolean;
  isSettler: boolean;

  hasWage = true;

  constructor(
    public tile: TileCore,
    public definition: UnitDefinition,
    public player: PlayerCore,
    private unitManager: UnitsManager,
    public group: UnitGroup,
  ) {
    this.actionPointsLeft = definition.actionPoints;
    this.isLand = definition.traits.includes("land");
    this.isNaval = definition.traits.includes("naval");
    this.isMilitary = definition.traits.includes("military");
    this.isTransport = definition.traits.includes("transport");
    this.isExplorer = definition.traits.includes("explorer");
    this.isSettler = definition.traits.includes("settler");
    this.isWorker = definition.traits.includes("worker");
  }

  changeCount(count: number) {
    this.count += count;
    if (this.count <= 0) {
      this.destroy();
    }
    this.group.changeCount(count);
  }

  doAction(action: UnitAction) {
    if (!this.canDoAction(action)) {
      return;
    }

    ACTIONS[action].fn(this.player.game, this);

    if (!collector.unitsGroupsDestroyed.has(this.id)) {
      if (this.isPlayerTracked) {
        collector.unitGroups.add(this.group);
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

  addChild(unit: UnitCore) {
    if (this.children.includes(unit)) {
      return;
    }
    if (unit.parent) {
      unit.parent.removeChild(unit);
    }
    this.children.push(unit);
    unit.parent = this;
    collector.unitGroups.add(this.group);
  }

  removeChild(unit: UnitCore) {
    const index = this.children.findIndex((u) => u === unit);
    if (index !== -1) {
      this.children.splice(index, 1);
      unit.parent = null;
      collector.unitGroups.add(this.group);
    }
  }

  destroy() {
    this.count = 0;
    this.actionPointsLeft = 0;
    this.unitManager.destroy(this);
  }

  getVisibleTiles(): Set<TileCore> {
    return this.tile.getTilesInRange(2);
  }

  get isSupplied() {
    if (!this.isMilitary) {
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
    return 1;
  }

  get isAlive() {
    return this.count > 0;
  }
}
