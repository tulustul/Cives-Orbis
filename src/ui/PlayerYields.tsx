import { bridge } from "@/bridge";
import { useObservable } from "@/utils";
import { ImageIcon, Tooltip } from "./components";

export function PlayerYields() {
  const yields = useObservable(bridge.player.yields$);

  if (!yields) {
    return null;
  }

  return (
    <div className="flex gap-4 px-4 h-12 items-center">
      <Tooltip
        content={
          <>
            <div>From cities: {yields.income.publicWorks}</div>
            <div>Improvements maintainance: {yields.costs.publicWorks}</div>
            <div>Netto per turn: {yields.perTurn.publicWorks}</div>
          </>
        }
      >
        <div className="text-publicWorks">
          Public works: {yields.total.publicWorks} (
          {yields.perTurn.publicWorks >= 0 ? "+" : ""}
          {yields.perTurn.publicWorks})
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
