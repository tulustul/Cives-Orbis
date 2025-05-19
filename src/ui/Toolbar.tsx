import { bridge } from "@/bridge";
import { useObservable } from "@/utils";
import { Commands } from "./commands";
import { CommandButton } from "./components";

export function Toolbar() {
  const turn = useObservable(bridge.game.turn$);

  return (
    <div className="px-2 flex gap-2 items-center py-1">
      <span>Turn {turn ?? 1} </span>
      <CommandButton
        command={Commands.showEconomyOverview}
        tooltip="Economy overview"
      >
        Economy
      </CommandButton>
      <CommandButton command={Commands.showStats} tooltip="Statistics">
        Stats
      </CommandButton>
      <CommandButton command={Commands.showTechTree} tooltip="Technologies">
        Techs
      </CommandButton>
      <CommandButton command={Commands.toggleEditor}>Editor</CommandButton>
      <CommandButton command={Commands.openMenu}>Menu</CommandButton>
    </div>
  );
}
