import { PlayerCore } from "@/core/player";
import { TileCore } from "@/core/tile";
import {
  addYields,
  copyYields,
  EMPTY_YIELDS,
  roundYields,
  zeroYields,
} from "@/core/yields";
import { CityRenderType, CityVisibility, Yields } from "@/shared";

import { CitiesNetwork } from "@/core/cities-network";
import { collector } from "@/core/collector";
import { SuppliesProducer } from "@/core/supplies";
import { PassableArea } from "@/core/tiles-map";
import { CityStorage } from "./cityStorage";

import { IdleProduct, ResourceDefinition } from "@/core/data/types";
import { ICityEffect } from "../effects";
import { CityDefense } from "./cityDefense";
import { CityDistricts } from "./cityDistricts";
import { CityExpansion } from "./cityExpansion";
import { CityPopulation } from "./cityPopulation";
import { CityProduction } from "./cityProduction";
import { CityWorkers } from "./cityWorkers";

export class CityCore {
  id!: number;
  name!: string;

  tileYields: Yields = { ...EMPTY_YIELDS };
  yields: Yields = { ...EMPTY_YIELDS };
  perTurn: Yields = { ...EMPTY_YIELDS };
  tradeYields: Yields = { ...EMPTY_YIELDS };

  passableAreas = new Set<PassableArea>();

  resources: ResourceDefinition[] = [];

  suppliesProducers: SuppliesProducer;

  network: CitiesNetwork | null = null;

  population = new CityPopulation(this);

  workers = new CityWorkers(this);

  resourceStorage = new CityStorage(this);

  production = new CityProduction(this);

  expansion = new CityExpansion(this);

  storage = new CityStorage(this);

  defense = new CityDefense(this);

  districts = new CityDistricts(this);

  value = 0;

  constructor(public tile: TileCore, public player: PlayerCore) {
    this.expansion.addTile(tile);

    for (const t of [tile, ...tile.neighbours]) {
      if (t.passableArea) {
        this.passableAreas.add(t.passableArea);
      }
    }

    this.suppliesProducers = new SuppliesProducer(this.tile, this.player, 5);
  }

  nextTurn() {
    this.population.changedSize = false;
    this.defense.changed = false;

    this.expansion.progressExpansion();
    this.production.progressProduction();
    this.population.progressGrowth();
    this.workers.updateWorkers();

    this.update();
    this.defense.update();
    this.perTurn.food -= this.population.foodConsumed;

    if (
      this.player === this.player.game.trackedPlayer ||
      this.population.changedSize ||
      this.defense.changed
    ) {
      collector.cities.add(this);
    }
  }

  reset() {
    zeroYields(this.tileYields);
    zeroYields(this.tradeYields);
    this.defense.reset();
  }

  update() {
    this.reset();

    this.tileYields.food = 2;
    this.tileYields.production = 1;

    for (const tile of this.workers.workedTiles) {
      addYields(this.tileYields, tile.yields);
    }

    this.tileYields.production += this.workers.freeTileWorkers;

    copyYields(this.yields, this.tileYields);

    for (const building of this.production.buildings) {
      this.applyEffects(building.effects);
    }

    if (this.production.product?.entityType === "idleProduct") {
      const idleProduct = this.production.product as IdleProduct;
      this.applyEffects(idleProduct.effects);
    }

    roundYields(this.yields);

    copyYields(this.perTurn, this.yields);

    if (this.network) {
      this.tradeYields.gold = Math.min(
        5,
        Math.floor((this.network.nodes.length - 1) ** 0.5),
      );
    }

    this.storage.gatherResources();

    this.player.updateYields();

    this.computeValue();
  }

  applyEffects(effects: ICityEffect<any>[]) {
    for (const effect of effects) {
      effect.apply(this);
    }
  }

  changeOwner(newOwner: PlayerCore) {
    if (this.player === newOwner) {
      return;
    }

    this.suppliesProducers.forget();

    const oldOwner = this.player;

    this.player = newOwner;

    const cityTiles = Array.from(this.expansion.tiles);

    const index = oldOwner.cities.indexOf(this);
    if (index !== -1) {
      oldOwner.cities.splice(index, 1);
    }

    newOwner.cities.push(this);

    for (const tile of cityTiles) {
      collector.tileOwnershipChanges.add(tile);
    }

    newOwner.updateYields();
    oldOwner.updateYields();

    // TODO explored area should be bigger then city tiles. Change this once fog of war is implement 1(probably a city should store it's visible tiles)
    newOwner.exploreTiles(this.expansion.tiles);

    this.production.cancelProduction();

    this.suppliesProducers.add();

    collector.cities.add(this);
    for (const tile of this.expansion.tiles) {
      collector.tiles.add(tile);
    }
  }

  getVisibilityFor(player: PlayerCore): CityVisibility {
    if (player === this.player) {
      return "all";
    }

    if (player.exploredTiles.has(this.tile)) {
      return "basic";
    }

    return "hidden";
  }

  get renderType(): CityRenderType {
    if (this.defense.strength > 0) {
      return "walled";
    }
    return "normal";
  }

  computeValue() {
    this.value = this.population.total;

    const yields = this.tile.yields;
    this.value += yields.food * 2 + yields.production * 3 + yields.gold;

    this.value += this.resources.length * 5;

    if (this.tile.coast) {
      this.value += 10;
    }
  }
}
