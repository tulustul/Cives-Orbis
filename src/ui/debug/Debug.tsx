import { OrnateBox } from "../components/OrnateBox";
import { DebugAi } from "./DebugAi";

export function Debug() {
  return (
    <div className="relative h-1">
      <OrnateBox borderType="small" contentClassName="p-2">
        <div className="max-h-[800px] overflow-y-auto scrollbar-thin">
          <div className="font-semibold text-lg text-center">Debug Box</div>
          <DebugAi />
        </div>
      </OrnateBox>
    </div>
  );
}
