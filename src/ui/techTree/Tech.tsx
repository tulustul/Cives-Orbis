import { TechnologyChanneled } from "@/core/serialization/channel";

import styles from "./TechTree.module.css";

import { ImageIcon } from "@/ui/components";
import { EntityTooltip } from "@/ui/entity";

type Props = {
  tech: TechnologyChanneled;
};

export function Tech({ tech }: Props) {
  // Handle mouse enter/leave to highlight tech dependencies
  const handleMouseEnter = () => {
    // Add highlight class to the current tech
    const currentTech = document.querySelector(`[data-tech-id="${tech.id}"]`);
    currentTech?.classList.add(styles.techNodeHighlighted);

    // Find and highlight prerequisite techs
    tech.requiredTechs.forEach((prereqId) => {
      const prereqNode = document.querySelector(`[data-tech-id="${prereqId}"]`);
      prereqNode?.classList.add(styles.techNodePrereq);
    });

    // Find and highlight techs that require this tech
    document.querySelectorAll("[data-tech-id]").forEach((node) => {
      const techId = node.getAttribute("data-tech-id");
      const techElement = node as HTMLElement;

      if (
        techId &&
        techElement.dataset.prereqs &&
        techElement.dataset.prereqs.includes(tech.id)
      ) {
        node.classList.add(styles.techNodeNext);
      }
    });

    // Highlight relevant links
    highlightTechLinks(tech.id);
  };

  const handleMouseLeave = () => {
    // Remove highlight classes from all techs
    document
      .querySelectorAll(`.${styles.techNodeHighlighted}`)
      .forEach((node) => node.classList.remove(styles.techNodeHighlighted));

    document
      .querySelectorAll(`.${styles.techNodePrereq}`)
      .forEach((node) => node.classList.remove(styles.techNodePrereq));

    document
      .querySelectorAll(`.${styles.techNodeNext}`)
      .forEach((node) => node.classList.remove(styles.techNodeNext));

    // Remove link highlights
    document
      .querySelectorAll(`.${styles.techLinkHighlighted}`)
      .forEach((node) => node.classList.remove(styles.techLinkHighlighted));

    // No SVG paths to clean up anymore
  };

  return (
    <div
      className={
        "absolute flex items-center w-100 bg-black/50 rounded-l-[50px] rounded-r-xl border-2 border-black"
      }
      style={{
        top: `${tech.layout.y}px`,
        left: `${tech.layout.x}px`,
        // transform: "translate(-50%, -50%)",
      }}
      data-tech-id={tech.id}
      data-era={tech.era}
      data-prereqs={tech.requiredTechs.join(",")}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <ImageIcon name={tech.id} size="medium" />

      <div className="flex flex-col justify-between px-4 py-1 w-full h-full">
        <div className={styles.techHeader}>
          <div className={styles.techName}>{tech.name}</div>
          <div className={styles.techTurns}>{tech.cost} science</div>
        </div>
        <div className="flex">
          {tech.products.map((p) => (
            <EntityTooltip key={p.id} entityId={p.id}>
              <div className="px-1">
                <ImageIcon name={p.id} size="small" />
              </div>
            </EntityTooltip>
          ))}
        </div>
      </div>
    </div>
  );
}

// Function to highlight tech links when hovering a tech
function highlightTechLinks(techId: string) {
  // Highlight links where this tech is a prereq (links going out)
  document.querySelectorAll(`[data-link^="${techId}-"]`).forEach((link) => {
    link.classList.add(styles.techLinkHighlighted);
  });

  // Highlight links where this tech is the target (links coming in)
  document.querySelectorAll(`[data-link]`).forEach((link) => {
    const linkData = link.getAttribute("data-link");
    if (linkData && linkData.split("-")[1] === techId) {
      link.classList.add(styles.techLinkHighlighted);
    }
  });
}
