import { bridge } from "@/bridge";
import { useObservable } from "@/utils";
import { ImageIcon, Tooltip } from "./components";

export function PlayerYields() {
  const yields = useObservable(bridge.player.yields$, bridge.player.getYields);

  if (!yields) {
    return null;
  }

  return (
    <div className="flex gap-4 px-4 h-12 items-center">
      <Tooltip
        content={
          <>
            <div>From cities: {yields.cities.gold}</div>
            <div>From trade: {yields.trade.gold}</div>
            <div>Units wage: {yields.unitWages.gold}</div>
            <div>Netto per turn: {yields.perTurn.gold}</div>
            {yields.total.gold < 0 && (
              <div className="text-red-500">
                Not enough gold! Units without a wage will lose their health.
              </div>
            )}
          </>
        }
      >
        <div className="text-gold">
          Gold: {yields.total.gold} ({yields.perTurn.gold >= 0 ? "+" : ""}
          {yields.perTurn.gold})
        </div>
      </Tooltip>

      <Tooltip content={<div>Knowledge</div>}>
        <div className="text-knowledge flex items-center gap-2 font-semibold">
          <ImageIcon name="yield_knowledge" size="tiny" />
          {yields.perTurn.knowledge}
        </div>
      </Tooltip>
    </div>
  );
}
