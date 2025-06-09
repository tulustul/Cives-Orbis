import { Tab, Tabs } from "../components";
import { OrnateBox } from "../components/OrnateBox";
import { DebugAiTasks } from "./DebugAiTasks";
import { DebugAiUnits } from "./DebugAiUnits";
import { DebugAiMap } from "./DebugMap";

export function DebugAi() {
  return (
    <div className="relative h-1">
      <OrnateBox borderType="small" contentClassName="p-2">
        <div className="max-h-[800px] overflow-y-auto scrollbar-thin">
          <div className="font-semibold text-lg text-center mb-2">
            AI Debug Box
          </div>
          <Tabs>
            <Tab title="Tasks">
              <DebugAiTasks />
            </Tab>
            <Tab title="Units">
              <DebugAiUnits />
            </Tab>
            <Tab title="Map">
              <DebugAiMap />
            </Tab>
          </Tabs>
        </div>
      </OrnateBox>
    </div>
  );
}
