import { bridge } from "@/bridge";
import { useObservable } from "@/utils";
import { Commands } from "./commands";
import { CommandButton, CommandSwitch } from "./components";
import { useUiState } from "./uiState";

export function Toolbar() {
  const turn = useObservable(bridge.game.turn$);

  const uiState = useUiState();

  return (
    <div className="px-2 flex gap-2 items-center py-1">
      <span className="text-xs font-semibold">Turn {turn ?? 1} </span>
      <CommandSwitch
        command={Commands.toggleDebug}
        checked={uiState.debug}
        label="Debug"
      />
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
