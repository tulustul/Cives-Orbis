import { bridge } from "@/bridge";
import { GrantOrRevoke, Option } from "@/shared";
import { useEffect, useState } from "react";
import {
  Button,
  Multiselect,
  MultiselectAddedOrRemoved,
  MultiselectOnChange,
} from "../components";
import { PlayersList } from "./PlayersList";

const GOLD_OPTIONS = [100, 1000, 10000, 100000];

export function PlayersEditor() {
  const [trackedPlayerId, setTrackedPlayerId] = useState(0);

  useEffect(() => {
    bridge.game.getInfo();
  }, []);

  async function trackPlayer(playerId: number) {
    await bridge.editor.player.trackPlayer(playerId);
    setTrackedPlayerId(playerId);
  }

  return (
    <div className="flex gap-2">
      <PlayersList selectedPlayerId={trackedPlayerId} onSelect={trackPlayer} />
      <TechEditor playerId={trackedPlayerId} />
    </div>
  );
}

type TechEditorProps = {
  playerId: number;
};
function TechEditor({ playerId }: TechEditorProps) {
  const [options, setOptions] = useState<Option<string>[]>([]);
  const [discoveredTechs, setDiscoveredTechs] = useState<string[]>([]);

  useEffect(() => {
    buildOptions();
  }, [playerId]);

  async function buildOptions() {
    const techs = await bridge.technologies.getAll();

    setOptions(
      techs.map((tech) => ({
        label: tech.def.name,
        value: tech.def.id,
      })),
    );

    setDiscoveredTechs(
      techs
        .filter((tech) => tech.state === "discovered")
        .map((tech) => tech.def.id),
    );
  }

  async function grantOrRevoke(change: MultiselectOnChange<string>) {
    const grantMap: Record<MultiselectAddedOrRemoved, GrantOrRevoke> = {
      added: "grant",
      removed: "revoke",
    };

    await bridge.editor.player.grantRevokeTech({
      playerId,
      techId: change.value,
      grantRevoke: grantMap[change.addedOrRemoved],
    });

    await buildOptions();
  }

  function giveGold(amount: number) {
    bridge.editor.player.giveGold({
      playerId,
      amount,
    });
  }

  return (
    <div className="flex gap-4">
      <Multiselect
        label="Techs"
        options={options}
        value={discoveredTechs}
        onChange={grantOrRevoke}
      />
      <div className="flex flex-col gap-2">
        {GOLD_OPTIONS.map((gold) => (
          <Button key={gold} onClick={() => giveGold(gold)}>
            Give {gold} gold
          </Button>
        ))}
      </div>
    </div>
  );
}
