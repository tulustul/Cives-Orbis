import { OrnateBox } from "./components/OrnateBox";
import { Editor } from "./editor";

import { TileCore } from "@/core/tile";
console.log(TileCore);

export function EditorMode() {
  return (
    <OrnateBox borderType="small">
      <Editor />
    </OrnateBox>
  );
}
