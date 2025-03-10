import {
  UnitChanneled,
  UnitDetailsChanneled,
} from "@/core/serialization/channel";
import { AtlasIcon } from "./components/AtlasIcon";
import styles from "./UnitIcon.module.css";
import clsx from "clsx";
import { mapUi } from "./mapUi";
import { UnitType } from "@/core/data.interface";

type Props = {
  unit: UnitChanneled;
  isSelected?: boolean;
};

export function UnitIcon({ unit, isSelected }: Props) {
  function select() {
    mapUi.selectUnit(unit.id);
  }

  return (
    <div
      className={clsx(styles.wrapper, {
        [styles.isSelected]: isSelected,
        [styles.noMoves]: unit.actionPointsLeft === 0,
      })}
      onClick={select}
    >
      <RawUnitIcon
        type={unit.type}
        cssColor={unit.cssColor}
        definitionId={unit.definitionId}
      />
    </div>
  );
}

type RawUnitIconProps = {
  type: string;
  cssColor: string;
  definitionId: string;
};
export function RawUnitIcon({
  type,
  cssColor,
  definitionId,
}: RawUnitIconProps) {
  return (
    <div className={styles.unit}>
      <AtlasIcon
        className={styles.icon}
        name={`unitBackground-${type}`}
        scale={0.5}
        tint={cssColor}
      />
      <AtlasIcon className={styles.icon} name={definitionId} scale={0.5} />
    </div>
  );
}
