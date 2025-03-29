import { useObservable } from "@/utils";
import { Tech } from "./techTree/Tech";
import { useUiState } from "./uiState";
import { bridge } from "@/bridge";

export function Research() {
  const tech = useObservable(
    bridge.technologies.researchUpdated$,
    bridge.technologies.getResearch
  );

  const { setView } = useUiState();

  if (!tech) {
    return null;
  }

  return (
    <div className="ml-2">
      <Tech tech={tech} onClick={() => setView("techTree")} flexibleWidth />
    </div>
  );
}
