import { CityCore } from "./city";

export class CityStorage {
  resources = new Map<string, number>();

  storageLimits = new Map<string, number>();

  constructor(public city: CityCore) {}

  addResource(resourceId: string, amount: number): number {
    const currentAmount = this.resources.get(resourceId) || 0;
    const limit = this.storageLimits.get(resourceId) || 0;

    const newAmount = Math.min(currentAmount + amount, limit);
    this.resources.set(resourceId, newAmount);

    return newAmount - currentAmount;
  }

  removeResource(resourceId: string, amount: number): number {
    const currentAmount = this.resources.get(resourceId) || 0;

    const amountToRemove = Math.min(currentAmount, amount);
    const newAmount = currentAmount - amountToRemove;

    this.resources.set(resourceId, newAmount);

    return amountToRemove;
  }

  getResourceAmount(resourceId: string): number {
    return this.resources.get(resourceId) || 0;
  }

  getResourceLimit(resourceId: string): number {
    return this.storageLimits.get(resourceId) || 0;
  }
}
