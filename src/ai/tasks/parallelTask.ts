import { AIPlayer } from "../ai-player";
import { AiTask } from "./task";

export class ParallelTask extends AiTask<void> {
  readonly type = "parallel";

  constructor(ai: AIPlayer, public tasks: AiTask<any>[]) {
    super(ai);
    this.tick();
  }

  tick(): void {
    for (const task of this.tasks) {
      task.tick();
    }
    this.tasks = this.tasks.filter((task) => task.result === null);
    if (this.tasks.length === 0) {
      this.complete();
    }
  }

  serialize() {
    return {};
  }
}
