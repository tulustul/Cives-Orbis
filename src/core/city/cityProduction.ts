import { collector } from "../collector";
import {
  Building,
  IdleProduct,
  ProductDefinition,
  UnitDefinition,
} from "../data.interface";
import { checkRequirements } from "../requirements";
import { CityCore } from "./city";

export class CityProduction {
  product: ProductDefinition | null = null;
  totalProduction = 0;

  availableBuildings: Building[] = [];

  availableUnits: UnitDefinition[] = [];

  availableIdleProducts: IdleProduct[] = [];

  disabledProducts = new Set<ProductDefinition>();

  buildings: Building[] = [];
  buildingsIds = new Set<string>();

  constructor(public city: CityCore) {}

  produceUnit(unit: UnitDefinition) {
    this.startProducing(unit);
  }

  produceBuilding(building: Building) {
    if (this.canConstruct(building)) {
      this.startProducing(building);
    }
  }

  getTurnsToProduce(unit: UnitDefinition) {
    return Math.ceil(unit.productionCost / this.city.yields.production);
  }

  workOnIdleProduct(idleProduct: IdleProduct) {
    this.startProducing(idleProduct);
    this.city.updateYields();
    this.city.player.updateYields();
  }

  produce(product: ProductDefinition) {
    if (product.entityType === "unit") {
      this.produceUnit(product as UnitDefinition);
    } else if (product.entityType === "building") {
      this.produceBuilding(product as Building);
    } else if (product.entityType === "idleProduct") {
      this.workOnIdleProduct(product as IdleProduct);
    }
  }

  cancelProduction() {
    if (this.product) {
      const type = this.product.entityType;
      this.product = null;
      if (type === "idleProduct") {
        this.city.updateYields();
        this.city.player.updateYields();
      }
      this.city.player.citiesWithoutProduction.push(this.city);
    }
  }

  private startProducing(product: ProductDefinition) {
    if (!this.canProduce(product)) {
      return;
    }

    this.cancelProduction();

    this.product = product;
    this.totalProduction = 0;
    collector.cities.add(this.city);
  }

  get turnsToProductionEnd() {
    if (!this.product) {
      return null;
    }
    const remainingProduction =
      this.product.productionCost - this.totalProduction;

    return Math.ceil(remainingProduction / this.city.yields.production);
  }

  progressProduction() {
    if (!this.product) {
      return;
    }

    this.totalProduction += this.city.yields.production;

    if (this.totalProduction >= this.product.productionCost) {
      if (this.product.entityType === "unit") {
        this.city.player.game.unitsManager.spawn(
          this.product.id,
          this.city.tile,
          this.city.player,
        );
      } else if (this.product.entityType === "building") {
        this.addBuilding(this.product);
      }
      this.totalProduction = 0;
      this.product = null;
    }
  }

  public addBuilding(building: Building) {
    this.buildings.push(building);
    this.buildingsIds.add(building.id);
  }

  canConstruct(building: Building) {
    return !this.buildings.includes(building);
  }

  canProduce(product: ProductDefinition): boolean {
    // First check technical requirements
    if (!checkRequirements(product, this.city.player, this.city)) {
      return false;
    }

    return true;
  }

  private getAvailableProducts<T extends ProductDefinition>(
    products: T[],
  ): T[] {
    const results: T[] = [];
    for (const p of products) {
      let ok = true;
      for (const r of p.strongRequirements) {
        if (!r.check(this.city.player, this.city)) {
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
        if (!r.check(this.city.player, this.city)) {
          results.add(p);
        }
      }
    }
    return results;
  }

  updateProductsList() {
    const knowledge = this.city.player.knowledge;

    this.availableUnits = this.getAvailableProducts<UnitDefinition>(
      Array.from(knowledge.discoveredEntities.unit),
    );

    const notBuildBuildings = Array.from(
      this.city.player.knowledge.discoveredEntities.building,
    ).filter((b) => this.product !== b && !this.buildings.includes(b));

    this.availableBuildings =
      this.getAvailableProducts<Building>(notBuildBuildings);

    this.availableIdleProducts = Array.from(
      knowledge.discoveredEntities.idleProduct,
    );

    this.disabledProducts = this.getDisabledProducts<ProductDefinition>([
      ...this.availableUnits,
      ...this.availableBuildings,
      ...this.availableIdleProducts,
    ]);
  }
}
