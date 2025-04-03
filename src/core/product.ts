import { CityCore } from "./city";

export abstract class ProductRequirement {
  static id: string;
  abstract check(city: CityCore): boolean;
}

export class BuildingRequirement extends ProductRequirement {
  id = "building";

  constructor(public buildingId: string) {
    super();
  }

  check(city: CityCore) {
    return city.production.buildingsIds.has(this.buildingId);
  }
}

export class SizeRequirement extends ProductRequirement {
  id = "size";

  constructor(public size: number) {
    super();
  }

  check(city: CityCore) {
    return city.population.total >= this.size;
  }
}
