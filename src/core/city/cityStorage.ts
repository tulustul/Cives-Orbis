import { ResourceDefinition, ResourceType } from "../data.interface";
import { CityCore } from "./city";

export class CityStorage {
  resources = new Map<ResourceDefinition, number>();

  storageLimits: Record<ResourceType, number> = {
    food: 100,
    luxury: 100,
    material: 100,
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
