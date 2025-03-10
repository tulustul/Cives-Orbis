import { deleteSaveGame, exportSave, listSaveGames } from "@/saving";
import { IconDownload, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Button, IconButton } from "../components";

type Props = {
  action: string;
  onSelect: (save: string) => void;
};

export function SavesList({ onSelect, action }: Props) {
  const [saves, setSaves] = useState<string[]>([]);

  useEffect(refresh, []);

  function refresh() {
    setSaves(listSaveGames());
  }

  function _delete(save: string) {
    deleteSaveGame(save);
    refresh();
  }

  if (!saves.length) {
    return <div className="font-light text-center">No saves yet</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {saves.map((save) => (
        <div
          key={save}
          className="flex items-center bg-gray-900/50 p-2 rounded-md"
        >
          <div className="font-bold grow">{save}</div>
          <div className="flex gap-2 items-center">
            <Button onClick={() => onSelect(save)}>{action}</Button>
            <IconButton icon={IconDownload} onClick={() => exportSave(save)} />
            <IconButton icon={IconTrash} onClick={() => _delete(save)} />
          </div>
        </div>
      ))}
    </div>
  );
}
