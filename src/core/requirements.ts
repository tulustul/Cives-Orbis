import { CityCore } from "./city";
import { HaveRequirements } from "./data/types";
import { PlayerCore } from "./player";

export abstract class Requirement {
  id = "";
  context: any = {};
  abstract check(player: PlayerCore, city: CityCore | null): boolean;
}

export function checkRequirements(
  entity: HaveRequirements,
  player: PlayerCore,
  city: CityCore | null,
): boolean {
  for (const r of entity.strongRequirements) {
    if (!r.check(player, city)) {
      return false;
    }
  }

  for (const r of entity.weakRequirements) {
    if (!r.check(player, city)) {
      return false;
    }
  }

  return true;
}

export function getFailedWeakRequirements(
  entity: HaveRequirements,
  player: PlayerCore,
  city: CityCore | null,
): [string, any][] {
  return entity.weakRequirements
    .filter((r) => !r.check(player, city))
    .map((r) => [r.id, r.context]);
}

export class NeverRequirement extends Requirement {
  override id = "never";

  check() {
    return false;
  }
}

export class CityHaveBuildingRequirement extends Requirement {
  override id = "cityHaveBuilding";

  constructor(buildingId: string) {
    super();
    this.context = { buildingId };
  }

  check(_: PlayerCore, city: CityCore | null) {
    if (!city) {
      return false;
    }
    return city.production.buildingsIds.has(this.context.buildingId);
  }
}

export class CitySizeRequirement extends Requirement {
  override id = "citySize";

  constructor(size: number) {
    super();
    this.context = { size };
  }

  check(_: PlayerCore, city: CityCore | null) {
    if (!city) {
      return false;
    }
    return city.population.total >= this.context.size;
  }
}

export class CoastlineCityRequirement extends Requirement {
  override id = "cityIsCoastline";

  check(_: PlayerCore, city: CityCore | null) {
    if (!city) {
      return false;
    }
    return city.tile.coast;
  }
}
