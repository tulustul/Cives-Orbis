import { saveGameData } from "@/saving";
import { useState } from "react";
import { SavesList } from "./SavesList";
import { useMenu } from "./gameMenuStore";
import { bridge } from "@/bridge";
import { Button } from "../components";
import { MenuScreen } from "./MenuScreen";

export function SaveMenu() {
  const [saveName, setSaveName] = useState("");
  const menu = useMenu();

  async function save(saveName: string) {
    const data = await bridge.game.dump();
    saveGameData(data, saveName);
    menu.hide();
  }

  return (
    <MenuScreen title="Save the game">
      <label className="flex items-center gap-4">
        <input
          type="text"
          className="bg-gray-700 rounded-md py-1 px-2 grow"
          placeholder="Save name"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
        />
        <Button disabled={!saveName} onClick={() => save(saveName)}>
          Save as new
        </Button>
      </label>

      <SavesList action="Save" onSelect={save} />
    </MenuScreen>
  );
}
