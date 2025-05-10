const savesKeyPrefix = "saves:";
const listKey = "savesList";

export function saveGameData(data: string, saveName: string) {
  storeData(saveName, data);
}

export function loadGameData(saveName: string): string | null {
  const data = getSave(saveName);
  if (!data) {
    console.error(`No save with name ${saveName}`);
    return null;
  }
  return data;
}

export function deleteSaveGame(saveName: string) {
  const saveGames = listSaveGames();
  if (!saveGames.includes(saveName)) {
    console.error(`No save with name ${saveName}`);
    return;
  }

  localStorage.removeItem(`${savesKeyPrefix}${saveName}`);

  const index = saveGames.indexOf(saveName);
  saveGames.splice(index, 1);
  saveList(saveGames);
}

export function listSaveGames(): string[] {
  const data = localStorage.getItem(listKey);
  if (!data) {
    return [];
  }
  return JSON.parse(data) || [];
}

export function exportSave(saveName: string) {
  const data = getSave(saveName);
  if (!data) {
    return;
  }
  const blob = new Blob([data], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${saveName}.json`;
  a.click();
}

export async function importSave(file: File) {
  const extension = ".json";
  const filename = file.name;

  if (!filename.endsWith(extension)) {
    return;
  }

  const originalName = filename.slice(0, -extension.length);
  let name = originalName;

  const saves = listSaveGames();

  let i = 1;
  while (saves.includes(name)) {
    name = `${originalName}_${i++}`;
  }

  const data = await readFile(file);
  storeData(name, data);
}

// private functions below

async function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      if (reader.result) {
        resolve(reader.result as string);
      } else {
        reject();
      }
    };
  });
}

function storeData(saveName: string, data: string) {
  localStorage.setItem(`${savesKeyPrefix}${saveName}`, data);
  const saveGames = listSaveGames();
  if (!saveGames.includes(saveName)) {
    saveGames.push(saveName);
  }
  saveList(saveGames);
}

function getSave(saveName: string): string | null {
  return localStorage.getItem(`${savesKeyPrefix}${saveName}`);
}

function saveList(saveGames: string[]) {
  localStorage.setItem(listKey, JSON.stringify(saveGames));
}
