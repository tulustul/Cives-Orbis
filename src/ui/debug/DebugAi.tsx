import { bridge } from "@/bridge";
import { AiDebug, AiTaskSerialized } from "@/shared/debug";
import { useObservable } from "@/utils";
import { useEffect, useState } from "react";

export function DebugAi() {
  const [debugInfo, setDebugInfo] = useState<AiDebug | null>(null);

  const turn = useObservable(bridge.game.turn$);

  useEffect(() => {
    bridge.editor.player.debugAi().then(setDebugInfo);
  }, [turn]);

  if (!debugInfo) {
    return null;
  }

  return debugInfo.tasks.map((task, index) => {
    return <Task key={index} task={task} />;
  });
}

function Task({ task }: { task: AiTaskSerialized<any> }) {
  return (
    <div>
      <div className="font-semibold text-xs">{task.type}</div>
      <pre className="text-[10px]">
        {JSON.stringify(task.data, undefined, 2)}
      </pre>

      {task.tasks.length > 0 && (
        <div className="pl-6 border-l-1">
          {task.tasks.map((subTask, index) => (
            <Task key={index} task={subTask} />
          ))}
        </div>
      )}
    </div>
  );
}
