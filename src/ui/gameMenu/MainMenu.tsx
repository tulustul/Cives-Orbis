import { bridge } from "@/bridge";
import { useUiState } from "@/ui/uiState";
import { useObservable } from "@/utils";
import { PropsWithChildren } from "react";
import { useMenu } from "./gameMenuStore";
import { mapUi } from "../mapUi";

export function MainMenu() {
  const uiState = useUiState();
  const menu = useMenu();

  const startInfo = useObservable(bridge.game.start$);

  async function start(aiOnly: boolean) {
    mapUi.destroy();

    await bridge.game.new({
      aiPlayersCount: 5,
      width: 30,
      height: 20,
      humanPlayersCount: aiOnly ? 0 : 1,
      resources: 0.2,
      seaLevel: -0.1,
      uniformity: 0.5,
    });

    menu.hide();

    uiState.setMode("map");
  }

  return (
    <>
      <Item onClick={() => start(false)}>Quick Start</Item>
      <Item onClick={() => menu.setView("new-game")}>New</Item>
      <Item onClick={() => start(true)}>AI match</Item>
      <Item onClick={() => menu.setView("load")}>Load</Item>
      {startInfo && (
        <>
          <Item onClick={() => menu.setView("save")}>Save</Item>
          <Item onClick={menu.hide}>Return</Item>
        </>
      )}
    </>
  );
}

type ItemProps = PropsWithChildren & {
  onClick: () => void;
};
function Item({ children, onClick }: ItemProps) {
  return (
    <div
      className="p-5 text-center cursor-pointer hover:bg-gray-700/40 font-bold text-xl"
      onClick={onClick}
    >
      {children}
    </div>
  );
}
