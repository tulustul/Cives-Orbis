import { OrnateBox } from "./components/OrnateBox";
import { Editor } from "./editor";

export function EditorMode() {
  return (
    <OrnateBox borderType="small">
      <Editor />
    </OrnateBox>
  );
}
