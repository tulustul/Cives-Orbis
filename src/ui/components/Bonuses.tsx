import { Bonuses as BonusesType, Yields } from "@/shared";
import { Value } from "./Value";

type Props = {
  bonuses: BonusesType;
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

const renderers: Record<keyof BonusesType, (value: any) => React.ReactNode> = {
  yieldValue: (yields: Partial<Yields>) => (
    <div className="flex flex-col">
      {Object.keys(yields).map((key) => {
        const value = yields[key as keyof Yields]!;
        return (
          <Value
            key={key}
            className={value < 0 ? "text-red-500" : `text-${key}`}
          >
            {formatValue(value)} {key}
          </Value>
        );
      })}
    </div>
  ),
  yieldFactor: (yields: Partial<Yields>) => (
    <div className="flex flex-col">
      {Object.keys(yields).map((key) => {
        const value = yields[key as keyof Yields]!;
        return (
          <Value
            key={key}
            className={value < 0 ? "text-red-500" : `text-${key}`}
          >
            {formatPctWithSign(value)} {key}
          </Value>
        );
      })}
    </div>
  ),
  transferProductionToFood: (value) => (
    <Value className={value < 0 ? "text-red-500" : "text-food"}>
      Transfers {formatPct(value)} of production into food
    </Value>
  ),
  transferProductionToCulture: (value) => (
    <Value className={value < 0 ? "text-red-500" : "text-culture"}>
      Transfers {formatPct(value)} of production into culture
    </Value>
  ),
  transferProductionToPublicWorks: (value) => (
    <Value className={value < 0 ? "text-red-500" : "text-publicWorks"}>
      Transfers {formatPct(value)} of production into public works
    </Value>
  ),
};

export function Bonuses({ bonuses }: Props) {
  return (
    <div className="flex flex-col w-full text-center">
      {Object.keys(bonuses).map((key) => {
        const value = bonuses[key as keyof BonusesType];
        const renderer = renderers[key as keyof BonusesType];
        return <div key={key}>{renderer(value)}</div>;
      })}
    </div>
  );
}
