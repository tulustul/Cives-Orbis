import { Panel } from "@/ui/components";
import { AtlasIcon2 } from "../components/AtlasIcon2";
import { useCity } from "./cityViewStore";

export function CityStorage() {
  const city = useCity();

  return (
    <Panel className="p-4">
      <h2 className="text-lg font-bold mb-4">City Storage</h2>

      {city.storage.length === 0 && (
        <div className="text-center text-gray-500">No resources in storage</div>
      )}

      {city.storage.map((item) => (
        <div key={item.resource.id} className="flex items-center gap-2">
          <AtlasIcon2 atlas="resources" name={item.resource.id} scale={0.25} />
          <div className="text-xs font-medium">{item.resource.name}</div>
          <div className="text-xs text-gray-400">
            {item.amount} / {item.limit}
          </div>
          <div className="text-xs text-green-500">+{item.yield}</div>
        </div>
      ))}
    </Panel>
  );
}
