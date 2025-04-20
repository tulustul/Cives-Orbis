import { UnitChanneled } from "@/core/serialization/channel";
import clsx from "clsx";
import { AtlasIcon } from "./components/AtlasIcon";
import { mapUi } from "./mapUi";
import styles from "./UnitIcon.module.css";

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
        primaryColor={unit.colors.primary}
        secondaryColor={unit.colors.secondary}
        definitionId={unit.definitionId}
      />
    </div>
  );
}

type RawUnitIconProps = {
  type: string;
  primaryColor: string;
  secondaryColor: string;
  definitionId: string;
  scale?: number;
};
export function RawUnitIcon({
  type,
  primaryColor,
  secondaryColor,
  definitionId,
  scale = 0.5,
}: RawUnitIconProps) {
  return (
    <div className={styles.unit}>
      <AtlasIcon
        className={styles.icon}
        name={`unitBackground-${type}`}
        scale={scale}
        tint={primaryColor}
      />
      <AtlasIcon
        className={styles.icon}
        name={definitionId}
        scale={scale}
        tint={secondaryColor}
      />
    </div>
  );
}
