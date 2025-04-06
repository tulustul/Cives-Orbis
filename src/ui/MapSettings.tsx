import { useObservable } from "@/utils";
import { Panel, Switch } from "./components";
import { mapUi } from "./mapUi";

export function MapSettings() {
  const gridEnabled = useObservable(mapUi.gridEnabled$);
  const yieldsEnabled = useObservable(mapUi.yieldsEnabled$);
  const resourcesEnabled = useObservable(mapUi.resourcesEnabled$);
  const politicsEnabled = useObservable(mapUi.politicsEnabled$);

  return (
    <Panel className="p-2 flex flex-col gap-2">
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
    </Panel>
  );
}
