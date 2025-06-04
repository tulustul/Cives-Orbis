import { AIPlayer } from "./ai-player";
import { AiTask } from "./tasks/task";
import { AiOrder } from "./types";

export abstract class AISystem {
  constructor(protected ai: AIPlayer) {}

  abstract plan(): Generator<AiOrder | AiTask<any, any>>;

  get player() {
    return this.ai.player;
  }
}
