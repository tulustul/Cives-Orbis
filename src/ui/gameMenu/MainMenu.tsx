import { bridge } from "@/bridge";
import { useUiState } from "@/ui/uiState";
import { useObservable } from "@/utils";
import { PropsWithChildren } from "react";
import { mapUi } from "../mapUi";
import { useMenu } from "./gameMenuStore";

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
      <div className="flex justify-center items-center"></div>
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
      className="py-5 px-10 cursor-pointer font-bold text-xl flex items-center justify-center gap-4 text-white-outline before:grow before:bg-dark before:h-1 not-hover:before:hidden after:grow after:bg-dark after:h-1 not-hover:after:hidden"
      onClick={onClick}
    >
      {children}
    </div>
  );
}
