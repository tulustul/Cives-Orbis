import { CityCore } from "@/core/city";
import { ProductDefinition } from "@/core/data/types";
import { AISystem } from "./ai-system";

export class CityAI extends AISystem {
  plan() {
    this.operations = [];
    for (const city of this.player.cities) {
      if (
        city.production.product?.entityType === "idleProduct" &&
        Math.random() > 0.9
      ) {
        city.production.cancelProduction();
      }
    }

    for (const city of this.player.citiesWithoutProduction) {
      this.processCityProduct(city);
    }
    return this.operations;
  }

  private processCityProduct(city: CityCore) {
    const buildings = city.production.availableBuildings.filter(
      (b) => !city.production.disabledProducts.has(b),
    );

    let product: ProductDefinition;

    if (buildings.length) {
      product = buildings[Math.floor(Math.random() * buildings.length)];
    } else {
      product =
        city.production.availableIdleProducts[
          Math.floor(
            Math.random() * city.production.availableIdleProducts.length,
          )
        ];
    }

    if (product) {
      this.operations.push({
        group: "city-produce",
        entityId: city.id,
        focus: "economy",
        priority: product.entityType === "idleProduct" ? 10 : 100,
        perform: () => city.production.produce(product),
      });
    }
  }
}
