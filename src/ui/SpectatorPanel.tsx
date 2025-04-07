import { useObservable } from "@/utils";
import { Panel, Switch } from "./components";
import { mapUi } from "./mapUi";
import { PlayersList } from "./editor/PlayersList";
import { useState } from "react";
import { bridge } from "@/bridge";
import { nextTurnService } from "./nextTurn";
import { OrnateBox } from "./components/OrnateBox";

export function SpectatorPanel() {
  const [trackedPlayerId, setTrackedPlayerId] = useState(0);

  const fogOfWarEnabled = useObservable(mapUi.fogOfWarEnabled$) ?? true;
  const autoplay = useObservable(nextTurnService.autoPlay$) ?? false;

  async function trackPlayer(playerId: number) {
    await bridge.player.trackPlayer(playerId);
    setTrackedPlayerId(playerId);
  }

  return (
    <OrnateBox borderType="small">
      <div className="flex flex-col gap-2 p-2">
        <div className="center font-bold">Spectator</div>
        <Switch
          label="Auto turn"
          checked={autoplay}
          onChange={() => nextTurnService.setAutoplay(!autoplay)}
        />
        <Switch
          label="Fog of war"
          checked={fogOfWarEnabled}
          onChange={() => (mapUi.fogOfWarEnabled = !fogOfWarEnabled)}
        />
      </div>

      <PlayersList selectedPlayerId={trackedPlayerId} onSelect={trackPlayer} />
    </OrnateBox>
  );
}
