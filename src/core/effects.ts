import { YieldKey } from "@/shared";
import { CityCore } from "./city";

export interface ICityEffect<T> {
  options: T;
  apply(city: CityCore): void;
}

export type YieldsEffect = {
  yield: YieldKey;
  value: number;
};

export type CityAddYieldsEffect = {
  effect: "city.addYields";
} & YieldsEffect;
export class CityAddYieldsEffectImpl
  implements ICityEffect<CityAddYieldsEffect>
{
  constructor(public options: CityAddYieldsEffect) {}

  apply(city: CityCore): void {
    city.yields[this.options.yield] += this.options.value;
  }
}

export type CityMultiplyYieldsEffect = {
  effect: "city.multiplyYields";
} & YieldsEffect;
export class CityMultiplyYieldsEffectImpl
  implements ICityEffect<CityMultiplyYieldsEffect>
{
  constructor(public options: CityMultiplyYieldsEffect) {}

  apply(city: CityCore): void {
    city.yields[this.options.yield] *= this.options.value;
  }
}

export type CityTransferProductionToYieldsEffect = {
  effect: "city.transferProductionToYields";
  yield: YieldKey;
  value: number;
} & YieldsEffect;
export class CityTransferProductionToYieldsEffectImpl
  implements ICityEffect<CityTransferProductionToYieldsEffect>
{
  constructor(public options: CityTransferProductionToYieldsEffect) {}

  apply(city: CityCore): void {
    city.yields[this.options.yield] +=
      city.yields.production * this.options.value;
  }
}

export type CityDefenseBonusEffect = {
  effect: "city.defenseBonus";
  defenseBonus: number;
};
export class CityDefenseBonusEffectImpl
  implements ICityEffect<CityDefenseBonusEffect>
{
  constructor(public options: CityDefenseBonusEffect) {}

  apply(city: CityCore): void {
    city.defense.defenseBonus += this.options.defenseBonus;
  }
}

export type CityMaxHealthEffect = {
  effect: "city.maxHealth";
  maxHealth: number;
};
export class CityMaxHealthEffectImpl
  implements ICityEffect<CityMaxHealthEffect>
{
  constructor(public options: CityMaxHealthEffect) {}

  apply(city: CityCore): void {
    city.defense.maxHealth += this.options.maxHealth;
  }
}

export type CityEffect =
  | CityAddYieldsEffect
  | CityMultiplyYieldsEffect
  | CityTransferProductionToYieldsEffect
  | CityDefenseBonusEffect
  | CityMaxHealthEffect;

export type CityEffectType = CityEffect["effect"];

export const cityEffects: Record<
  CityEffectType,
  new (...args: any[]) => ICityEffect<any>
> = {
  "city.addYields": CityAddYieldsEffectImpl,
  "city.multiplyYields": CityMultiplyYieldsEffectImpl,
  "city.transferProductionToYields": CityTransferProductionToYieldsEffectImpl,
  "city.defenseBonus": CityDefenseBonusEffectImpl,
  "city.maxHealth": CityMaxHealthEffectImpl,
};

export function createCityEffect(effect: CityEffect): ICityEffect<any> {
  const EffectClass = cityEffects[effect.effect];
  return new EffectClass(effect);
}
