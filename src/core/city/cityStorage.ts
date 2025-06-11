import { ResourceDefinition } from "@/core/data/types";
import { CityCore } from "./city";
import { ResourceCategory } from "@/shared";

export type CityStorageItem = {
  resource: ResourceDefinition;
  amount: number;
  limit: number;
  yield: number;
};

export class CityStorage {
  resources = new Map<ResourceDefinition, CityStorageItem>();

  storageLimits: Record<ResourceCategory, number> = {
    food: 100,
    primaryFood: 100,
    secondaryFood: 100,
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

  update() {
    for (const item of this.resources.values()) {
      item.yield = 0;
    }

    for (const deposit of this.city.workers.workedResources) {
      let item = this.getOrCreateItem(deposit.def);
      item.yield += deposit.quantity;
      item.limit = this.computeLimit(deposit.def);
    }

    for (const item of this.resources.values()) {
      if (item.amount === 0 && item.yield === 0) {
        this.resources.delete(item.resource);
      }
    }
  }

  gatherResources() {
    for (const item of this.resources.values()) {
      item.amount = Math.min(item.amount + item.yield, item.limit);
    }
  }

  addResource(resource: ResourceDefinition, amount: number) {
    let item = this.getOrCreateItem(resource);
    item.amount = Math.min(item.amount + amount, item.limit);
  }

  private getOrCreateItem(resource: ResourceDefinition): CityStorageItem {
    let item = this.resources.get(resource);
    if (!item) {
      item = {
        resource,
        amount: 0,
        limit: this.computeLimit(resource),
        yield: 0,
      };
      this.resources.set(resource, item);
    }
    return item;
  }

  private computeLimit(resource: ResourceDefinition): number {
    let limit = 0;
    for (const category of resource.categories) {
      limit = Math.max(limit, this.storageLimits[category]);
    }
    return limit;
  }
}
