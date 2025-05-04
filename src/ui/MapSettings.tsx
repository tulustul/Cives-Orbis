import { useObservable } from "@/utils";
import { Switch } from "./components";
import { OrnateBox } from "./components/OrnateBox";
import { mapUi } from "./mapUi";

export function MapSettings() {
  const gridEnabled = useObservable(mapUi.gridEnabled$);
  const yieldsEnabled = useObservable(mapUi.yieldsEnabled$);
  const resourcesEnabled = useObservable(mapUi.resourcesEnabled$);
  const politicsEnabled = useObservable(mapUi.politicsEnabled$);
  const unitsEnabled = useObservable(mapUi.unitsEnabled$);

  return (
    <OrnateBox borderType="small">
      <div className="flex flex-col gap-1 px-1 py-3">
        <Switch
          label="Grid"
          checked={gridEnabled ?? true}
          onChange={() => (mapUi.gridEnabled = !gridEnabled)}
        />
        <Switch
          label="Yields"
          checked={yieldsEnabled ?? true}
          onChange={() => (mapUi.yieldsEnabled = !yieldsEnabled)}
        />
        <Switch
          label="Resources"
          checked={resourcesEnabled ?? true}
          onChange={() => (mapUi.resourcesEnabled = !resourcesEnabled)}
        />
        <Switch
          label="Politics"
          checked={politicsEnabled ?? true}
          onChange={() => (mapUi.politicsEnabled = !politicsEnabled)}
        />
        <Switch
          label="Units"
          checked={unitsEnabled ?? true}
          onChange={() => (mapUi.unitsEnabled = !unitsEnabled)}
        />
      </div>
    </OrnateBox>
  );
}
