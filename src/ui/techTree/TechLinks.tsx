import { TechnologyChanneled } from "@/core/serialization/channel";
import styles from "./TechTree.module.css";
import { useRef } from "react";

type Props = {
  techs: TechnologyChanneled[];
};

// Render connecting lines between technologies using right angles (zigzags)
export function TechLinks({ techs }: Props) {
  const elRef = useRef<HTMLDivElement>(null);

  const techsMap = new Map<string, TechnologyChanneled>();
  techs.forEach((tech) => techsMap.set(tech.id, tech));

  // Need to render this after the DOM has been updated
  setTimeout(() => {
    const techNodes = document.querySelectorAll(`[data-tech-id]`);
    const techNodesMap = new Map<string, DOMRect>();

    // Get positions of all tech nodes
    techNodes.forEach((node) => {
      const techId = node.getAttribute("data-tech-id");
      if (techId) {
        techNodesMap.set(techId, node.getBoundingClientRect());
      }
    });

    // For each tech with prerequisites, create lines to each prereq
    if (!elRef.current) {
      return;
    }

    // Clear previous links
    const el = elRef.current;
    el.innerHTML = "";

    techs.forEach((tech) => {
      tech.requiredTechs.forEach((prereqId) => {
        const prereq = techsMap.get(prereqId);
        if (!prereq) {
          return;
        }

        const techRect = techNodesMap.get(tech.id);
        const prereqRect = techNodesMap.get(prereqId);

        if (techRect && prereqRect) {
          const containerRect = el.getBoundingClientRect();

          // Calculate positions relative to the container
          // For the prerequisite tech, connect from the right side
          const startX =
            prereqRect.left - containerRect.left + prereqRect.width;
          const startY =
            prereqRect.top - containerRect.top + prereqRect.height / 2;

          // For the dependent tech, connect to the left side
          const endX = techRect.left - containerRect.left;
          const endY = techRect.top - containerRect.top + techRect.height / 2;

          // Always use zigzag lines (horizontal + vertical + horizontal)
          // Create a zigzag path with two right angles
          // First segment (horizontal from prereq)
          const halfwayX = startX + (endX - startX) / 2;

          // Create horizontal line from prereq
          const horizontalLine1 = document.createElement("div");
          horizontalLine1.className = styles.techLink;
          horizontalLine1.setAttribute("data-link", `${prereqId}-${tech.id}-1`);
          horizontalLine1.style.left = `${startX}px`;
          horizontalLine1.style.top = `${startY}px`;
          horizontalLine1.style.width = `${halfwayX - startX}px`;
          el.appendChild(horizontalLine1);

          // Create vertical line
          const verticalLine = document.createElement("div");
          verticalLine.className = styles.techLinkVertical;
          verticalLine.setAttribute("data-link", `${prereqId}-${tech.id}-2`);
          verticalLine.style.left = `${halfwayX}px`;

          // Handle the vertical line positioning (start from top if going down)
          if (endY > startY) {
            verticalLine.style.top = `${startY}px`;
            verticalLine.style.height = `${endY - startY}px`;
          } else {
            verticalLine.style.top = `${endY}px`;
            verticalLine.style.height = `${startY - endY}px`;
          }
          el.appendChild(verticalLine);

          // Create horizontal line to tech
          const horizontalLine2 = document.createElement("div");
          horizontalLine2.className = styles.techLink;
          horizontalLine2.setAttribute("data-link", `${prereqId}-${tech.id}-3`);
          horizontalLine2.style.left = `${halfwayX}px`;
          horizontalLine2.style.top = `${endY}px`;
          horizontalLine2.style.width = `${endX - halfwayX}px`;
          el.appendChild(horizontalLine2);
        }
      });
    });
  });

  return <div ref={elRef} className={styles.techLinks} />;
}
