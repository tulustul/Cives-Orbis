import { bridge } from "@/bridge";
import { RawUnitDefinition } from "@/core/data.interface";
import { UNITS_DEFINITIONS } from "@/data/products/units";
import { Option, Radio } from "@/ui/components";
import { useSubscription } from "@/utils";
import { useStateRef } from "@/utils/useStateRef";
import { mapUi } from "../mapUi";
import { PlayersList } from "./PlayersList";
import styles from "./UnitsPainter.module.css";

const definitionOptions = UNITS_DEFINITIONS.map((d) => {
  return { label: d.name, value: d } as Option<RawUnitDefinition>;
});

export function UnitsPainter() {
  const [selectedPlayerId, setSelectedPlayerId, selectedPlayerIdRef] =
    useStateRef<number | null>(null);
  const [unitDefinition, setUnitDefinition, unitDefinitionRef] =
    useStateRef<RawUnitDefinition | null>(null);

  useSubscription(mapUi.clickedTile$, (tile) => {
    if (
      !tile ||
      !unitDefinitionRef.current ||
      selectedPlayerIdRef.current === null
    ) {
      return;
    }

    bridge.editor.units.spawn({
      definitionId: unitDefinitionRef.current.id,
      tileId: tile.id,
      playerId: selectedPlayerIdRef.current,
    });
  });

  return (
    <div className={styles.wrapper}>
      <PlayersList
        selectedPlayerId={selectedPlayerId}
        onSelect={setSelectedPlayerId}
      />

      <Radio
        label="Units"
        options={definitionOptions}
        value={unitDefinition}
        onChange={setUnitDefinition}
      />
    </div>
  );
}
