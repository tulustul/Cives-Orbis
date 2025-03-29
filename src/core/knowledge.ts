import { collector } from "./collector";
import { getTechById, TECHNOLOGIES } from "./data-manager";
import { Technology } from "./data.interface";
import { PlayerCore } from "./player";

export type KnowledgeTechState =
  | "discovered"
  | "researching"
  | "available"
  | "queued"
  | "unavailable";

export class Knowledge {
  discoveredTechs = new Set<Technology>();

  availableTechs = new Set<Technology>();

  researchingTech: Technology | null = null;

  techQueue: Technology[] = [];

  accumulated: Map<Technology, number> = new Map();

  overflow = 0;

  constructor(public player: PlayerCore) {
    this.discoveredTechs.add(getTechById("tech_society"));
    this.computeAvailableTechs();
  }

  nextTurn() {
    if (!this.researchingTech) {
      return;
    }

    let accumulated = this.accumulated.get(this.researchingTech) ?? 0;

    accumulated += this.player.yields.income.knowledge + this.overflow;
    this.overflow = 0;

    const overflow = accumulated - this.researchingTech.cost;
    if (overflow < 0) {
      this.accumulated.set(this.researchingTech, accumulated);
    } else {
      this.discoveredTechs.add(this.researchingTech);
      this.accumulated.delete(this.researchingTech);
      this.techQueue.shift();

      if (this.techQueue.length > 0) {
        this.researchingTech = this.techQueue[0];
        this.accumulated.set(this.researchingTech, overflow);
      } else {
        this.researchingTech = null;
        this.overflow = overflow;
      }

      this.computeAvailableTechs();
    }

    if (this.player.game.trackedPlayer === this.player) {
      collector.tech = this.researchingTech;
    }
  }

  research(tech: Technology) {
    if (this.discoveredTechs.has(tech)) {
      return;
    }

    this.techQueue = [tech];
    const toVisit = [...tech.requiredTechnologies];
    while (toVisit.length > 0) {
      const requiredTech = toVisit.pop()!;
      if (this.discoveredTechs.has(requiredTech)) {
        continue;
      }
      this.techQueue.unshift(requiredTech);
      toVisit.push(...requiredTech.requiredTechnologies);
    }

    // Remove duplicates
    this.techQueue = Array.from(new Set(this.techQueue));

    this.researchingTech = this.techQueue[0];
    collector.tech = this.researchingTech;
  }

  computeAvailableTechs() {
    this.availableTechs.clear();
    for (const tech of TECHNOLOGIES) {
      if (this.discoveredTechs.has(tech)) {
        continue;
      }
      const canBeResearched = tech.requiredTechnologies.every((requiredTech) =>
        this.discoveredTechs.has(requiredTech)
      );
      if (canBeResearched) {
        this.availableTechs.add(tech);
      }
    }
  }

  getTurnsToResearch(tech: Technology): number {
    if (this.discoveredTechs.has(tech)) {
      return 0;
    }

    const accumulated = this.accumulated.get(tech) ?? 0;
    const remaining = tech.cost - accumulated;
    return Math.ceil(remaining / this.player.yields.income.knowledge);
  }

  getTechState(tech: Technology): KnowledgeTechState {
    if (this.discoveredTechs.has(tech)) {
      return "discovered";
    }
    if (this.researchingTech === tech) {
      return "researching";
    }
    if (this.availableTechs.has(tech)) {
      return "available";
    }
    if (this.techQueue.includes(tech)) {
      return "queued";
    }
    return "unavailable";
  }

  getTechQueuePosition(tech: Technology): number | null {
    const index = this.techQueue.indexOf(tech);
    if (index <= 0) {
      return null;
    }
    return index;
  }
}
