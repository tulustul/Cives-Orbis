import { TechnologyChanneled } from "@/core/serialization/channel";

export function organizeTechsIntoColumns(
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

  return columns.filter((c) => c.length > 0);
}
