import { CityCore } from "./city";
import {
  CityAddYieldsEffect,
  CityDefenseBonusEffect,
  CityEffect,
  CityEffectType,
  CityMaxHealthEffect,
  CityMultiplyYieldsEffect,
  CityStrengthEffect,
  CityTransferProductionToYieldsEffect,
} from "@/shared";

export interface ICityEffect<T> {
  options: T;
  apply(city: CityCore): void;
}

export class CityAddYieldsEffectImpl
  implements ICityEffect<CityAddYieldsEffect>
{
  constructor(public options: CityAddYieldsEffect) {}

  apply(city: CityCore): void {
    city.yields[this.options.yield] += this.options.value;
  }
}

export class CityMultiplyYieldsEffectImpl
  implements ICityEffect<CityMultiplyYieldsEffect>
{
  constructor(public options: CityMultiplyYieldsEffect) {}

  apply(city: CityCore): void {
    city.yields[this.options.yield] *= this.options.value;
  }
}

export class CityTransferProductionToYieldsEffectImpl
  implements ICityEffect<CityTransferProductionToYieldsEffect>
{
  constructor(public options: CityTransferProductionToYieldsEffect) {}

  apply(city: CityCore): void {
    city.yields[this.options.yield] +=
      city.yields.production * this.options.value;
  }
}

export class CityDefenseBonusEffectImpl
  implements ICityEffect<CityDefenseBonusEffect>
{
  constructor(public options: CityDefenseBonusEffect) {}

  apply(city: CityCore): void {
    city.defense.defenseBonus += this.options.defenseBonus;
  }
}

export class CityMaxHealthEffectImpl
  implements ICityEffect<CityMaxHealthEffect>
{
  constructor(public options: CityMaxHealthEffect) {}

  apply(city: CityCore): void {
    city.defense.maxHealth += this.options.maxHealth;
  }
}

export class CityStrengthEffectImpl implements ICityEffect<CityStrengthEffect> {
  constructor(public options: CityStrengthEffect) {}

  apply(city: CityCore): void {
    city.defense.strength += this.options.strength;
  }
}

export const cityEffects: Record<
  CityEffectType,
  new (...args: any[]) => ICityEffect<any>
> = {
  "city.addYields": CityAddYieldsEffectImpl,
  "city.multiplyYields": CityMultiplyYieldsEffectImpl,
  "city.transferProductionToYields": CityTransferProductionToYieldsEffectImpl,
  "city.defenseBonus": CityDefenseBonusEffectImpl,
  "city.maxHealth": CityMaxHealthEffectImpl,
  "city.strength": CityStrengthEffectImpl,
};

export function createCityEffect(effect: CityEffect): ICityEffect<any> {
  const EffectClass = cityEffects[effect.effect];
  return new EffectClass(effect);
}
