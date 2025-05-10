import { ResourceDefinition } from "@/core/data/types";
import { CityCore } from "./city";
import { ResourceType } from "@/shared";

export class CityStorage {
  resources = new Map<ResourceDefinition, number>();

  storageLimits: Record<ResourceType, number> = {
    food: 100,
    luxury: 100,
    material: 100,
    commodity: 100,
  };

  constructor(public city: CityCore) {}

  gatherResources() {
    for (const deposit of this.city.workers.workedResources) {
      let amount = this.resources.get(deposit.def) ?? 0;
      amount = Math.min(
        amount + 1,
        this.storageLimits[deposit.def.resourceType],
      );
      this.resources.set(deposit.def, amount);
    }
  }
}
