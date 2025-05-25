import { AIPlayer } from "./ai-player";
import { AiOperation } from "./operations/baseOperation";
import { AiOrder } from "./types";

export abstract class AISystem {
  constructor(protected ai: AIPlayer) {}

  abstract plan(): Generator<AiOrder | AiOperation>;

  get player() {
    return this.ai.player;
  }
}
