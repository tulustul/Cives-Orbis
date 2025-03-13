import { bridge } from "@/bridge";
import { useMenu } from "./gameMenu";
import { useUiState } from "./uiState";
import { useObservable } from "@/utils";
import { Button, CommandButton } from "./components";
import { Commands } from "./commands";

export function Toolbar() {
  const menu = useMenu();
  const uiState = useUiState();
  const turn = useObservable(bridge.game.turn$);

  return (
    <div className="px-2 flex gap-2 items-center py-1">
      <span>Turn {turn ?? 1} </span>
      <CommandButton command={Commands.showStats} tooltip="Statistics">
        Stats
      </CommandButton>
      <Button onClick={() => uiState.setMode("editor")}>Editor</Button>
      <Button onClick={menu.show}>Menu</Button>
    </div>
  );
}
