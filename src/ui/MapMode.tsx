import { Panel } from "./components";
import { Minimap } from "./Minimap";
import { NextTurnButton } from "./NextTurnButton";

import { useObservable } from "@/utils";
import { CityView } from "./city";
import { CombatInfo } from "./CombatInfo";
import styles from "./MapMode.module.css";
import { MapSettings } from "./MapSettings";
import { mapUi } from "./mapUi";
import { Toolbar } from "./Toolbar";
import { UnitPanel } from "./UnitPanel";
import { TileUnits } from "./TileUnits";
import { PlayerYields } from "./PlayerYields";
import { TurnsCounter } from "./TurnCounter";
import { bridge } from "@/bridge";
import { SpectatorPanel } from "./SpectatorPanel";

export function MapMode() {
  const city = useObservable(mapUi.selectedCity$);

  const startInfo = useObservable(bridge.game.start$);

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
        </div>

        <div className={styles.toolbar}>
          <Panel corner="top-right">
            <Toolbar />
          </Panel>
        </div>

        <div className={styles.unit}>
          <div className="flex flex-col gap-4">
            <CombatInfo />
            <UnitPanel />
          </div>
          <TileUnits />
        </div>
      </div>
    </>
  );
}
