import { Climate, LandForm, SeaLevel } from "@/shared";
import { useObservable } from "@/utils";
import { AtlasIcon2 } from "./components/AtlasIcon2";
import { OrnateBox } from "./components/OrnateBox";
import { mapUi } from "./mapUi";

const CLIMATES: Record<Climate, string> = {
  [Climate.arctic]: "Arctic",
  [Climate.tundra]: "Tundra",
  [Climate.temperate]: "Temperate",
  [Climate.tropical]: "Tropical",
  [Climate.desert]: "Desert",
  [Climate.savanna]: "Savanna",
};

const LAND_FORMS: Record<LandForm, string> = {
  [LandForm.plains]: "Plains",
  [LandForm.hills]: "Hills",
  [LandForm.mountains]: "Mountains",
};

const SEA_LEVELS: Record<SeaLevel, string> = {
  [SeaLevel.none]: "None",
  [SeaLevel.shallow]: "Shallow Water",
  [SeaLevel.deep]: "Deep Water",
};

export function TileDetails() {
  const details = useObservable(mapUi.tileHoverDetails$);

  if (!details) {
    return null;
  }

  function getTileName(): string {
    if (!details) {
      return "";
    }

    if (details.tile.seaLevel !== SeaLevel.none) {
      return SEA_LEVELS[details.tile.seaLevel];
    }

    if (details.tile.landForm === LandForm.mountains) {
      return "Mountains";
    }

    return `${CLIMATES[details.tile.climate]} ${
      LAND_FORMS[details.tile.landForm]
    }`;
  }

  function getYields() {
    if (!details) {
      return null;
    }

    return (
      <>
        {details.tile.yields.food > 0 && (
          <div className="text-food-600 font-semibold">
            {details.tile.yields.food} food
          </div>
        )}
        {details.tile.yields.production > 0 && (
          <div className="text-production-600 font-semibold">
            {details.tile.yields.production} production
          </div>
        )}
        {details.tile.yields.gold > 0 && (
          <div className="text-gold font-semibold">
            {details.tile.yields.gold} gold
          </div>
        )}
        {details.tile.yields.culture > 0 && (
          <div className="text-culture">
            {details.tile.yields.culture} culture
          </div>
        )}
      </>
    );
  }

  function getResourceDescription() {
    const resource = details?.tile.resource;
    if (!resource) {
      return null;
    }

    return (
      <div className="flex flex-col gap-1 items-center">
        <AtlasIcon2 name={resource.id} atlas="resources" scale={0.5} />
        <div>{resource.name}</div>
        <div>{resource.quantity.toFixed(1)} units</div>
      </div>
    );
  }

  return (
    <OrnateBox borderType="small">
      <div className="p-2 flex flex-col gap-1 items-center">
        <div>{getTileName()}</div>
        {details.tile.forest && (
          <div className="text-xs font-light">Forest</div>
        )}
        {details.tile.riverParts.length > 0 && (
          <div className="text-xs font-light">Has river access</div>
        )}
        {details.tile.road !== null && (
          <div className="text-xs font-light">Has road</div>
        )}
        {getYields()}
        {getResourceDescription()}
        <div className="text-xs font-light">
          x: {details.tile.x}; y: {details.tile.y}
        </div>
      </div>
    </OrnateBox>
  );
}
