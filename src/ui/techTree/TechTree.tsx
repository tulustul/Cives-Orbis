import { bridge } from "@/bridge";
import { TechnologyChanneled } from "@/core/serialization/channel";
import { Modal } from "@/ui/components";
import { useUiState } from "@/ui/uiState";
import { useEffect, useRef, useState } from "react";
import { Tech } from "./Tech";
import { TechLinks } from "./TechLinks";
import styles from "./TechTree.module.css";
import { eras, erasColors } from "./const";

export function TechTree() {
  const [techs, setTechs] = useState<TechnologyChanneled[] | null>(null);
  const techTreeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const uiState = useUiState();

  useEffect(() => {
    bridge.technologies.getAll().then(setTechs);
  }, []);

  function handleWheel(e: React.WheelEvent) {
    if (!containerRef.current) {
      return;
    }
    const scrollAmount = e.deltaY;
    containerRef.current.scrollLeft += scrollAmount;
  }

  function getContent() {
    if (!techs) {
      return null;
    }

    return (
      <div className="rounded-4xl overflow-hidden">
        <div
          className={styles.container}
          ref={containerRef}
          onWheel={handleWheel}
        >
          <div className="flex relative" ref={techTreeRef}>
            <TechLinks techs={techs} />

            {techs.map((tech) => (
              <Tech key={tech.id} tech={tech} />
            ))}

            <div className="flex h-280">
              {eras.map((era) => {
                return (
                  <div
                    key={era}
                    className="flex flex-col px-8 w-[1500px]"
                    style={{
                      background: `linear-gradient(${erasColors[era]}, transparent`,
                    }}
                  >
                    <div className="p-4 text-2xl text-center font-light tracking-widest">
                      {era}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Modal
      className="w-[95%] flex flex-col"
      title="Technologies"
      showCloseButton
      onClose={() => uiState.setView("none")}
    >
      {getContent()}
    </Modal>
  );
}
