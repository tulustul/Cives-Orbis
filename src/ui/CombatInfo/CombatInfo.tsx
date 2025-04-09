import { useObservable } from "@/utils";
import clsx from "clsx";
import { mapUi } from "../mapUi";
import { CombatInfoSide } from "./CombatInfoSide";

import { OrnateBox } from "../components/OrnateBox";

export function CombatInfo() {
  const combatSimulation = useObservable(mapUi.combatSimulation$);

  if (!combatSimulation) {
    return null;
  }

  const simulation = combatSimulation.simulation;

  const ratio = simulation.attacker.strength / simulation.defender.strength;

  function getResultClass(): string {
    if (ratio > 0.8 && ratio < 1.2) {
      return "bg-warning";
    }
    if (ratio > 1.2) {
      return "bg-success";
    }
    return "bg-danger";
  }

  function getResult(): string {
    if (ratio > 0.8 && ratio < 1.2) {
      return "even";
    }
    if (ratio > 1) {
      if (ratio > 2) {
        return "decisive victory";
      }
      if (ratio > 1.5) {
        return "major victory";
      }
      return "minor victory";
    }
    if (ratio < 0.4) {
      return "decisive defeat";
    }
    if (ratio < 0.7) {
      return "major defeat";
    }
    return "minor defeat";
  }

  return (
    <OrnateBox borderType="small" contentClassName="p-2">
      <div className="flex justify-center mb-2">
        <div
          className={clsx(
            "rounded-md px-4 py-2 text-lg uppercase font-semibold text-amber-100",
            getResultClass(),
          )}
        >
          {getResult()}
        </div>
      </div>

      <div className="flex justify-between gap-6">
        <CombatInfoSide
          label="Attacker"
          unitDef={combatSimulation.attacker.definition}
          simulationSide={simulation.attacker}
        />

        <CombatInfoSide
          label="Defender"
          unitDef={combatSimulation.defender.definition}
          simulationSide={simulation.defender}
          invertedColors
        />
      </div>
    </OrnateBox>
  );
}
