import { bridge } from "@/bridge";
import { HeatMapTileData } from "@/renderer/heatMapDrawer";
import { renderer } from "@/renderer/renderer";
import { AiDebugMapAnalysis } from "@/shared/debug";
import { useObservable } from "@/utils";
import { useEffect, useState } from "react";
import { Switch } from "../components";
import { mapUi } from "../mapUi";

export function DebugAiMap() {
  const [analysis, setAnalysis] = useState<AiDebugMapAnalysis | null>(null);
  const [showHeatMap, setShowHeatMap] = useState(true);

  const turn = useObservable(bridge.game.turn$);
  const trackedPlayer = useObservable(bridge.player.tracked$);

  useEffect(() => {
    bridge.debug.player.getAiMapAnalysis().then(setAnalysis);
  }, [turn, trackedPlayer]);

  useEffect(() => {
    if (!analysis || !showHeatMap) {
      renderer.heatMapDrawer.clear();
      return;
    }

    const data = analysis.tiles.map((tile) => {
      const valueR = tile.influence.enemy.total;
      const valueG = tile.influence.friendly.total;

      return {
        ...tile.tile,
        valueR,
        valueG,
      } as HeatMapTileData;
    });

    renderer.heatMapDrawer.setTiles(data);

    return () => {
      renderer.heatMapDrawer.clear();
    };
  }, [analysis, showHeatMap]);

  if (!analysis) {
    return (
      <div className="text-gray-500 font-semibold text-xs">
        Loading analysis...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Switch
          checked={showHeatMap}
          onChange={setShowHeatMap}
          label="Heat Map"
        />
        <div className="text-xs text-gray-600 font-semibold">
          ({analysis.tiles.length} tiles)
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs font-semibold text-gray-800">
          Attack Targets
        </div>
        {analysis.attackTargets.length === 0 ? (
          <div className="text-xs text-gray-500 font-semibold italic">
            No targets found
          </div>
        ) : (
          <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
            {analysis.attackTargets.map((target, i) => (
              <div
                key={i}
                className="flex justify-between bg-gray-100 p-1 rounded border border-gray-300 cursor-pointer"
                onClick={() => mapUi.moveCameraToCity(target.cityId)}
              >
                <span className="font-medium text-gray-800">
                  {target.cityName}
                </span>
                <div className="flex gap-2 text-gray-600 font-semibold">
                  <span>Score: {target.score.toFixed(1)}</span>
                  <span>Effort: {target.effort.toFixed(0)}</span>
                  <span>Dist: {target.distance}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs font-semibold text-gray-800">
          Defense Priorities
        </div>
        {analysis.defenseTargets.length === 0 ? (
          <div className="text-xs text-gray-500 font-semibold italic">
            No threats
          </div>
        ) : (
          <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
            {analysis.defenseTargets.map((target, i) => (
              <div
                key={i}
                className="flex justify-between bg-gray-100 p-1 rounded border border-gray-300 cursor-pointer"
                onClick={() => mapUi.moveCameraToCity(target.cityId)}
              >
                <span className="font-medium text-gray-800">
                  {target.cityName}
                </span>
                <div className="flex gap-2 text-gray-600 font-semibold">
                  <span className="text-red-600">
                    Threat:{" "}
                    {(
                      target.enemyInfluence /
                      Math.max(1, target.friendlyInfluence)
                    ).toFixed(1)}
                    x
                  </span>
                  <span>Enemy: {target.enemyInfluence.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
