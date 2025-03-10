import { CityDetailsChanneled } from "@/core/serialization/channel";

import { mapUi } from "../mapUi";
import { Button } from "../components";

type Props = {
  city: CityDetailsChanneled;
};
export function CityName({ city }: Props) {
  return (
    <div className="flex flex-col items-center pt-5">
      <Button
        className="pointer-events-auto mb-8"
        onClick={() => mapUi.selectCity(null)}
      >
        Return
      </Button>
      <div
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(20,20,20,0.8), transparent)",
        }}
      >
        <div
          className="w-full h-1"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(20,20,20), transparent)",
          }}
        />
        <div className="text-5xl text-white font-light px-30 py-4">
          {city.name}
        </div>
        <div
          className="w-full h-1"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(20,20,20), transparent)",
          }}
        />
      </div>
    </div>
  );
}
