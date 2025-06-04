import { AIPlayer } from "../ai-player";
import { AiTask, AiTaskOptions } from "./task";

export class ParallelTask extends AiTask<AiTaskOptions, void> {
  readonly type = "parallel";

  constructor(
    ai: AIPlayer,
    public tasks: AiTask<any, any>[],
    public options: AiTaskOptions = {},
  ) {
    super(ai, options);
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
