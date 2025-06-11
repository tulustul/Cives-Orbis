import { CityDetailsChanneled } from "@/shared";
import { CityBuildings } from "./CityBuldings";
import { CityMainPanel } from "./CityMainPanel";
import { CityName } from "./CityName";
import { Background } from "@/ui/components";
import { useEffect } from "react";
import { mapUi } from "../mapUi";
import { useCityView } from "./cityViewStore";
import { useObservable } from "@/utils";

type Props = {
  city: CityDetailsChanneled;
};
export function CityView({ city }: Props) {
  const cityView = useCityView();
  const tile = useObservable(mapUi.clickedTileDetails$);

  useEffect(() => {
    const wereYieldsEnabled = mapUi.yieldsEnabled;
    if (!wereYieldsEnabled) {
      mapUi.yieldsEnabled = true;
    }

    return () => {
      if (!wereYieldsEnabled) {
        mapUi.yieldsEnabled = false;
      }
    };
  }, []);

  useEffect(() => {
    cityView.setCity(city);
    return () => {
      cityView.clear();
    };
  }, [city]);

  useEffect(() => {
    if (tile) {
      cityView.handleTileClick(tile);
    }
  }, [tile]);

  if (!cityView.city) {
    return null;
  }

  return (
    <div className="flex w-full h-full absolute">
      <TileClickHandler />
      <Background className="text-white pointer-events-auto border-gray-900 border-r-3 w-80">
        <CityMainPanel />
      </Background>

      <div className="grow">
        <CityName />
      </div>

      <Background className="text-white pointer-events-auto border-gray-900 border-l-3 w-80">
        <CityBuildings />
      </Background>
    </div>
  );
}

function TileClickHandler() {
  const { handleTileClick } = useCityView();
  const tile = useObservable(mapUi.clickedTileDetails$);

  useEffect(() => {
    if (tile) {
      handleTileClick(tile);
    }
  }, [tile]);

  return null;
}
