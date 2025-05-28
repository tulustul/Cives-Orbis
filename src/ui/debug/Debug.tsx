import { OrnateBox } from "../components/OrnateBox";
import { DebugAi } from "./DebugAi";

export function Debug() {
  return (
    <OrnateBox borderType="small" contentClassName="p-2">
      <div className="max-h-[800px] overflow-y-auto scrollbar-thin">
        <div className="font-semibold">Debug Information</div>
        <DebugAi />
      </div>
    </OrnateBox>
  );
}
