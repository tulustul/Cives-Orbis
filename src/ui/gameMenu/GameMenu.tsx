import titleImage from "@/assets/title.png";
import { OrnateBox } from "../components/OrnateBox";
import { useMenu } from "./gameMenuStore";
import { LoadMenu } from "./LoadMenu";
import { MainMenu } from "./MainMenu";
import { NewGameMenu } from "./NewGameMenu";
import { SaveMenu } from "./SaveMenu";
import clsx from "clsx";

type Props = {
  showLogo?: boolean;
};
export function GameMenu({ showLogo }: Props) {
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
      className={clsx(
        "absolute w-full h-full flex flex-col gap-10 items-center pt-10 z-100 bg-black/60",
        showLogo ? "justify-start" : "justify-center",
      )}
      style={{
        backdropFilter: "blur(5px)",
      }}
    >
      {showLogo && (
        <img
          src={titleImage}
          alt="Cives Orbis"
          className="w-100"
          style={{
            filter: "drop-shadow(0px 0px 5px black)",
          }}
        />
      )}
      <OrnateBox className="w-[500px]">{getContent()}</OrnateBox>
    </div>
  );
}
