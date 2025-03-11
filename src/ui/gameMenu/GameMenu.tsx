import { Panel } from "@/ui/components";
import { useMenu } from "./gameMenuStore";
import { MainMenu } from "./MainMenu";
import { NewGameMenu } from "./NewGameMenu";
import { LoadMenu } from "./LoadMenu";
import { SaveMenu } from "./SaveMenu";

export function GameMenu() {
  const menu = useMenu();

  function getContent() {
    if (menu.view === "main-menu") {
      return <MainMenu />;
    }
    if (menu.view === "new-game") {
      return <NewGameMenu />;
    }
    if (menu.view === "load") {
      return <LoadMenu />;
    }
    if (menu.view === "save") {
      return <SaveMenu />;
    }
  }

  return (
    <div className="absolute w-full h-full flex items-center justify-center z-10 bg-black/70">
      <Panel className="w-[500px]">{getContent()}</Panel>
    </div>
  );
}
