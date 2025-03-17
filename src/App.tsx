import { useEffect, useState } from "react";
import { loadAssets } from "./renderer/assets";
import { GameCanvas } from "./ui/GameCanvas";
import { MapMode } from "./ui/MapMode";
import { useUiState } from "./ui/uiState";
import { GameMenu, useMenu } from "./ui/gameMenu";
import { CitiesLayer } from "./ui/mapElements/CitiesLayer";
import { EditorMode } from "./ui/EditorMode";

import styles from "./App.module.css";
import { Stats } from "./ui/stats";
import { LoadingScreen } from "./ui/LoadingScreen";
import { TechTree } from "./ui/techTree";

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
        {uiState.view === "techTree" && <TechTree />}
      </div>
    );
  }

  return (
    <>
      {menu.enabled && uiState.mode !== "loading" && <GameMenu />}
      <GameCanvas />
      {uiState.mode === "map" && <CitiesLayer />}
      {getContent()}
    </>
  );
}

export default App;
