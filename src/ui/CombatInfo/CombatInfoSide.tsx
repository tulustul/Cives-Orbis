import {
  UnitDefChanneled,
  CombatModifierType,
  CombatSimulationSide,
} from "@/shared";
import { ImageIcon } from "@/ui/components";
import clsx from "clsx";

const MODIFIER_LABELS: Record<CombatModifierType, string> = {
  [CombatModifierType.river]: "from river",
  [CombatModifierType.hills]: "from hills",
  [CombatModifierType.health]: "from health penalty",
  [CombatModifierType.forest]: "from forest",
  [CombatModifierType.flanks]: "from flanks",
};

type Props = {
  label: string;
  unitDef: UnitDefChanneled;
  simulationSide: CombatSimulationSide;
  className?: string;
  invertedColors?: boolean;
};

export function CombatInfoSide({
  label,
  simulationSide,
  unitDef,
  className,
  invertedColors,
}: Props) {
  return (
    <div className={clsx(className, "flex flex-col items-center")}>
      <div className="font-semibold">{label}</div>
      <div>{unitDef.name}</div>
      <ImageIcon name={unitDef.id} size="medium" />
      <div className="flex justify-between text-sm">
        Approx. dmg.: <b>{simulationSide.damage}</b>
      </div>
      <div className="flex justify-between text-sm">
        Strength: <b>{simulationSide.strength.toFixed(1)}</b>
      </div>

      <div>
        <div className="text-sm text-center font-semibold mt-1">
          {simulationSide.modifiers.map((modifier) => (
            <div
              key={modifier.type}
              className={
                modifier.value > 0
                  ? invertedColors
                    ? "text-danger"
                    : "text-food-600"
                  : invertedColors
                  ? "text-food-600"
                  : "text-danger"
              }
            >
              {modifier.value > 0 ? "+" : ""}
              {(modifier.value * 100).toFixed()}%{" "}
              {MODIFIER_LABELS[modifier.type]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
