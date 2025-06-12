import { ResourceDefinition } from "@/core/data/types";
import { CityCore } from "./city";
import { ResourceCategory } from "@/shared";
import { dataManager } from "../data/dataManager";

export type CityStorageItem = {
  resource: ResourceDefinition;
  amount: number;
  limit: number;
  yield: number;
};

export class CityStorage {
  resources = new Map<ResourceDefinition, CityStorageItem>();

  storageLimits: Record<ResourceCategory, number> = {
    food: 1000,
    primaryFood: 1000,
    secondaryFood: 1000,
    livestock: 1000,
    crop: 1000,
    luxury: 1000,
    material: 1000,
    mineral: 1000,
    natural: 1000,
    organic: 1000,
    manmade: 1000,
    strategic: 1000,
  };

  constructor(public city: CityCore) {}

  update() {
    const wood = dataManager.resources.get("resource-wood");

    for (const item of this.resources.values()) {
      item.yield = 0;
    }

    for (const deposit of this.city.workers.workedResources) {
      let item = this.getOrCreateItem(deposit.def);
      item.yield += deposit.quantity;
      item.limit = this.computeLimit(deposit.def);
    }

    for (const tile of this.city.workers.workedTiles) {
      if (tile.forest) {
        let item = this.getOrCreateItem(wood);
        item.yield++;
        item.limit = this.computeLimit(wood);
      }
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
