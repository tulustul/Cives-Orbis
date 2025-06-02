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
  private stateHistory: string[] = [];
  private static readonly MAX_HISTORY_LENGTH = 10;
  private static readonly CYCLE_DETECTION_LENGTH = 3;

  constructor(protected ai: AIPlayer) {}

  abstract tick(): void;
  abstract serialize(): T;
  cleanup() {}

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
    // Check for stuck state before processing
    if (this.isStuck()) {
      console.warn(`Task ${this.type} is stuck in a cycle. Failing task.`);
      this.fail();
      return;
    }

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
