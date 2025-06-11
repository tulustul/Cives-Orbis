import { CityCore } from "@/core/city";
import { Building, DistrictDefinition } from "@/core/data/types";
import { AISystem } from "./ai-system";
import { AiOrder } from "./types";

export class CityAI extends AISystem {
  *plan(): Generator<AiOrder> {
    for (const city of this.player.citiesWithoutProduction) {
      yield* this.processCityProduct(city);
    }
  }

  private *processCityProduct(city: CityCore): Generator<AiOrder> {
    const buildings = city.production.availableBuildings.filter(
      (b) => !city.production.disabledProducts.has(b),
    );
    const districts = city.production.availableDistricts.filter(
      (d) => !city.production.disabledProducts.has(d),
    );

    const products = [...buildings, ...districts];

    if (products.length) {
      yield* this.processBuildingsAndDistricts(city, products);
    } else {
      yield* this.processIdleProducts(city);
    }
  }

  private *processBuildingsAndDistricts(
    city: CityCore,
    products: (Building | DistrictDefinition)[],
  ): Generator<AiOrder> {
    const product = products[Math.floor(Math.random() * products.length)];

    if (product.entityType === "building") {
      yield {
        group: "city-produce",
        entityId: city.id,
        focus: "economy",
        priority: 100,
        perform: () => city.production.produceBuilding(product),
      };
    } else if (product.entityType === "district") {
      const tile = city.districts.getAvailableTiles(product)[0];
      if (tile) {
        yield {
          group: "city-produce",
          entityId: city.id,
          focus: "economy",
          priority: 100,
          perform: () => city.production.produceDistrict(product, tile),
        };
      }
    }
  }

  private *processIdleProducts(city: CityCore): Generator<AiOrder> {
    const idleProducts = city.production.availableIdleProducts;
    const chosenProduct =
      idleProducts[Math.floor(Math.random() * idleProducts.length)];

    yield {
      group: "city-produce",
      entityId: city.id,
      focus: "economy",
      priority: 10,
      perform: () => city.production.workOnIdleProduct(chosenProduct),
    };
  }
}
