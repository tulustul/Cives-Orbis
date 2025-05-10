import { bridge } from "@/bridge";
import { GrantOrRevoke, Option } from "@/shared";
import { useEffect, useState } from "react";
import {
  Multiselect,
  MultiselectAddedOrRemoved,
  MultiselectOnChange,
} from "../components";
import { PlayersList } from "./PlayersList";

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

  return (
    <Multiselect
      label="Techs"
      options={options}
      value={discoveredTechs}
      onChange={grantOrRevoke}
    />
  );
}
