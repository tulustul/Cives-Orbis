import { moveAlongPath } from "@/core/movement";
import { findPath } from "@/core/pathfinding";
import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { AIPlayer } from "../ai-player";
import { AiOrder } from "../types";
import { AiOperation, AiOperationState } from "./baseOperation";

export type MoveUnitOperationOptions = {
  tile: TileCore;
  unit?: UnitCore;
  unitPromise?: Promise<UnitCore>;
};

export class MoveUnitOperation extends AiOperation {
  unit: UnitCore | null = null;

  constructor(ai: AIPlayer, private options: MoveUnitOperationOptions) {
    super(ai);
    this.unit = this.options.unit || null;
    if (this.options.unitPromise) {
      this.options.unitPromise.then((unit) => (this.unit = unit));
    }
  }

  plan(): void {
    // this.operations.push();
  }

  validate(): boolean {
    return true;
  }

  *execute(): Generator<AiOrder> {
    if (!this.unit) {
      this.state = AiOperationState.failed;
      return;
    }
    if (this.unit.order !== "go" || !this.unit.path) {
      this.unit.path = findPath(this.unit, this.options.tile);
    }
    if (this.unit.path) {
      this.unit.setOrder("go");
      moveAlongPath(this.unit);
    }
    if (this.unit.tile === this.options.tile) {
      this.state = AiOperationState.completed;
    }
  }
}
