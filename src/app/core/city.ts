import { TileCore } from "./tile";
import { PlayerCore } from "./player";
import {
  UnitDefinition,
  ProductDefinition,
  Building,
  IdleProduct,
} from "./data.interface";
import { Bonuses } from "./bonus";
import {
  EMPTY_YIELDS,
  Yields,
  zeroYields,
  addYields,
  copyYields,
  roundYields,
} from "./yields";

import { collector } from "./collector";
import { BUILDINGS } from "../data/products/buildings";
import { UNITS_DEFINITIONS } from "../data/products/units";
import { IDLE_PRODUCTS } from "../data/products/idle-products";
import { checkRequirements } from "./requirements";

export type ProductType = "unit" | "building" | "idleProduct";

export interface Product {
  type: ProductType;
  productDefinition: ProductDefinition;
}

export class CityCore {
  id: number;
  name: string;
  size: number;

  totalFood = 0;
  foodConsumed = 1;

  totalCulture = 0;

  tileYields: Yields = { ...EMPTY_YIELDS };
  yields: Yields = { ...EMPTY_YIELDS };
  perTurn: Yields = { ...EMPTY_YIELDS };

  product: Product | null = null;
  totalProduction = 0;

  buildings: Building[] = [];
  buildingsIds = new Set<string>();

  tiles = new Set<TileCore>();

  visibleTiles = new Set<TileCore>();

  workedTiles = new Set<TileCore>();

  notWorkedTiles = new Set<TileCore>();

  availableBuildings: Building[] = [];
  disabledBuildings = new Set<Building>();

  availableUnits: UnitDefinition[] = [];
  disabledUnits = new Set<UnitDefinition>();

  availableIdleProducts: IdleProduct[] = [];
  disabledIdleProducts = new Set<IdleProduct>();

  changedSize = false;

  isCoastline = false;

  constructor(public tile: TileCore, public player: PlayerCore) {
    this.addTile(tile);
  }

  nextTurn() {
    this.changedSize = false;

    this.progressExpansion();
    this.progressProduction();
    this.progressGrowth();
    this.updateYields();

    if (this.player === this.player.game.trackedPlayer || this.changedSize) {
      collector.cities.add(this);
    }
  }

  private progressProduction() {
    if (!this.product) {
      return;
    }

    this.totalProduction += this.yields.production;

    if (this.totalProduction >= this.product.productDefinition.productionCost) {
      if (this.product.type === "unit") {
        this.player.game.unitsManager.spawn(
          this.product.productDefinition.id,
          this.tile,
          this.player,
        );
      } else if (this.product.type === "building") {
        this.buildings.push(this.product.productDefinition as Building);
        this.buildingsIds.add(this.product.productDefinition.id);
      }
      this.totalProduction = 0;
      this.product = null;
    }
  }

  private progressGrowth() {
    this.totalFood += this.yields.food - this.foodConsumed;
    const foodToGrow = this.getFoodToGrow();
    if (this.totalFood >= foodToGrow) {
      this.size++;
      this.changedSize = true;
      const bestWorkableTile = this.pickBestTileToWork(this.notWorkedTiles);
      if (bestWorkableTile) {
        this.workTile(bestWorkableTile);
      }
      this.totalFood -= foodToGrow;
    } else if (this.totalFood < 0) {
      if (this.size > 1) {
        this.size--;
        this.changedSize = true;
        this.totalFood += foodToGrow;
      } else {
        this.totalFood = 0;
      }
    }
  }

  private progressExpansion() {
    this.totalCulture += this.perTurn.culture;
    const cultureToExpand = this.getCultureToExpand();
    if (this.totalCulture >= cultureToExpand) {
      this.totalCulture -= cultureToExpand;

      const tile = this.pickBestTileToExpand(
        this.tile,
        this.getTilesAvailableForExpansion(),
      );
      if (tile) {
        this.addTile(tile);
        tile.sweetSpotValue = 0;
      }
    }
  }

  getCultureToExpand() {
    return Math.ceil(5 * Math.pow(1.2, this.tiles.size));
  }

