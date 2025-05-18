import { YieldKey } from "./data";

export type YieldsEffect = {
  yield: YieldKey;
  value: number;
};

export type CityAddYieldsEffect = {
  effect: "city.addYields";
} & YieldsEffect;

export type CityMultiplyYieldsEffect = {
  effect: "city.multiplyYields";
} & YieldsEffect;

export type CityTransferProductionToYieldsEffect = {
  effect: "city.transferProductionToYields";
  yield: YieldKey;
  value: number;
} & YieldsEffect;

export type CityDefenseBonusEffect = {
  effect: "city.defenseBonus";
  defenseBonus: number;
};

export type CityMaxHealthEffect = {
  effect: "city.maxHealth";
  maxHealth: number;
};

export type CityStrengthEffect = {
  effect: "city.strength";
  strength: number;
};

export type CityEffect =
  | CityAddYieldsEffect
  | CityMultiplyYieldsEffect
  | CityTransferProductionToYieldsEffect
  | CityDefenseBonusEffect
  | CityMaxHealthEffect
  | CityStrengthEffect;

export type CityEffectType = CityEffect["effect"];
