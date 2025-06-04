import { Tab, Tabs } from "../components";
import { OrnateBox } from "../components/OrnateBox";
import { DebugAiTasks } from "./DebugAiTasks";
import { DebugAiUnits } from "./DebugAiUnits";

export function Debug() {
  return (
    <div className="relative h-1">
      <OrnateBox borderType="small" contentClassName="p-2">
        <div className="max-h-[800px] overflow-y-auto scrollbar-thin">
          <div className="font-semibold text-lg text-center mb-2">
            Debug Box
          </div>
          <Tabs>
            <Tab title="AI Tasks">
              <DebugAiTasks />
            </Tab>
            <Tab title="AI Units">
              <DebugAiUnits />
            </Tab>
          </Tabs>
        </div>
      </OrnateBox>
    </div>
  );
}
