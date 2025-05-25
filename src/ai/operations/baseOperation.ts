import { AIPlayer } from "../ai-player";
import { AiOrder } from "../types";

export enum AiOperationState {
  active,
  completed,
  failed,
  aborted,
}

// Operation is a long running task.
export abstract class AiOperation {
  operations: AiOperation[] = [];
  state = AiOperationState.active;

  constructor(protected ai: AIPlayer) {}

  abstract plan(): void;
  abstract validate(): boolean;
  abstract execute(): Generator<AiOrder>;

  *exectuteBranch(): Generator<AiOrder> {
    while (this.operations.length > 0) {
      const operation = this.operations[0];
      yield* operation.exectuteBranch();
      if (operation.state != AiOperationState.completed) {
        break;
      }
      this.operations.shift();
    }

    if (this.operations.length == 0) {
      yield* this.execute();
    }
  }

  validateBranch(): boolean {
    if (this.state !== AiOperationState.active) {
      return false;
    }
    const valid = this.operations.every((op) => op.validateBranch());
    return valid && this.validate();
  }

  abort() {
    this.state = AiOperationState.aborted;
    for (const operation of this.operations) {
      operation.abort();
    }
  }
}

export class AiOperationParallel extends AiOperation {
  constructor(ai: AIPlayer, public operations: AiOperation[]) {
    super(ai);
  }

  plan(): void {
    for (const operation of this.operations) {
      operation.plan();
    }
  }

  validate(): boolean {
    return this.operations.every((op) => op.validate());
  }

  *execute(): Generator<AiOrder> {
    for (const operation of this.operations) {
      yield* operation.execute();
    }
  }
}
