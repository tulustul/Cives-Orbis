import { TechnologyChanneled } from "@/core/serialization/channel";

import styles from "./TechTree.module.css";

import { ImageIcon } from "@/ui/components";
import { EntityTooltip } from "@/ui/entity";

type Props = {
  tech: TechnologyChanneled;
};

export function Tech({ tech }: Props) {
  const handleMouseEnter = () => {
    const currentTech = document.querySelector(`[data-tech-id="${tech.id}"]`);
    currentTech?.classList.add(styles.techNodeHighlighted);

    tech.requiredTechs.forEach((prereqId) => {
      const prereqNode = document.querySelector(`[data-tech-id="${prereqId}"]`);
      prereqNode?.classList.add(styles.techNodeHighlighted);
    });

    document.querySelectorAll("[data-tech-id]").forEach((node) => {
      const techId = node.getAttribute("data-tech-id");
      const techElement = node as HTMLElement;

      if (
        techId &&
        techElement.dataset.prereqs &&
        techElement.dataset.prereqs.includes(tech.id)
      ) {
        node.classList.add(styles.techNodeHighlighted);
      }
    });

    highlightTechLinks(tech.id);
  };

  const handleMouseLeave = () => {
    document
      .querySelectorAll(`.${styles.techNodeHighlighted}`)
      .forEach((node) => node.classList.remove(styles.techNodeHighlighted));

    document
      .querySelectorAll(`.${styles.techLinkHighlighted}`)
      .forEach((node) => node.classList.remove(styles.techLinkHighlighted));
  };

  return (
    <div
      className={
        "absolute flex items-center w-100 h-[80px] bg-gray-900 rounded-l-[50px] rounded-r-xl border-2 border-gray-900 text-amber-100 box-content cursor-pointer"
      }
      style={{
        top: `${tech.layout.y}px`,
        left: `${tech.layout.x}px`,
        filter: "drop-shadow(rgba(0, 0, 0, 0.4) 2px 3px 3px)",
        boxShadow: "0 0 3px 0px rgba(255, 255, 255, 0.3) inset",
        background: "linear-gradient(0deg, #0d0f18, #10192c, #292a34)",
      }}
      data-tech-id={tech.id}
      data-era={tech.era}
      data-prereqs={tech.requiredTechs.join(",")}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <ImageIcon
        name={tech.id}
        size="medium"
        frameType="technology"
        className="-left-2"
      />

      <div className="flex flex-col justify-between pr-4 pb-1 w-full h-full">
        <div className={styles.techHeader}>
          <div className={styles.techName}>{tech.name}</div>
          <div className={styles.techTurns}>{tech.cost} science</div>
        </div>
        <div className="flex gap-1">
          {tech.products.map((p) => (
            <EntityTooltip key={p.id} entityId={p.id}>
              <ImageIcon name={p.id} size="small" frameType={p.entityType} />
            </EntityTooltip>
          ))}
        </div>
      </div>
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
