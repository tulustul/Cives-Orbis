import { bridge } from "@/bridge";
import { AiDebugUnitsRegistry } from "@/shared/debug";
import { UnitAssignmentType } from "@/shared/data";
import { useObservable } from "@/utils";
import { useEffect, useState } from "react";
import { mapUi } from "../mapUi";

function getAssignmentColor(assignment: UnitAssignmentType): string {
  switch (assignment) {
    case "garrison":
      return "bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium";
    case "exploration":
      return "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium";
    case "transport":
      return "bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium";
    case "settling":
      return "bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium";
    case "escort":
      return "bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium";
    case "working":
      return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium";
    default:
      return "bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs";
  }
}

export function DebugAiUnits() {
  const [debugInfo, setDebugInfo] = useState<AiDebugUnitsRegistry | null>(null);

  const turn = useObservable(bridge.game.turn$);
  const trackedPlayer = useObservable(bridge.player.tracked$);

  useEffect(() => {
    bridge.debug.player.getAiUnitsRegistry().then(setDebugInfo);
  }, [turn, trackedPlayer]);

  if (!debugInfo) {
    return <div>Loading units...</div>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-black/30 text-xs">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-black/30 px-2 py-1 text-left">No</th>
              <th className="border border-black/30 px-2 py-1 text-left">ID</th>
              <th className="border border-black/30 px-2 py-1 text-left">
                Name
              </th>
              <th className="border border-black/30 px-2 py-1 text-left">
                Assignment
              </th>
            </tr>
          </thead>
          <tbody>
            {debugInfo.units.map((unit, index) => (
              <tr
                key={unit.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() =>
                  mapUi.selectUnit(unit.id, { centerCamera: true })
                }
              >
                <td className="border border-black/30 px-2 py-1 font-mono">
                  {index + 1}
                </td>
                <td className="border border-black/30 px-2 py-1 font-mono">
                  {unit.id}
                </td>
                <td className="border border-black/30 px-2 py-1 font-semibold">
                  {unit.name}
                </td>
                <td className="border border-black/30 px-2 py-1">
                  {unit.assignment && (
                    <span className={getAssignmentColor(unit.assignment)}>
                      {unit.assignment}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {debugInfo.units.length === 0 && (
          <div className="text-center text-gray-500 py-4">No units found</div>
        )}
      </div>
    </div>
  );
}
