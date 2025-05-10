import { bridge } from "@/bridge";
import { Option } from "@/shared";
import { Button, Radio, Switch } from "@/ui/components";
import { useEffect, useState } from "react";
import { useUiState } from "../uiState";
import { useMenu } from "./gameMenuStore";
import { MenuScreen } from "./MenuScreen";
import { mapUi } from "../mapUi";

type MapSize = {
  width: number;
  height: number;
  players: number;
};

const MAP_SIZES_OPTIONS: Option<MapSize>[] = [
  { label: "Tiny", value: { width: 25, height: 20, players: 2 } },
  { label: "Small", value: { width: 35, height: 25, players: 4 } },
  { label: "Medium", value: { width: 50, height: 40, players: 6 } },
  { label: "Large", value: { width: 70, height: 55, players: 8 } },
  { label: "Huge", value: { width: 100, height: 70, players: 10 } },
];

const SEA_LEVELS_OPTIONS: Option<number>[] = [
  { label: "Very low", value: -0.3 },
  { label: "Low", value: -0.1 },
  { label: "Medium", value: 0 },
  { label: "High", value: 0.1 },
  { label: "Very high", value: 0.2 },
];

export function NewGameMenu() {
  const uiState = useUiState();
  const menu = useMenu();

  const [mapSize, setMapSize] = useState<MapSize>(MAP_SIZES_OPTIONS[2].value);
  const [aiOnly, setAiOnly] = useState(false);
  const [seaLevel, setSeaLevel] = useState<number>(SEA_LEVELS_OPTIONS[2].value);
  const [playersCount, setPlayersCount] = useState(
    MAP_SIZES_OPTIONS[2].value.players,
  );

  useEffect(() => {
    setPlayersCount(mapSize.players);
  }, [mapSize]);

  async function start() {
    uiState.setMode("loading");
    mapUi.destroy();

    const humanPlayersCount = aiOnly ? 0 : 1;
    await bridge.game.new({
      aiPlayersCount: playersCount - humanPlayersCount,
      width: mapSize.width,
      height: mapSize.height,
      humanPlayersCount,
      seaLevel: seaLevel,
      resources: 0.2,
      uniformity: 0.5,
    });

    menu.hide();
  }
  return (
    <MenuScreen
      title="New game"
      extraActions={
        <Switch checked={aiOnly} label="AI only" onChange={setAiOnly} />
      }
    >
      <div className="flex justify-center items-start gap-8">
        <Radio
          label="Map size"
          options={MAP_SIZES_OPTIONS}
          value={mapSize}
          onChange={setMapSize}
        />

        <Radio
          label="Sea level"
          options={SEA_LEVELS_OPTIONS}
          value={seaLevel}
          onChange={setSeaLevel}
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="font-bold text-center">
          Players count: {playersCount}
        </div>

        <input
          className="accent-success/50 outline-0"
          type="range"
          min={1}
          max={16}
          value={playersCount}
          onChange={(e) => setPlayersCount(Number(e.target.value))}
        />
      </div>

      <div className="flex justify-center mt-4">
        <Button onClick={start}>Start a new game</Button>
      </div>
    </MenuScreen>
  );
}
