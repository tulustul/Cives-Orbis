import { useObservable } from "@/utils";
import clsx from "clsx";
import { mapUi } from "../mapUi";
import { CombatInfoSide } from "./CombatInfoSide";

import { Panel } from "@/ui/components";
import styles from "./CombatInfo.module.css";

export function CombatInfo() {
  const combatSimulation = useObservable(mapUi.combatSimulation$);

  if (!combatSimulation) {
    return null;
  }

  const simulation = combatSimulation.simulation;

  const ratio = simulation.attacker.strength / simulation.defender.strength;

  function getResultClass(): string {
    if (ratio > 0.8 && ratio < 1.2) {
      return styles.even;
    }
    if (ratio > 1.2) {
      return styles.victory;
    }
    return styles.defeat;
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
    <Panel className={styles.combatInfo}>
      <div className="flex justify-center mb-2">
        <div className={clsx(styles.resultInner, getResultClass())}>
          {getResult()}
        </div>
      </div>

      <div className={styles.sides}>
        <CombatInfoSide
          label="Attacker"
          unitDef={combatSimulation.attacker.definition}
          simulationSide={simulation.attacker}
        />

        <CombatInfoSide
          className={styles.invertedColors}
          label="Defender"
          unitDef={combatSimulation.defender.definition}
          simulationSide={simulation.defender}
        />
      </div>
    </Panel>
  );
}
