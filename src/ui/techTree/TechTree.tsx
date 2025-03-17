import { bridge } from "@/bridge";
import { TechnologyChanneled } from "@/core/serialization/channel";
import { Modal } from "@/ui/components";
import { useUiState } from "@/ui/uiState";
import { useEffect, useRef, useState } from "react";
import styles from "./TechTree.module.css";

export function TechTree() {
  const [techs, setTechs] = useState<TechnologyChanneled[] | null>(null);
  const techTreeRef = useRef<HTMLDivElement>(null);
  const uiState = useUiState();

  useEffect(() => {
    bridge.technologies.getAll().then(setTechs);
  }, []);

  function getContent() {
    if (!techs) {
      return null;
    }

    // Organize techs into columns based on dependencies
    const columns = organizeTechsIntoColumns(techs);

    return (
      <div className={styles.container}>
        <div className={styles.techTreeContainer} ref={techTreeRef}>
          <div className={styles.techLinks}>
            {renderTechLinks(techs, columns)}
          </div>
          <div className={styles.techColumns}>
            {columns.map((column, i) => (
              <div key={i} className={styles.techColumn}>
                {column.map((tech) => (
                  <Tech key={tech.id} tech={tech} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Modal
      className="w-[90%] flex flex-col"
      title="Technologies"
      showCloseButton
      onClose={() => uiState.setView("none")}
    >
      {getContent()}
    </Modal>
  );
}

// Organize technologies into columns based on dependencies
function organizeTechsIntoColumns(
  techs: TechnologyChanneled[]
): TechnologyChanneled[][] {
  const columns: TechnologyChanneled[][] = [];
  const techsById = new Map<string, TechnologyChanneled>();
  const techToDepth = new Map<string, number>();

  // Create a map for quick lookups
  techs.forEach((tech) => techsById.set(tech.id, tech));

  // Calculate the "depth" for each technology (how far from root techs)
  function calculateDepth(techId: string, visited = new Set<string>()): number {
    // Prevent infinite recursion
    if (visited.has(techId)) return 0;
    visited.add(techId);

    const tech = techsById.get(techId);
    if (!tech) return 0;

    // If we've already calculated this tech's depth, return it
    if (techToDepth.has(techId)) return techToDepth.get(techId)!;

    // Root techs (no prerequisites) have depth 0
    if (tech.requiredTechs.length === 0) {
      techToDepth.set(techId, 0);
      return 0;
    }

    // Calculate the maximum depth of all prerequisites, then add 1
    const prereqDepths = tech.requiredTechs.map((prereqId) =>
      calculateDepth(prereqId, new Set(visited))
    );

    const maxPrereqDepth = Math.max(...prereqDepths, -1);
    const depth = maxPrereqDepth + 1;

    techToDepth.set(techId, depth);
    return depth;
  }

  // Calculate depth for all techs
  techs.forEach((tech) => calculateDepth(tech.id));

  // Find the maximum depth
  const maxDepth = Math.max(...Array.from(techToDepth.values()));

  // Initialize columns array
  for (let i = 0; i <= maxDepth; i++) {
    columns.push([]);
  }

  // Place each tech in its column
  techs.forEach((tech) => {
    const depth = techToDepth.get(tech.id) || 0;
    columns[depth].push(tech);
  });

  // Sort techs within each column (optional)
  columns.forEach((column) => {
    column.sort((a, b) => a.name.localeCompare(b.name));
  });

  return columns;
}

// Render connecting lines between technologies using right angles (zigzags)
function renderTechLinks(
  techs: TechnologyChanneled[],
  columns: TechnologyChanneled[][]
) {
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
    const linksContainer = document.querySelector(`.${styles.techLinks}`);
    if (!linksContainer) return;

    // Clear previous links
    linksContainer.innerHTML = "";

    techs.forEach((tech) => {
      tech.requiredTechs.forEach((prereqId) => {
        const prereq = techsMap.get(prereqId);
        if (!prereq) return;

        const techRect = techNodesMap.get(tech.id);
        const prereqRect = techNodesMap.get(prereqId);

        if (techRect && prereqRect) {
          const containerRect = linksContainer.getBoundingClientRect();

          // Calculate positions relative to the container
          const startX =
            prereqRect.left - containerRect.left + prereqRect.width;
          const startY =
            prereqRect.top - containerRect.top + prereqRect.height / 2;
          const endX = techRect.left - containerRect.left;
          const endY = techRect.top - containerRect.top + techRect.height / 2;

          // Create a zigzag path with two right angles
          // First segment (horizontal from prereq)
          const halfwayX = startX + (endX - startX) / 2;

          // Create horizontal line from prereq
          const horizontalLine1 = document.createElement("div");
          horizontalLine1.className = styles.techLink;
          horizontalLine1.style.left = `${startX}px`;
          horizontalLine1.style.top = `${startY}px`;
          horizontalLine1.style.width = `${halfwayX - startX}px`;
          linksContainer.appendChild(horizontalLine1);

          // Create vertical line
          const verticalLine = document.createElement("div");
          verticalLine.className = styles.techLinkVertical;
          verticalLine.style.left = `${halfwayX}px`;

          // Handle the vertical line positioning (start from top if going down)
          if (endY > startY) {
            verticalLine.style.top = `${startY}px`;
            verticalLine.style.height = `${endY - startY}px`;
          } else {
            verticalLine.style.top = `${endY}px`;
            verticalLine.style.height = `${startY - endY}px`;
          }
          linksContainer.appendChild(verticalLine);

          // Create horizontal line to tech
          const horizontalLine2 = document.createElement("div");
          horizontalLine2.className = styles.techLink;
          horizontalLine2.style.left = `${halfwayX}px`;
          horizontalLine2.style.top = `${endY}px`;
          horizontalLine2.style.width = `${endX - halfwayX}px`;
          linksContainer.appendChild(horizontalLine2);
        }
      });
    });
  }, 0);

  return null;
}

type TechProps = {
  tech: TechnologyChanneled;
};

function Tech({ tech }: TechProps) {
  return (
    <div className={styles.techNode} data-tech-id={tech.id}>
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
