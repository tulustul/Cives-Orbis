import { TechnologyChanneled } from "@/core/serialization/channel";

import styles from "./TechTree.module.css";

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
      className={`w-80 ${styles.techNode} ${
        styles[`era-${tech.era?.replace(/\s+/g, "")}`]
      }`}
      data-tech-id={tech.id}
      data-era={tech.era}
      data-prereqs={tech.requiredTechs.join(",")}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.techHeader}>
        <div className={styles.techName}>{tech.name}</div>
        <div className={styles.techTurns}>{tech.cost} science</div>
      </div>
      {tech.products.length > 0 && (
        <div className={styles.techProducts}>
          {tech.products.map((p) => (
            <div key={p.id} className={styles.techProduct}>
              {p.name}
            </div>
          ))}
        </div>
      )}
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
