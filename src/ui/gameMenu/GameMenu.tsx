import { Panel } from "@/ui/components";
import { useMenu } from "./gameMenuStore";
import { MainMenu } from "./MainMenu";
import { NewGameMenu } from "./NewGameMenu";
import { LoadMenu } from "./LoadMenu";
import { SaveMenu } from "./SaveMenu";
import titleImage from "@/assets/title.png";
import { OrnateBox } from "../components/OrnateBox";

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
    <div
      className="absolute w-full h-full flex flex-col gap-10 items-center justify-start pt-10 z-10 bg-black/80"
      style={{
        backdropFilter: "blur(5px)",
      }}
    >
      <img
        src={titleImage}
        alt="Cives Orbis"
        className="w-120"
        style={{
          filter: "drop-shadow(0px 0px 5px black)",
        }}
      />
      <OrnateBox className="w-[500px]">{getContent()}</OrnateBox>
    </div>
  );
}
