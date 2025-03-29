import { bridge } from "@/bridge";
import { TechKnowledgeChanneled } from "@/core/serialization/channel";
import { Modal } from "@/ui/components";
import { useUiState } from "@/ui/uiState";
import { useEffect, useRef, useState } from "react";
import { Tech } from "./Tech";
import { TechLinks } from "./TechLinks";
import styles from "./TechTree.module.css";
import { eras, erasColors, techBlockWidth } from "./const";

export function TechTree() {
  const [techs, setTechs] = useState<TechKnowledgeChanneled[] | null>(null);
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

  async function onTechClick(tech: TechKnowledgeChanneled) {
    if (tech.state === "discovered" || tech.state === "researching") {
      return;
    }
    await bridge.technologies.research(tech.def.id);
    const techs = await bridge.technologies.getAll();
    setTechs(techs);
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
              <div
                key={tech.def.id}
                className="absolute"
                style={{
                  top: `${tech.def.layout.y}px`,
                  left: `${tech.def.layout.x}px`,
                }}
              >
                <Tech
                  key={tech.def.id}
                  tech={tech}
                  onClick={() => onTechClick(tech)}
                />
              </div>
            ))}

            <div className="flex h-[85vh]">
              {eras.map((era) => {
                return (
                  <div
                    key={era}
                    className="flex flex-col px-8"
                    style={{
                      background: `linear-gradient(${erasColors[era]}, transparent`,
                      width: (techBlockWidth + 91) * 3,
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
