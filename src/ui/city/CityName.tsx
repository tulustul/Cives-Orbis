import { Button } from "../components";
import { mapUi } from "../mapUi";
import { useCity } from "./cityViewStore";

export function CityName() {
  const city = useCity();

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
        <div className="font-serif text-5xl text-white font-light px-30 py-4">
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
