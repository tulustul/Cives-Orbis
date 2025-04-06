import { CityDetailsChanneled } from "@/core/serialization/channel";
import { CityBuildings } from "./CityBuldings";
import { CityMainPanel } from "./CityMainPanel";
import { CityName } from "./CityName";
import { Background } from "@/ui/components";
import { useEffect } from "react";
import { mapUi } from "../mapUi";

type Props = {
  city: CityDetailsChanneled;
};
export function CityView({ city }: Props) {
  console.log(city);
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

  return (
    <div className="flex w-full h-full absolute">
      <Background className="text-white pointer-events-auto border-gray-900 border-r-3 w-80">
        <CityMainPanel city={city} />
      </Background>

      <div className="grow">
        <CityName city={city} />
      </div>

      <Background className="text-white pointer-events-auto border-gray-900 border-l-3 w-80">
        <CityBuildings city={city} />
      </Background>
    </div>
  );
}
