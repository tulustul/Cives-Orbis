import { CityCore } from "./city";
import { HaveRequirements } from "./data/types";
import { PlayerCore } from "./player";
import {
  CityHaveBuildingRequirement,
  CityIsCoastlineRequirement,
  CityNeedGoldInTreasuryRequirement,
  CityNeverRequirement,
  CitySizeRequirement,
  Requirement,
  RequirementType,
} from "@/shared";

export interface IRequirement<T> {
  options: T;
  check(player: PlayerCore, city: CityCore | null): boolean;
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
): Requirement[] {
  return entity.weakRequirements
    .filter((r) => !r.check(player, city))
    .map((r) => r.options);
}

export class CityNeverRequirementImpl
  implements IRequirement<CityNeverRequirement>
{
  constructor(public options: CityNeverRequirement) {}

  check() {
    return false;
  }
}

export class CityHaveBuildingRequirementImpl
  implements IRequirement<CityHaveBuildingRequirement>
{
  constructor(public options: CityHaveBuildingRequirement) {}

  check(_: PlayerCore, city: CityCore | null) {
    if (!city) {
      return false;
    }
    return city.production.buildingsIds.has(this.options.building);
  }
}

export class CitySizeRequirementImpl
  implements IRequirement<CitySizeRequirement>
{
  constructor(public options: CitySizeRequirement) {}

  check(_: PlayerCore, city: CityCore | null) {
    if (!city) {
      return false;
    }
    return city.population.total >= this.options.size;
  }
}

export class CityIsCoastlineRequirementImpl
  implements IRequirement<CityIsCoastlineRequirement>
{
  constructor(public options: CityIsCoastlineRequirement) {}

  check(_: PlayerCore, city: CityCore | null) {
    if (!city) {
      return false;
    }
    return city.tile.coast;
  }
}

export class CityNeedGoldInTreasuryRequirementImpl
  implements IRequirement<CityNeedGoldInTreasuryRequirement>
{
  constructor(public options: CityNeedGoldInTreasuryRequirement) {}

  check(player: PlayerCore, _: CityCore | null) {
    return player.yields.total.gold > 0;
  }
}

export const requirements: Record<
  RequirementType,
  new (...args: any[]) => IRequirement<any>
> = {
  "city.never": CityNeverRequirementImpl,
  "city.haveBuilding": CityHaveBuildingRequirementImpl,
  "city.size": CitySizeRequirementImpl,
  "city.isCoastline": CityIsCoastlineRequirementImpl,
  "city.needGoldInTreasury": CityNeedGoldInTreasuryRequirementImpl,
};

export function createRequirement(requirement: Requirement): IRequirement<any> {
  const RequrementClass = requirements[requirement.type];
  return new RequrementClass(requirement);
}
