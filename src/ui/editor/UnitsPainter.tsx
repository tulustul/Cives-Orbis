import { bridge } from "@/bridge";
import { Radio } from "@/ui/components";
import { useEntityOptions, useSubscription } from "@/utils";
import { useStateRef } from "@/utils/useStateRef";
import { useState } from "react";
import { mapUi } from "../mapUi";
import { PlayersList } from "./PlayersList";

export function UnitsPainter() {
  const unitOptions = useEntityOptions({ entityType: "unit" });
  const [selectedPlayerId, setSelectedPlayerId, selectedPlayerIdRef] =
    useStateRef<number | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);

  useSubscription(mapUi.clickedTile$, (tile) => {
    if (!tile || !unitId || selectedPlayerIdRef.current === null) {
      return;
    }

    bridge.editor.units.spawn({
      definitionId: unitId,
      tileId: tile.id,
      playerId: selectedPlayerIdRef.current,
    });
  });

  return (
    <div className="flex gap-2 items-start">
      <PlayersList
        selectedPlayerId={selectedPlayerId}
        onSelect={setSelectedPlayerId}
        autoselectFirst
      />

      <Radio
        label="Units"
        options={unitOptions}
        value={unitId}
        onChange={setUnitId}
      />
    </div>
  );
}
