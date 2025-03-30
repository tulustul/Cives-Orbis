import { TechKnowledgeChanneled } from "@/core/serialization/channel";

import styles from "./TechTree.module.css";

import { KnowledgeTechState } from "@/core/knowledge";
import { ImageIcon, ProgressBar } from "@/ui/components";
import { EntityTooltip } from "@/ui/entity";
import { formatTurns } from "@/utils";
import clsx from "clsx";
import { CSSProperties } from "react";

import { techBlockHeight, techBlockWidth } from "./const";
import { TechUnlocks } from "./TechUnlocs";

type Props = {
  tech: TechKnowledgeChanneled;
  onClick?: () => void;
  flexibleWidth?: boolean;
};

export function Tech({ tech, onClick, flexibleWidth }: Props) {
  const handleMouseEnter = () => {
    const currentTech = document.querySelector(
      `[data-tech-id="${tech.def.id}"]`
    );
    currentTech?.classList.add(styles.techNodeHighlighted);

    tech.def.requiredTechs.forEach((prereqId) => {
      const prereqNode = document.querySelector(`[data-tech-id="${prereqId}"]`);
      prereqNode?.classList.add(styles.techNodeHighlighted);
    });

    document.querySelectorAll("[data-tech-id]").forEach((node) => {
      const techId = node.getAttribute("data-tech-id");
      const techElement = node as HTMLElement;

      if (
        techId &&
        techElement.dataset.prereqs &&
        techElement.dataset.prereqs.includes(tech.def.id)
      ) {
        node.classList.add(styles.techNodeHighlighted);
      }
    });

    highlightTechLinks(tech.def.id);
  };

  const handleMouseLeave = () => {
    document
      .querySelectorAll(`.${styles.techNodeHighlighted}`)
      .forEach((node) => node.classList.remove(styles.techNodeHighlighted));

    document
      .querySelectorAll(`.${styles.techLinkHighlighted}`)
      .forEach((node) => node.classList.remove(styles.techLinkHighlighted));
  };

  const stateStyles: Record<KnowledgeTechState, string> = {
    available: "border-gray-900",
    discovered: "border-amber-100",
    // discovered: "border-[#aa8a07]",
    researching: "",
    queued: "opacity-70 bg-gray-900/50 border-gray-900",
    // unavailable: "opacity-40 border-gray-900",
    unavailable: "opacity-70 bg-gray-900/30 border-gray-900",
  };

  const stateRawStyles: Record<KnowledgeTechState, CSSProperties> = {
    available: {
      background: "linear-gradient(0deg, #0d0f18, #10192c, #292a34)",
    },
    discovered: {
      background: "linear-gradient(0deg, #553600, #ba7600, #aa8a07)",
    },
    researching: {
      background:
        "linear-gradient(0deg, rgb(30 44 54), rgb(36 65 93), rgb(67 93 114))",
    },
    queued: {
      background: "linear-gradient(0deg, #0d0f18, #10192c, #292a34)",
    },
    unavailable: {
      // background: "linear-gradient(0deg, #0d0f18, #10192c, #292a34)",
    },
  };

  return (
    <div
      className={clsx(
        "flex items-center rounded-l-[50px] rounded-xl border-2  text-amber-100 box-content cursor-pointer pointer-events-auto ",
        stateStyles[tech.state]
      )}
      style={{
        width: flexibleWidth ? "auto" : techBlockWidth,
        height: techBlockHeight,
        filter: "drop-shadow(rgba(0, 0, 0, 0.4) 2px 3px 3px)",
        boxShadow: "0 0 3px 0px rgba(255, 255, 255, 0.3) inset",
        ...stateRawStyles[tech.state],
      }}
      data-tech-id={tech.def.id}
      data-era={tech.def.era}
      data-prereqs={tech.def.requiredTechs.join(",")}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <EntityTooltip entityId={tech.def.id}>
        <ImageIcon
          name={tech.def.id}
          size="medium"
          frameType="technology"
          className="-left-2 z-10"
        />
      </EntityTooltip>

      <div className="flex flex-col justify-between pr-2 pt-[2px] pb-[6px] w-full h-full">
        <div className="flex justify-between gap-4 items-center">
          <div className="font-bold text-sm text-shadow">{tech.def.name}</div>
          {tech.state !== "discovered" && (
            <div className="text-xs">{formatTurns(tech.turns)} turns</div>
          )}
        </div>
        <TechUnlocks tech={tech.def} />
        {tech.state === "researching" && (
          <>
            <div className={clsx(styles.bubbles, styles.bubblesLayer1)} />
            <div className={clsx(styles.bubbles, styles.bubblesLayer2)} />
          </>
        )}

        {tech.state === "researching" && (
          <div className="absolute w-full h-full left-0 top-0 opacity-80 -z-10">
            <ProgressBar
              className="[--progress-bar-height:100%] [--progress-bar-color:#6276b2] [--progress-bar-total-color:transparent]"
              progress={tech.accumulated}
              total={tech.def.cost}
              nextProgress={tech.nextAccumulated}
            />
          </div>
        )}
      </div>
      {tech.queuePosition && (
        <div
          className="absolute bottom-0 right-0 rounded-full bg-gray-900 border-2 border-black w-6 h-6 flex items-center justify-center text-xs translate-1/3"
          style={{ boxShadow: "0 0 3px 0px rgba(255, 255, 255, 0.3) inset" }}
        >
          {tech.queuePosition}
        </div>
      )}
    </div>
  );
}

function highlightTechLinks(techId: string) {
  document
    .querySelectorAll(`[data-link-from="${techId}"],[data-link-to="${techId}"]`)
    .forEach((link) => {
      const parent = link.parentElement!;
      link.remove();
      parent.appendChild(link);
      link.classList.add(styles.techLinkHighlighted);
    });
}
