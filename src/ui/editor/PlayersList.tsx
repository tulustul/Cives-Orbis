import clsx from "clsx";
import { useEffect, useState } from "react";
import { PlayerChanneled } from "@/core/serialization/channel";
import { bridge } from "@/bridge";

type Props = {
  selectedPlayerId: number | null;
  onSelect: (id: number) => void;
  autoselectFirst?: boolean;
};

export function PlayersList({
  selectedPlayerId,
  onSelect,
  autoselectFirst,
}: Props) {
  const [players, setPlayers] = useState<PlayerChanneled[]>([]);

  useEffect(() => {
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    const players = await bridge.game.getAllPlayers();
    setPlayers(players);
    if (autoselectFirst && players.length) {
      onSelect(players[0].id);
    }
  }

  if (!players.length) {
    return null;
  }

  return (
    <ul className="overflow-y-auto max-h-[250px] scrollbar-thin">
      {players.map((player) => (
        <li
          key={player.id}
          className={clsx(
            "flex gap-2 items-center justify-between mb-1 px-2 py-1 cursor-pointer rounded-md",
            player.id === selectedPlayerId
              ? "bg-amber-100"
              : "hover:bg-amber-100/50",
          )}
          onClick={() => onSelect(player.id)}
        >
          <span className="text-sm">{player.name}</span>
          <div
            className="w-5 h-5 rounded-full border-6 box-border"
            style={{
              backgroundColor: player.colors.secondary,
              borderColor: player.colors.primary,
            }}
          />
        </li>
      ))}
    </ul>
  );
}
