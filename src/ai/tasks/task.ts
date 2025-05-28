import { AiTaskSerialized } from "@/shared/debug";
import { AIPlayer } from "../ai-player";

export enum AiTaskResult {
  completed,
  failed,
}

export abstract class AiTask<T> {
  readonly type: string = "base";

  tasks: AiTask<any>[] = [];
  result: AiTaskResult | null = null;

  constructor(protected ai: AIPlayer) {}

  abstract tick(): void;
  abstract serialize(): T;
  cleanup() {}

  tickBranch(): void {
    while (this.tasks.length > 0) {
      const task = this.tasks[0];
      task.tickBranch();
      if (task.result === null) {
        break;
      }
      this.tasks.shift();
    }

    if (this.tasks.length == 0) {
      this.tick();
    }
  }

  complete() {
    this.result = AiTaskResult.completed;
    this.cleanupBranch();
  }

  fail() {
    this.result = AiTaskResult.failed;
    this.cleanupBranch();
  }

  serializeBranch(): AiTaskSerialized<T> {
    return {
      type: this.type,
      tasks: this.tasks.map((op) => op.serializeBranch()),
      data: this.serialize(),
    };
  }

  cleanupBranch() {
    this.cleanup();
    for (const task of this.tasks) {
      task.cleanupBranch();
    }
  }

  // static deserializeBranch(data: AiOperationSerialized<void>): AiOperation<void> {
  //   this.result = data.result;
  //   this.operations = data.operations.map((op) => {
  //     const operation = AiOperation.deserialize(op);
  //     operation.deserializeBranch(op);
  //     return operation;
  //   });
  // }
}
