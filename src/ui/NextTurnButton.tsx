import { useObservable } from "@/utils";
import { nextTurnService } from "./nextTurn";
import { Spinner } from "./components";
import { bridge } from "@/bridge";
import clsx from "clsx";

export function NextTurnButton() {
  const nextTask = useObservable(bridge.nextTask$);
  const waiting = useObservable(nextTurnService.waiting$);

  function getCssClass() {
    if (!nextTask) {
      return "";
    }

    switch (nextTask.task) {
      case "city":
        return "text-production";
      case "unit":
        return "";
      case "chooseTech":
        return "text-knowledge";
    }
  }

  function getLabel() {
    if (!nextTask) {
      return "Next turn";
    }

    switch (nextTask.task) {
      case "city":
        return "Choose production";
      case "unit":
        return "Unit needs orders";
      case "chooseTech":
        return "Choose research";
    }
  }

  if (waiting) {
    return (
      <div className="flex gap-5 items-center px-5 h-11">
        <Spinner size="small" />
        <div className="text-xl">Wait for other players</div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        getCssClass(),
        "w-full h-11 text-xl flex items-center justify-center cursor-pointer bg-gray-800 hover:bg-gray-700"
      )}
      onClick={() => nextTurnService.next()}
    >
      {getLabel()}
    </div>
  );
}
