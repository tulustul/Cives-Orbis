import { AiTaskSerialized } from "@/shared/debug";
import { AIPlayer } from "../ai-player";
import { AiTaskResult, AiTaskStatus } from "@/shared";

export interface AiTaskOptions {
  onFail?: () => void;
  onComplete?: () => void;
}

export abstract class AiTask<O extends AiTaskOptions, S> {
  readonly type: string = "base";

  static lastId = 0;
  id: number = ++AiTask.lastId;

  tasks: AiTask<any, any>[] = [];
  result: AiTaskResult | null = null;
  status: AiTaskStatus = "pending";
  reason = "";
  private stateHistory: string[] = [];
  private static readonly MAX_HISTORY_LENGTH = 10;
  private static readonly CYCLE_DETECTION_LENGTH = 3;

  constructor(protected ai: AIPlayer, public options: O) {}

  abstract tick(): void;
  abstract serialize(): S;
  cleanup() {}
  init() {}

  /**
   * Override this method to enable cycle detection for the task.
   * Return a string representing the current progress state.
   * If the same state repeats in a cycle, the task will fail.
   * Return null to disable cycle detection.
   */
  getProgressState(): string | null {
    return null;
  }

  tickBranch(): void {
    if (this.result) {
      return;
    }

    // Check for stuck state before processing
    if (this.isStuck()) {
      console.warn(`Task ${this.type} is stuck in a cycle. Failing task.`);
      this.fail("Stuck in cycle");
      return;
    }

    this.tasks = this.tasks.filter((task) => !task.result);

    for (const task of this.tasks) {
      task.tickBranch();
      if (task.result === null) {
        break;
      }

      if (this.checkChildFailure(task)) {
        return;
      }
    }

    if (!this.tasks.length || this.tasks.at(-1)?.result) {
      this.status = "active";
      this.tick();
      // Track state after tick
      this.trackState();
    }
  }

  private trackState(): void {
    const state = this.getProgressState();
    if (state === null) {
      return; // Cycle detection disabled for this task
    }

    this.stateHistory.push(state);
    if (this.stateHistory.length > AiTask.MAX_HISTORY_LENGTH) {
      this.stateHistory.shift();
    }
  }

  private isStuck(): boolean {
    if (this.stateHistory.length < AiTask.CYCLE_DETECTION_LENGTH * 2) {
      return false;
    }

    // Check if the last N states form a repeating cycle
    const cycleLength = AiTask.CYCLE_DETECTION_LENGTH;
    const recent = this.stateHistory.slice(-cycleLength * 2);

    for (let i = 0; i < cycleLength; i++) {
      if (recent[i] !== recent[i + cycleLength]) {
        return false;
      }
    }

    return true;
  }

  protected complete() {
    this.result = "completed";
    this.cleanupBranch();
    if (this.options.onComplete) {
      this.options.onComplete();
    }
  }

  protected fail(reason = "") {
    this.result = "failed";
    this.reason = reason;
    this.cleanupBranch();

    // for (const task of this.tasks) {
    //   task.failSimple();
    // }
    if (this.options.onFail) {
      this.options.onFail();
    }
  }

  // private failSimple() {
  //   if (this.result === "failed") {
  //     return;
  //   }
  //   this.cleanup();
  //   this.result = "failed";
  //   for (const task of this.tasks) {
  //     task.failSimple();
  //   }
  // }

  serializeBranch(): AiTaskSerialized<S> {
    return {
      type: this.type,
      id: this.id,
      tasks: this.tasks.map((op) => op.serializeBranch()),
      data: this.serialize(),
      status: this.result ?? this.status,
      reason: this.reason,
    };
  }

  private cleanupBranch() {
    this.cleanup();
    for (const task of this.tasks) {
      task.cleanupBranch();
    }
  }

  protected addTask(...tasks: AiTask<any, any>[]) {
    this.tasks.push(...tasks);
    for (const task of tasks) {
      task.init();
      if (this.checkChildFailure(task)) {
        return;
      }
    }
  }

  protected checkChildFailure(task: AiTask<any, any>): boolean {
    if (task.result === "failed" && !task.options.onFail) {
      this.fail(`${task.type}: ${task.reason}`);
      return true;
    }
    return false;
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
