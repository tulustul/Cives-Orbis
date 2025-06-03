import { bridge } from "@/bridge";
import { AiDebug, AiTaskSerialized } from "@/shared/debug";
import { useObservable } from "@/utils";
import { useEffect, useState } from "react";
import { Button } from "../components";

export function DebugAi() {
  const [debugInfo, setDebugInfo] = useState<AiDebug | null>(null);
  const [allExpanded, setAllExpanded] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const turn = useObservable(bridge.game.turn$);

  useEffect(() => {
    bridge.editor.player.debugAi().then(setDebugInfo);
  }, [turn]);

  const handleToggleAll = () => {
    setAllExpanded(!allExpanded);
    // Reset all task states by changing the key
    setResetKey((prev) => prev + 1);
  };

  if (!debugInfo) {
    return null;
  }

  return (
    <div>
      <div className="mb-4">
        <div>AI tasks ({debugInfo.tasks.length})</div>
        <Button
          onClick={handleToggleAll}
          className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          {allExpanded ? "Collapse All" : "Expand All"}
        </Button>
      </div>
      {debugInfo.tasks.map((task, index) => {
        return (
          <Task
            key={`${index}-${resetKey}`}
            task={task}
            forceExpanded={allExpanded}
          />
        );
      })}
    </div>
  );
}

function Task({
  task,
  forceExpanded = false,
}: {
  task: AiTaskSerialized<any>;
  forceExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isManuallyCollapsed, setIsManuallyCollapsed] = useState(false);

  // If force expanded but manually collapsed, respect the manual collapse
  const shouldExpand = forceExpanded ? !isManuallyCollapsed : isExpanded;

  const handleToggle = () => {
    if (forceExpanded) {
      // When in "expand all" mode, clicking toggles manual collapse
      setIsManuallyCollapsed(!isManuallyCollapsed);
    } else {
      // Normal mode, just toggle expansion
      setIsExpanded(!isExpanded);
      setIsManuallyCollapsed(false); // Reset manual collapse when not in force mode
    }
  };

  return (
    <div className="mb-2">
      <div
        className="font-semibold text-xs cursor-pointer hover:bg-gray-100/50 p-1 rounded flex items-center"
        onClick={handleToggle}
      >
        <span className="mr-2">{shouldExpand ? "▼" : "▶"}</span>
        {task.type}
        {task.tasks.length > 0 && (
          <span className="ml-2 text-gray-500">
            ({task.tasks.length} subtasks)
          </span>
        )}
      </div>

      {shouldExpand && (
        <>
          <pre className="text-[10px] ml-4 bg-gray-50/50 p-2 rounded m-1">
            {JSON.stringify(task.data, undefined, 2)}
          </pre>

          {task.tasks.length > 0 && (
            <div className="pl-6 border-l-2 border-black/20 ml-2">
              {task.tasks.map((subTask, index) => (
                <Task
                  key={index}
                  task={subTask}
                  forceExpanded={forceExpanded}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
