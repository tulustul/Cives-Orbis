import { ResourceDefinition } from "@/core/data/types";
import { CityCore } from "./city";
import { ResourceCategory } from "@/shared";

export class CityStorage {
  resources = new Map<ResourceDefinition, number>();

  storageLimits: Record<ResourceCategory, number> = {
    food: 100,
    livestock: 100,
    crop: 100,
    luxury: 100,
    material: 100,
    mineral: 100,
    natural: 100,
    organic: 100,
    manmade: 100,
    strategic: 100,
  };

  constructor(public city: CityCore) {}

  gatherResources() {
    for (const deposit of this.city.workers.workedResources) {
      let amount = this.resources.get(deposit.def) ?? 0;
      for (const category of deposit.def.categories) {
        amount = Math.min(amount + 1, this.storageLimits[category]);
      }
      this.resources.set(deposit.def, amount);
    }
  }
}
