import { CityCore } from "@/core/city";
import { ProductDefinition } from "@/core/data.interface";
import { AISystem } from "./ai-system";

export class CityAI extends AISystem {
  plan() {
    this.operations = [];
    for (const city of this.player.cities) {
      if (city.product?.entityType === "idleProduct" && Math.random() > 0.9) {
        city.cancelProduction();
      }
    }

    for (const city of this.player.citiesWithoutProduction) {
      this.processCityProduct(city);
    }
    return this.operations;
  }

  private processCityProduct(city: CityCore) {
    const buildings = city.availableBuildings.filter(
      (b) => !city.disabledProducts.has(b)
    );

    let product: ProductDefinition;

    if (buildings.length) {
      product = buildings[Math.floor(Math.random() * buildings.length)];
    } else {
      product =
        city.availableIdleProducts[
          Math.floor(Math.random() * city.availableIdleProducts.length)
        ];
    }

    if (product) {
      this.operations.push({
        group: "city-produce",
        entityId: city.id,
        focus: "economy",
        priority: product.entityType === "idleProduct" ? 10 : 100,
        perform: () => city.produce(product),
      });
    }
  }
}
