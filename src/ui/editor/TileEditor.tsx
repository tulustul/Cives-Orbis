import { Multiselect, Radio } from "@/ui/components";

import { bridge } from "@/bridge";
import { useObservable } from "@/utils";
import { useEffect } from "react";
import { mapUi } from "../mapUi";
import {
  CLIMATE_OPTIONS,
  FOREST_OPTIONS,
  IMPROVEMENT_OPTIONS,
  LAND_FORM_OPTIONS,
  RESOURCE_OPTIONS,
  RIVER_OPTIONS,
  ROAD_OPTIONS,
  SEA_LEVEL_OPTIONS,
  WETLANDS_OPTIONS,
} from "./constants";

export function TileEditor() {
  const tile = useObservable(mapUi.selectedTile$);

  useEffect(() => {
    mapUi.enableSelectingTile(true);
    return () => mapUi.enableSelectingTile(false);
  }, []);

  if (!tile) {
    return <div>Select the tile to edit</div>;
  }

  return (
    <div className="flex gap-4 items-start mb-4">
      <Radio
        label="Sea level"
        options={SEA_LEVEL_OPTIONS}
        value={tile.seaLevel}
        onChange={(seaLevel) => bridge.tiles.update({ id: tile!.id, seaLevel })}
      />
      <Radio
        label="Land form"
        options={LAND_FORM_OPTIONS}
        value={tile.landForm}
        onChange={(landForm) => bridge.tiles.update({ id: tile!.id, landForm })}
      />
      <Radio
        label="Climate"
        options={CLIMATE_OPTIONS}
        value={tile.climate}
        onChange={(climate) => bridge.tiles.update({ id: tile!.id, climate })}
      />
      <Radio
        label="Forest"
        options={FOREST_OPTIONS}
        value={tile.forest}
        onChange={(forest) => bridge.tiles.update({ id: tile!.id, forest })}
      />
      <Radio
        label="Wetlands"
        options={WETLANDS_OPTIONS}
        value={tile.wetlands}
        onChange={(wetlands) => bridge.tiles.update({ id: tile!.id, wetlands })}
      />
      <Radio
        label="Improvements"
        options={IMPROVEMENT_OPTIONS}
        value={tile.improvement}
        onChange={(improvement) =>
          bridge.tiles.update({ id: tile!.id, improvement })
        }
      />
      <Radio
        label="Road"
        options={ROAD_OPTIONS}
        value={tile.road}
        onChange={(road) => bridge.tiles.update({ id: tile!.id, road })}
      />
      <Multiselect
        label="River"
        options={RIVER_OPTIONS}
        value={tile.riverParts}
        onChange={(riverParts) =>
          bridge.tiles.update({ id: tile!.id, riverParts })
        }
      />
      <Radio
        label="Resource"
        options={RESOURCE_OPTIONS}
        value={tile.resource?.id ?? null}
        onChange={(resourceId) =>
          bridge.tiles.setResource({
            tileId: tile!.id,
            resourceId,
            quantity: 1,
          })
        }
      />
    </div>
  );
}
