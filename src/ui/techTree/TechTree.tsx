import { bridge } from "@/bridge";
import { TechnologyChanneled } from "@/core/serialization/channel";
import { Modal } from "@/ui/components";
import { useUiState } from "@/ui/uiState";
import { useEffect, useRef, useState } from "react";
import { Tech } from "./Tech";
import { TechLinks } from "./TechLinks";
import styles from "./TechTree.module.css";
import { eras, erasColors } from "./const";
import { organizeTechsIntoColumns } from "./organizeTechs";

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

    // Organize techs into columns within each era
    const columnsByEra: Record<string, TechnologyChanneled[][]> = {};

    for (const era of eras) {
      // Filter techs for just this era
      const eraTechs = techs.filter((tech) => tech.era === era);
      // Organize into columns using the existing function
      columnsByEra[era] = organizeTechsIntoColumns(eraTechs);
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

            <div className="flex ">
              {eras.map((era) => {
                const eraColumns = columnsByEra[era];

                return (
                  <div
                    key={era}
                    className="flex flex-col px-8"
                    style={{
                      background: `linear-gradient(${erasColors[era]}, transparent`,
                    }}
                  >
                    <div className="p-4 text-2xl text-center font-light tracking-widest">
                      {era}
                    </div>

                    <div className={styles.techColumns}>
                      {eraColumns.map((column, i) => (
                        <div key={i} className={styles.techColumn}>
                          {column.map((tech) => (
                            <Tech key={tech.id} tech={tech} />
                          ))}
                        </div>
                      ))}
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
