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
  }

  tickBranch(): void {
    this.tick();
  }

  tick(): void {
    if (this.result) {
      return;
    }

    this.status = "active";
    this.tasks = this.tasks.filter((task) => !task.result);

    for (const task of this.tasks) {
      task.tickBranch();
      if (this.checkChildFailure(task)) {
        return;
      }
    }

    const notCompletedTasks = this.tasks.filter((task) => task.result === null);

    if (notCompletedTasks.length === 0) {
      this.complete();
    }
  }

  serialize() {
    return {};
  }
}