  getFoodToGrow() {
    return Math.ceil(15 * Math.pow(1.2, this.size));
  }

  produceUnit(unit: UnitDefinition) {
    this.startProducing({
      type: "unit",
      productDefinition: unit,
    });
  }

  produceBuilding(building: Building) {
    if (this.canConstruct(building)) {
      this.startProducing({
        type: "building",
        productDefinition: building,
      });
    }
  }

  workOnIdleProduct(idleProduct: IdleProduct) {
    this.startProducing({
      type: "idleProduct",
      productDefinition: idleProduct,
    });
    this.updateYields();
    this.player.updateYields();
  }

  cancelProduction() {
    if (this.product) {
      const type = this.product.type;
      this.product = null;
      if (type === "idleProduct") {
        this.updateYields();
        this.player.updateYields();
      }
    }
  }

  private startProducing(product: Product) {
    if (!this.canProduce(product.productDefinition)) {
      return;
    }

    this.cancelProduction();

    this.product = product;
    this.totalProduction = 0;
    collector.cities.add(this);
  }

  get turnsToGrow() {
    if (this.perTurn.food >= 0) {
      const remainingFood = this.getFoodToGrow() - this.totalFood;
      return Math.max(0, Math.ceil(remainingFood / this.perTurn.food));
    } else {
      return Math.max(0, Math.ceil(this.totalFood / this.perTurn.food) - 1);
    }
  }

  get turnsToProductionEnd() {
    if (!this.product) {
      return null;
    }
    const remainingProduction =
      this.product.productDefinition.productionCost - this.totalProduction;

    return Math.ceil(remainingProduction / this.yields.production);
  }

  get turnsToExpand() {
    const remainingCulture = this.getCultureToExpand() - this.totalCulture;
    return Math.ceil(remainingCulture / this.perTurn.culture);
  }

  getTurnsToProduce(unit: UnitDefinition) {
    return Math.ceil(unit.productionCost / this.yields.production);
  }

  updateYields() {
    zeroYields(this.tileYields);

    this.tileYields.food = 2;
    this.tileYields.production = 1;

    for (const tile of this.workedTiles) {
      addYields(this.tileYields, tile.yields);
    }

    this.tileYields.production += this.freeTileWorkers;

    copyYields(this.yields, this.tileYields);

    for (const building of this.buildings) {
      this.applyBonuses(building.bonuses);
    }

    if (this.product?.type === "idleProduct") {
      const idleProduct = this.product.productDefinition as IdleProduct;
      this.applyBonuses(idleProduct.bonuses);
    }
    roundYields(this.yields);

    this.foodConsumed = this.size;

    copyYields(this.perTurn, this.yields);
    this.perTurn.food -= this.foodConsumed;
  }

