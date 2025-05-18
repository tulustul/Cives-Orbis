import { Value } from "./Value";
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

type Props = {
  effects: CityEffect[];
};

function formatPct(value: number) {
  return `${(value * 100).toFixed(0)}%`;
}

function formatPctWithSign(value: number) {
  return `${value < 0 ? "-" : "+"}${(value * 100).toFixed(0)}%`;
}

function formatValue(value: number) {
  return value < 0 ? `-${-value}` : `+${value}`;
}

const renderers: Record<CityEffectType, (value: any) => React.ReactNode> = {
  "city.addYields": (effect: CityAddYieldsEffect) => (
    <div className="flex flex-col">
      <Value
        className={effect.value < 0 ? "text-red-500" : `text-${effect.yield}`}
      >
        {formatValue(effect.value)} {effect.yield}
      </Value>
    </div>
  ),
  "city.multiplyYields": (effect: CityMultiplyYieldsEffect) => (
    <div className="flex flex-col">
      <Value
        className={effect.value < 0 ? "text-red-500" : `text-${effect.yield}`}
      >
        {formatPctWithSign(effect.value)} {effect.yield}
      </Value>
    </div>
  ),
  "city.transferProductionToYields": (
    effect: CityTransferProductionToYieldsEffect,
  ) => (
    <Value
      className={effect.value < 0 ? "text-red-500" : `text-${effect.yield}`}
    >
      Transfers {formatPct(effect.value)} of production into {effect.yield}
    </Value>
  ),
  "city.defenseBonus": (effect: CityDefenseBonusEffect) => (
    <Value className="text-defense">
      {formatPctWithSign(effect.defenseBonus)} units defense
    </Value>
  ),
  "city.maxHealth": (effect: CityMaxHealthEffect) => (
    <Value className="text-defense">
      {formatValue(effect.maxHealth)} city health
    </Value>
  ),
  "city.strength": (effect: CityStrengthEffect) => (
    <Value className="text-defense">
      {formatValue(effect.strength)} city strength
    </Value>
  ),
};

export function Effects({ effects }: Props) {
  return (
    <div className="flex flex-col w-full text-center">
      {effects.map((effect, index) => {
        const renderer = renderers[effect.effect];
        return <div key={index}>{renderer(effect)}</div>;
      })}
    </div>
  );
}
