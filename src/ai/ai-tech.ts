import { AISystem } from "./ai-system";
import { AiOperation } from "./types";

export class TechAI extends AISystem {
  plan(): AiOperation[] {
    const knowledge = this.player.knowledge;
    if (!knowledge.researchingTech) {
      const techs = Array.from(knowledge.availableTechs);
      if (techs.length > 0) {
        const tech = techs[Math.floor(Math.random()) * techs.length];
        knowledge.research(tech);
      }
    }
    return [];
  }
}
