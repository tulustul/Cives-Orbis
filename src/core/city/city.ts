import { Bonuses } from "@/core/bonus";
import { IdleProduct, ResourceDefinition } from "@/core/data.interface";
import { PlayerCore } from "@/core/player";
import { TileCore } from "@/core/tile";
import {
  addYields,
  copyYields,
  EMPTY_YIELDS,
  roundYields,
  Yields,
  zeroYields,
} from "@/core/yields";

import { CitiesNetwork } from "@/core/cities-network";
import { collector } from "@/core/collector";
import { SuppliesProducer } from "@/core/supplies";
import { PassableArea } from "@/core/tiles-map";
import { CityStorage } from "./cityStorage";

import { CityExpansion } from "./cityExpansion";
import { CityPopulation } from "./cityPopulation";
import { CityProduction } from "./cityProduction";
import { CityWorkers } from "./cityWorkers";

export type CityVisibility = "all" | "basic" | "hidden";

export class CityCore {
  id!: number;
  name!: string;

  tileYields: Yields = { ...EMPTY_YIELDS };
  yields: Yields = { ...EMPTY_YIELDS };
  perTurn: Yields = { ...EMPTY_YIELDS };

  isCoastline = false;

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

    this.expansion.progressExpansion();
    this.production.progressProduction();
    this.population.progressGrowth();
    this.workers.updateWorkers();
    this.updateYields();
    this.perTurn.food -= this.population.foodConsumed;

    if (
      this.player === this.player.game.trackedPlayer ||
      this.population.changedSize
    ) {
      collector.cities.add(this);
    }
  }

  updateYields() {
    zeroYields(this.tileYields);

    this.tileYields.food = 2;
    this.tileYields.production = 1;

    for (const tile of this.workers.workedTiles) {
      addYields(this.tileYields, tile.yields);
    }

    this.tileYields.production += this.workers.freeTileWorkers;

    copyYields(this.yields, this.tileYields);

    for (const building of this.production.buildings) {
      this.applyBonuses(building.bonuses);
    }

    if (this.production.product?.entityType === "idleProduct") {
      const idleProduct = this.production.product as IdleProduct;
      this.applyBonuses(idleProduct.bonuses);
    }

    roundYields(this.yields);

    copyYields(this.perTurn, this.yields);

    this.storage.gatherResources();

    this.player.updateYields();
  }

  applyBonuses(bonuses: Bonuses) {
    this.yields.food += bonuses.yieldValue?.food || 0;
    this.yields.production += bonuses.yieldValue?.production || 0;
    this.yields.culture += bonuses.yieldValue?.culture || 0;
    this.yields.knowledge += bonuses.yieldValue?.knowledge || 0;
    this.yields.publicWorks += bonuses.yieldValue?.publicWorks || 0;

    if (bonuses.yieldFactor?.food) {
      this.yields.food += this.tileYields.food * bonuses.yieldFactor.food;
    }
    if (bonuses.yieldFactor?.production) {
      this.yields.production +=
        this.tileYields.production * bonuses.yieldFactor.production;
    }
    if (bonuses.yieldFactor?.culture) {
      this.yields.culture +=
        this.tileYields.culture * bonuses.yieldFactor.culture;
    }
    if (bonuses.yieldFactor?.knowledge) {
      this.yields.knowledge +=
        this.tileYields.knowledge * bonuses.yieldFactor.knowledge;
    }
    if (bonuses.yieldFactor?.publicWorks) {
      this.yields.publicWorks +=
        this.tileYields.publicWorks * bonuses.yieldFactor.publicWorks;
    }

    if (bonuses.transferProductionToFood) {
      this.yields.food +=
        this.yields.production * bonuses.transferProductionToFood;
    }

    if (bonuses.transferProductionToCulture) {
      this.yields.culture +=
        this.yields.production * bonuses.transferProductionToCulture;
    }

    if (bonuses.transferProductionToPublicWorks) {
      this.yields.publicWorks +=
        this.yields.production * bonuses.transferProductionToPublicWorks;
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
      oldOwner.area.removeBulk(cityTiles);
    }

    newOwner.cities.push(this);
    newOwner.area.addBulk(cityTiles);

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
}
