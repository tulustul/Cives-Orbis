import { bridge } from "@/bridge";
import { importSave, loadGameData } from "@/ui/saving";
import { Button, Modal, Spinner } from "@/ui/components";
import { useRef, useState } from "react";
import { mapUi } from "../mapUi";
import { useUiState } from "../uiState";
import { useMenu } from "./gameMenuStore";
import { MenuScreen } from "./MenuScreen";
import { SavesList } from "./SavesList";

export function LoadMenu() {
  const [waiting, setWaiting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const menu = useMenu();
  const uiState = useUiState();

  async function load(saveName: string) {
    uiState.setMode("loading");
    mapUi.destroy();

    const data = loadGameData(saveName);
    if (!data) {
      return;
    }

    setWaiting(true);

    await bridge.game.load(data);

    menu.hide();
    setWaiting(false);
  }

  async function _import(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (!files) {
      return;
    }

    await importSave(files[0]);

    // this.savesListComponent.refresh();
  }

  return (
    <MenuScreen
      title="Load the game"
      extraActions={
        <Button onClick={() => fileInputRef.current?.click()}>Import</Button>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        hidden
        onChange={(event) => _import(event.nativeEvent)}
      />

      <SavesList onSelect={load} action="Load" />

      {waiting && (
        <Modal>
          <div className="center">
            <h2>Loading map</h2>
            <Spinner />
          </div>
        </Modal>
      )}
    </MenuScreen>
  );
}
