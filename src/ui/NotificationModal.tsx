import { bridge } from "@/bridge";
import { TechDefChanneled } from "@/shared";
import { useObservable } from "@/utils";
import { useEffect, useState } from "react";
import { ImageIcon, OrnateModal, PrimaryButton } from "./components";
import { TechUnlocks } from "./techs/TechUnlocs";

export function NotificationModal() {
  const [tech, setTech] = useState<TechDefChanneled | null>(null);

  const techDiscovered = useObservable(bridge.technologies.discovered$);

  const startInfo = useObservable(bridge.game.start$);

  useEffect(() => {
    setTech(techDiscovered);
  }, [techDiscovered]);

  function close() {
    setTech(null);
  }

  if (startInfo?.aiOnly) {
    return null;
  }

  if (!tech) {
    return null;
  }

  return (
    <OrnateModal title="New discovery" onClose={close}>
      <div className="flex flex-col items-center gap-4">
        <div className="text-2xl font-serif font-semibold text-white-outline">
          {tech.name}
        </div>
        <ImageIcon name={tech.id} size="large" frameType={tech.entityType} />

        <div className="flex flex-col items-center gap-1">
          <div className="text-lg text-white-outline">Unlocks</div>
          <TechUnlocks tech={tech} />
        </div>

        <PrimaryButton onClick={close}>OK</PrimaryButton>
      </div>
    </OrnateModal>
  );
}
