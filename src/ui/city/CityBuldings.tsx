import { ImageIcon } from "../components";
import { EntityTooltip } from "../entity";
import { useCity } from "./cityViewStore";

export function CityBuildings() {
  const city = useCity();

  return (
    <>
      <div className="text-xl text-center my-4">Buildings</div>

      {city.buildings.length === 0 && (
        <div className="py-2 px-4 text-center font-thin">No buildings</div>
      )}

      {city.buildings.map((building) => (
        <div
          key={building.id}
          className="border-t-2 border-primary-500 cursor-pointer hover:bg-primary-500 last:border-b-2"
        >
          <EntityTooltip
            entityId={building.id}
            placementHorizontal="left"
            placementVertical="center"
          >
            <div className="h-12 px-1 flex items-center justify-between">
              <ImageIcon name={building.id} size="small" frameType="building" />
              <div className="py-2 px-4">{building.name}</div>
            </div>
          </EntityTooltip>
        </div>
      ))}
    </>
  );
}
