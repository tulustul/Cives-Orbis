import { Multiselect, Radio } from "@/ui/components";

import { bridge } from "@/bridge";
import { useEntityOptions, useObservable } from "@/utils";
import { useEffect } from "react";
import { mapUi } from "../mapUi";
import {
  CLIMATE_OPTIONS,
  FOREST_OPTIONS,
  LAND_FORM_OPTIONS,
  RIVER_OPTIONS,
  ROAD_OPTIONS,
  SEA_LEVEL_OPTIONS,
  WETLANDS_OPTIONS,
} from "./constants";

export function TileEditor() {
  const tile = useObservable(mapUi.selectedTile$);

  const tileImprovementOptions = useEntityOptions({
    entityType: "tileImprovement",
    allowNull: true,
    sort: true,
  });
  const resourceOptions = useEntityOptions({
    entityType: "resource",
    allowNull: true,
    sort: true,
  });

  useEffect(() => {
    mapUi.enableSelectingTile(true);
    return () => mapUi.enableSelectingTile(false);
  }, []);

  if (!tile) {
    return <div className="text-sm">Select the tile to edit</div>;
  }

  return (
    <div className="flex gap-2 items-start mb-4">
      <Radio
        label="Sea level"
        options={SEA_LEVEL_OPTIONS}
        value={tile.seaLevel}
        onChange={(seaLevel) =>
          bridge.editor.tiles.update({ id: tile!.id, seaLevel })
        }
      />
      <Radio
        label="Land form"
        options={LAND_FORM_OPTIONS}
        value={tile.landForm}
        onChange={(landForm) =>
          bridge.editor.tiles.update({ id: tile!.id, landForm })
        }
      />
      <Radio
        label="Climate"
        options={CLIMATE_OPTIONS}
        value={tile.climate}
        onChange={(climate) =>
          bridge.editor.tiles.update({ id: tile!.id, climate })
        }
      />
      <Radio
        label="Forest"
        options={FOREST_OPTIONS}
        value={tile.forest}
        onChange={(forest) =>
          bridge.editor.tiles.update({ id: tile!.id, forest })
        }
      />
      <Radio
        label="Wetlands"
        options={WETLANDS_OPTIONS}
        value={tile.wetlands}
        onChange={(wetlands) =>
          bridge.editor.tiles.update({ id: tile!.id, wetlands })
        }
      />
      <Radio
        label="Improvements"
        options={tileImprovementOptions}
        value={tile.improvement}
        onChange={(improvement) =>
          bridge.editor.tiles.update({
            id: tile!.id,
            improvement: improvement ?? undefined,
          })
        }
      />
      <Radio
        label="Road"
        options={ROAD_OPTIONS}
        value={tile.road}
        onChange={(road) => bridge.editor.tiles.update({ id: tile!.id, road })}
      />
      <Multiselect
        label="River"
        options={RIVER_OPTIONS}
        value={tile.riverParts}
        onChange={(change) =>
          bridge.editor.tiles.update({
            id: tile!.id,
            riverParts: change.allValues,
          })
        }
      />
      <Radio
        label="Resource"
        options={resourceOptions}
        value={tile.resource?.id ?? null}
        onChange={(resourceId) =>
          bridge.editor.resources.spawn({
            tileId: tile!.id,
            resourceId,
            quantity: 1,
          })
        }
      />
    </div>
  );
}
