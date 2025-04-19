import { Button, Switch, Tab, Tabs } from "@/ui/components";
import { useUiState } from "../uiState";

import { useObservable } from "@/utils";
import { mapUi } from "../mapUi";
import { CitiesEditor } from "./CitiesEditor";
import styles from "./Editor.module.css";
import { PlayersEditor } from "./PlayersEditor";
import { TileEditor } from "./TileEditor";
import { TilesPainter } from "./TilesPainter";
import { UnitsPainter } from "./UnitsPainter";
import { useEffect } from "react";
import { bridge } from "@/bridge";

export function Editor() {
  const fogOfWarEnabled = useObservable(mapUi.fogOfWarEnabled$);

  const uiState = useUiState();

  useEffect(() => {
    return () => {
      mapUi.fogOfWarEnabled = true;
    };
  }, []);

  return (
    <div className={styles.editor}>
      <Tabs>
        <Tab title="Tile">
          <TileEditor />
        </Tab>
        <Tab title="Tiles painter">
          <TilesPainter />
        </Tab>
        <Tab title="Units painter">
          <UnitsPainter />
        </Tab>
        <Tab title="Cities">
          <CitiesEditor />
        </Tab>
        <Tab title="Players">
          <PlayersEditor />
        </Tab>
      </Tabs>

      <div className={styles.options}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <Switch
              label="Fog of war"
              checked={fogOfWarEnabled ?? true}
              onChange={() => (mapUi.fogOfWarEnabled = !fogOfWarEnabled)}
            />
          </div>
          <Button onClick={bridge.editor.player.revealMap}>Reveal map</Button>
          <Button onClick={() => uiState.setMode("map")}>Close</Button>
        </div>
      </div>
    </div>
  );
}
