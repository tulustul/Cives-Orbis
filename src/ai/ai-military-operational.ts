import { AISystem } from "./ai-system";
import { AiOperation } from "./types";

export class MilitaryOperationalAi extends AISystem {
  plan(): AiOperation[] {
    this.operations = [];

    return this.operations;
  }
}
