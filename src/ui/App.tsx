import { useEffect, useState } from "react";
import { loadAssets } from "../renderer/assets";
import { EditorMode } from "./EditorMode";
import { GameCanvas } from "./GameCanvas";
import { MapMode } from "./MapMode";
import { GameMenu, useMenu } from "./gameMenu";
import { CitiesLayer } from "./mapElements/CitiesLayer";
import { useUiState } from "./uiState";

import styles from "./App.module.css";
import { LoadingScreen } from "./LoadingScreen";
import { NotificationModal } from "./NotificationModal";
import { EconomyOverview } from "./economyOverview";
import { Stats } from "./stats";
import { TechTree } from "./techs";

function App() {
  const [loading, setLoading] = useState(true);

  const uiState = useUiState();
  const menu = useMenu();

  useEffect(() => {
    loadAssets().then(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="loader">
        <div className="panel">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  function getContent() {
    if (uiState.mode === "none") {
      return null;
    }

    if (uiState.mode === "loading") {
      return <LoadingScreen />;
    }

    return (
      <div className={styles.wrapper}>
        <div className={styles.mapMode}>
          <MapMode />
        </div>
        {uiState.mode === "editor" && <EditorMode />}
        {uiState.view === "stats" && <Stats />}
        {uiState.view === "economyOverview" && <EconomyOverview />}
        {uiState.view === "techTree" && <TechTree />}
        <NotificationModal />
      </div>
    );
  }

  return (
    <>
      {menu.enabled && uiState.mode !== "loading" && (
        <GameMenu showLogo={uiState.mode === "none"} />
      )}
      <GameCanvas />
      {uiState.mode === "map" && <CitiesLayer />}
      {getContent()}
    </>
  );
}

export default App;
