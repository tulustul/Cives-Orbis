import { UnitCore } from "@/core/unit";
import { AiTask, AiTaskOptions } from "./task";
import { AIPlayer } from "../ai-player";

export type WorkerTaskOptions = AiTaskOptions & {
  priority?: number;
};

export abstract class WorkerTask<O extends WorkerTaskOptions, S> extends AiTask<O, S> {
  worker: UnitCore | null = null;

  constructor(ai: AIPlayer, options: O) {
    super(ai, options);
  }

  protected assignWorker(worker: UnitCore): void {
    this.worker = worker;
    this.ai.units.assign(worker, "working");
  }

  protected unassignWorker(): void {
    if (this.worker) {
      this.ai.units.unassign(this.worker);
      this.worker = null;
    }
  }

  cleanup(): void {
    this.unassignWorker();
  }
}