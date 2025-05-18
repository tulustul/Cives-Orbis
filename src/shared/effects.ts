import { YieldKey } from "./data";

export type YieldsEffect = {
  yield: YieldKey;
  value: number;
};

export type CityAddYieldsEffect = {
  type: "city.addYields";
} & YieldsEffect;

export type CityMultiplyYieldsEffect = {
  type: "city.multiplyYields";
} & YieldsEffect;

export type CityTransferProductionToYieldsEffect = {
  type: "city.transferProductionToYields";
  yield: YieldKey;
  value: number;
} & YieldsEffect;

export type CityDefenseBonusEffect = {
  type: "city.defenseBonus";
  defenseBonus: number;
};

export type CityMaxHealthEffect = {
  type: "city.maxHealth";
  maxHealth: number;
};

export type CityStrengthEffect = {
  type: "city.strength";
  strength: number;
};

export type CityEffect =
  | CityAddYieldsEffect
  | CityMultiplyYieldsEffect
  | CityTransferProductionToYieldsEffect
  | CityDefenseBonusEffect
  | CityMaxHealthEffect
  | CityStrengthEffect;

export type CityEffectType = CityEffect["type"];