  applyBonuses(bonuses: Bonuses) {
    this.yields.food += bonuses.yieldValue?.food || 0;
    this.yields.production += bonuses.yieldValue?.production || 0;
    this.yields.culture += bonuses.yieldValue?.culture || 0;
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

  addTile(tile: TileCore) {
    if (!tile.areaOf) {
      this.tiles.add(tile);
      this.notWorkedTiles.add(tile);
      tile.areaOf = this;
      this.player.area.add(tile);
      this.player.exploreTiles([tile]);
      this.player.exploreTiles(tile.neighbours);
      collector.tiles.add(tile);
    }
  }

  removeTile(tile: TileCore) {
    if (this.tiles.has(tile)) {
      this.tiles.delete(tile);
      tile.areaOf = null;
      this.player.area.remove(tile);
      collector.tiles.add(tile);
    }
  }

  workTile(tile: TileCore, updateYields = true) {
    if (this.freeTileWorkers && this.tiles.has(tile)) {
      this.workedTiles.add(tile);
      this.notWorkedTiles.delete(tile);
      if (updateYields) {
        this.updateYields();
      }
    }
  }

  unworkTile(tile: TileCore, updateYields = true) {
    this.workedTiles.delete(tile);
    this.notWorkedTiles.add(tile);
    if (updateYields) {
      this.updateYields();
    }
  }

  getTilesAvailableForExpansion(): Set<TileCore> {
    const availableTiles = new Set<TileCore>();
    for (const tile of this.tiles) {
      for (const neighbour of tile.neighbours) {
        if (!neighbour.areaOf) {
          availableTiles.add(neighbour);
        }
      }
    }
    return availableTiles;
  }

  pickBestTileToWork(tiles: Set<TileCore>): TileCore | null {
    let bestTile: TileCore | null = null;
    let bestYields = 0;

    for (const tile of tiles) {
      const yields = tile.totalYields;
      if (yields > bestYields) {
        bestYields = yields;
        bestTile = tile;
      }
    }

    return bestTile;
  }

  pickBestTileToExpand(
    cityTile: TileCore,
    tiles: Set<TileCore>,
  ): TileCore | null {
    let bestTile: TileCore | null = null;
    let bestScore = -Infinity;

    for (const tile of tiles) {
      const score = tile.totalYields - cityTile.getDistanceTo(tile) / 2;
      if (score > bestScore) {
        bestScore = score;
        bestTile = tile;
      }
    }

    return bestTile;
  }

  get freeTileWorkers() {
    return this.size - this.workedTiles.size;
  }

  optimizeYields() {
    this.workedTiles.clear();
    this.notWorkedTiles = new Set(this.tiles);
    while (this.freeTileWorkers && this.notWorkedTiles.size) {
      const tile = this.pickBestTileToWork(this.notWorkedTiles);
      if (!tile) {
        break;
      }
      this.workTile(tile, false);
    }
    this.updateYields();
  }

  canConstruct(building: Building) {
    return !this.buildings.includes(building);
  }

  canProduce(product: ProductDefinition): boolean {
    return checkRequirements(product, this.player, this);
  }

  private getAvailableProducts<T extends ProductDefinition>(
    products: T[],
  ): T[] {
    const results: T[] = [];
    for (const p of products) {
      let ok = true;
      for (const r of p.strongRequirements) {
        if (!r.check(this.player, this)) {
          ok = false;
          break;
        }
      }
      if (ok) {
        results.push(p);
      }
    }
    return results;
  }

  private getDisabledProducts<T extends ProductDefinition>(
    products: T[],
  ): Set<T> {
    const results = new Set<T>();
    for (const p of products) {
      for (const r of p.weakRequirements) {
        if (!r.check(this.player, this)) {
          results.add(p);
        }
      }
    }
    return results;
  }

  updateProductsList() {
    this.availableUnits = this.getAvailableProducts<UnitDefinition>(
      UNITS_DEFINITIONS,
    );
    this.disabledUnits = this.getDisabledProducts<UnitDefinition>(
      this.availableUnits,
    );

    const notBuildBuildings = BUILDINGS.filter(
      (b) =>
        this.product?.productDefinition !== b && !this.buildings.includes(b),
    );

    this.availableBuildings = this.getAvailableProducts<Building>(
      notBuildBuildings,
    );
    this.disabledBuildings = this.getDisabledProducts<Building>(
      this.availableBuildings,
    );

    this.availableIdleProducts = IDLE_PRODUCTS;
  }

  changeOwner(newOwner: PlayerCore) {
    if (this.player === newOwner) {
      return;
    }

    const oldOwner = this.player;

    this.player = newOwner;

    const cityTiles = Array.from(this.tiles);

    let index = oldOwner.cities.indexOf(this);
    if (index !== -1) {
      oldOwner.cities.splice(index, 1);
      oldOwner.area.removeBulk(cityTiles);
    }

    newOwner.cities.push(this);
    newOwner.area.addBulk(cityTiles);

    newOwner.updateYields();
    oldOwner.updateYields();

    // TODO explored area should be bigger then city tiles. Change this once fog of war is implement (probably a city should store it's visible tiles)
    newOwner.exploreTiles(this.tiles);

    this.cancelProduction();

    collector.cities.add(this);
    for (const tile of this.tiles) {
      collector.tiles.add(tile);
    }
  }
}
