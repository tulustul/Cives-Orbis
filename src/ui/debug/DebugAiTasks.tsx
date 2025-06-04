import { bridge } from "@/bridge";
import { AiDebugTasks, AiTaskSerialized } from "@/shared/debug";
import { AiTaskResult, AiTaskStatus } from "@/shared/data";
import { useObservable } from "@/utils";
import { useEffect, useState } from "react";
import { Button, Switch } from "../components";

function getStatusColor(status: AiTaskResult | AiTaskStatus): string {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium";
    case "failed":
      return "bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium";
    case "active":
      return "bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium";
    case "pending":
      return "bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs";
    default:
      return "bg-gray-50 text-gray-400 px-2 py-1 rounded-full text-xs";
  }
}

export function DebugAiTasks() {
  const [debugInfo, setDebugInfo] = useState<AiDebugTasks | null>(null);
  const [allExpanded, setAllExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const turn = useObservable(bridge.game.turn$);
  const trackedPlayer = useObservable(bridge.player.tracked$);

  useEffect(() => {
    bridge.debug.player.getAiTasks().then(setDebugInfo);
  }, [turn, trackedPlayer]);

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
      <div className="mb-4 flex  gap-2">
        <Button
          onClick={handleToggleAll}
          className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          {allExpanded ? "Collapse All" : "Expand All"} (
          {debugInfo.tasks.length})
        </Button>
        <Switch
          label="Show details"
          checked={showDetails}
          onChange={setShowDetails}
        />
      </div>
      {debugInfo.tasks.map((task, index) => {
        return (
          <Task
            key={`${index}-${resetKey}`}
            task={task}
            forceExpanded={allExpanded}
            showDetails={showDetails}
          />
        );
      })}
    </div>
  );
}

function Task({
  task,
  forceExpanded = false,
  showDetails = false,
}: {
  task: AiTaskSerialized<any>;
  forceExpanded?: boolean;
  showDetails?: boolean;
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
        className="font-semibold text-xs cursor-pointer hover:bg-gray-100/50 p-1 rounded flex items-center justify-between gap-4"
        onClick={handleToggle}
      >
        <div className="flex">
          <div className="mr-2">{shouldExpand ? "▼" : "▶"}</div>
          <span>
            {task.type} <span className="font-normal">({task.id})</span>
          </span>
          {task.tasks.length > 0 && (
            <div className="ml-2 text-gray-500">
              ({task.tasks.length} childs)
            </div>
          )}
        </div>
        <div className={getStatusColor(task.status)}>{task.status}</div>
      </div>

      {task.reason && (
        <div className="ml-4 text-xs text-danger font-semibold">
          {task.reason}
        </div>
      )}

      {shouldExpand && (
        <>
          {showDetails && (
            <pre className="text-[10px] ml-4 bg-gray-50/50 p-2 rounded m-1">
              {JSON.stringify(task.data, undefined, 2)}
            </pre>
          )}

          {task.tasks.length > 0 && (
            <div className="pl-6 border-l-2 border-black/20 ml-2">
              {task.tasks.map((subTask, index) => (
                <Task
                  key={index}
                  task={subTask}
                  forceExpanded={forceExpanded}
                  showDetails={showDetails}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
