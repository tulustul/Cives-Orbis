import { collector } from "./collector";
import {
  buildingDefs,
  getTechById,
  idleProductDefs,
  TECHNOLOGIES,
  unitDefs,
} from "./data-manager";
import {
  Building,
  IdleProduct,
  RequireTech,
  Technology,
  UnitDefinition,
} from "./data.interface";
import { PlayerCore } from "./player";

export type KnowledgeTechState =
  | "discovered"
  | "researching"
  | "available"
  | "queued"
  | "unavailable";

export class Knowledge {
  discoveredTechs = new Set<Technology>();
  discoveredBuildings = new Set<Building>();
  discoveredUnits = new Set<UnitDefinition>();
  discoveredIdleProducts = new Set<IdleProduct>();

  availableTechs = new Set<Technology>();

  researchingTech: Technology | null = null;

  techQueue: Technology[] = [];

  accumulated: Map<Technology, number> = new Map();

  overflow = 0;

  constructor(public player: PlayerCore) {
    this.discoveredTechs.add(getTechById("tech_society"));
    this.update();
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

      if (this.player.game.trackedPlayer === this.player) {
        collector.newTechs.push(this.researchingTech);
      }

      if (this.techQueue.length > 0) {
        this.researchingTech = this.techQueue[0];
        this.accumulated.set(this.researchingTech, overflow);
      } else {
        this.researchingTech = null;
        this.overflow = overflow;
      }

      this.update();
    }

    if (this.player.game.trackedPlayer === this.player) {
      collector.research = this.researchingTech;
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
    collector.research = this.researchingTech;
  }

  update() {
    this.computeAvailableTechs();
    this.computeKnownEntities();
  }

  private computeAvailableTechs() {
    this.availableTechs.clear();
    for (const tech of TECHNOLOGIES) {
      if (this.discoveredTechs.has(tech)) {
        continue;
      }
      const canBeResearched = tech.requiredTechnologies.every((requiredTech) =>
        this.discoveredTechs.has(requiredTech),
      );
      if (canBeResearched) {
        this.availableTechs.add(tech);
      }
    }
  }

  private computeKnownEntities() {
    this.filterDiscoveredEntities(this.discoveredUnits, unitDefs);
    this.filterDiscoveredEntities(this.discoveredBuildings, buildingDefs);
    this.filterDiscoveredEntities(this.discoveredIdleProducts, idleProductDefs);
  }

  private filterDiscoveredEntities(set: Set<RequireTech>, defs: RequireTech[]) {
    set.clear();
    for (const def of defs) {
      if (def.technology && this.discoveredTechs.has(def.technology)) {
        set.add(def);
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
