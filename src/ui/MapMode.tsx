import { Panel } from "./components";
import { Minimap } from "./Minimap";
import { NextTurnButton } from "./NextTurnButton";

import { bridge } from "@/bridge";
import { useObservable } from "@/utils";
import { CityView } from "./city";
import { CombatInfo } from "./CombatInfo";
import styles from "./MapMode.module.css";
import { MapSettings } from "./MapSettings";
import { mapUi } from "./mapUi";
import { PlayerYields } from "./PlayerYields";
import { Research } from "./Research";
import { SpectatorPanel } from "./SpectatorPanel";
import { TileDetails } from "./TileDetails";
import { TileUnits } from "./TileUnits";
import { Toolbar } from "./Toolbar";
import { TurnsCounter } from "./TurnCounter";
import { UnitPanel } from "./UnitPanel";
import { DebugAi } from "./debug";
import { useUiState } from "./uiState";

export function MapMode() {
  const city = useObservable(mapUi.selectedCity$);

  const startInfo = useObservable(bridge.game.start$);

  const uiState = useUiState();

  return (
    <>
      {city && <CityView city={city} />}
      <TurnsCounter />
      <div
        className={styles.layout}
        style={{ visibility: city ? "hidden" : "visible" }}
      >
        <div className={styles.minimap}>
          <MapSettings />
          <div className="ml-4 flex flex-col items-end gap-5">
            <TileDetails />
            {startInfo?.aiOnly && <SpectatorPanel />}
            <Panel corner="bottom-right">
              <div style={{ display: "flex", flexDirection: "column" }}>
                <NextTurnButton />
                <Minimap />
              </div>
            </Panel>
          </div>
        </div>

        <div className={styles.yields}>
          <Panel corner="top-left">
            <PlayerYields />
          </Panel>
          <Research />

          {uiState.debug && <DebugAi />}
        </div>

        <div className={styles.toolbar}>
          <Panel corner="top-right">
            <Toolbar />
          </Panel>
        </div>

        <div className={styles.unit}>
          <div className="flex flex-col gap-4 items-start">
            <CombatInfo />
            <UnitPanel />
          </div>
          <TileUnits />
        </div>
      </div>
    </>
  );
}
