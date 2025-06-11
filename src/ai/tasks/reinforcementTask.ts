import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { AiTask, AiTaskOptions } from "./task";
import { MoveUnitTask } from "./moveUnitTask";
import {
  tileToTileCoords,
  unitToIdAndName,
} from "@/core/serialization/channel";
import { TileCoords, UnitIdAndName } from "@/shared";

export type ReinforcementTaskOptions = AiTaskOptions & {
  target: TileCore;
  requiredStrength: number;
  priority: number;
  onUnitArrived?: (unit: UnitCore) => void;
};

export type ReinforcementTaskSerialized = {
  target: TileCoords;
  requiredStrength: number;
  state: ReinforcementState;
  reinforcements: UnitIdAndName[];
  currentStrength: number;
};

type ReinforcementState = "selecting" | "moving" | "arriving" | "completed";

export class ReinforcementTask extends AiTask<
  ReinforcementTaskOptions,
  ReinforcementTaskSerialized
> {
  readonly type = "reinforcement";

  private state: ReinforcementState = "selecting";
  private reinforcements: UnitCore[] = [];
  private currentStrength = 0;
  private arrivedUnits = new Set<UnitCore>();

  tick() {
    switch (this.state) {
      case "selecting":
        return this.selectReinforcements();
      case "moving":
        return this.monitorMovement();
      case "arriving":
        return this.processArrivals();
    }
  }

  private selectReinforcements() {
    // Find available military units not already assigned
    const availableUnits: {
      unit: UnitCore;
      distance: number;
      score: number;
    }[] = [];

    for (const unit of this.ai.units.freeByTrait.military) {
      if (unit.parent) continue; // Skip units in transports
      if (unit.health < 50) continue; // Skip heavily damaged units

      const distance = unit.tile.getDistanceTo(this.options.target);
      if (distance > 20) continue; // Too far away

      // Score based on strength and distance
      const score = unit.definition.strength / (distance + 1);

      availableUnits.push({ unit, distance, score });
    }

    // Sort by score (best units first)
    availableUnits.sort((a, b) => b.score - a.score);

    // Select units until we have enough strength
    for (const candidate of availableUnits) {
      if (this.currentStrength >= this.options.requiredStrength) break;

      this.reinforcements.push(candidate.unit);
      this.currentStrength += candidate.unit.definition.strength;
      this.ai.units.assign(candidate.unit, "reinforcement");

      // Create movement task for this unit
      this.addTask(
        new MoveUnitTask(this.ai, {
          unit: candidate.unit,
          tile: this.options.target,
          priority: this.options.priority,
          onComplete: () => {
            this.arrivedUnits.add(candidate.unit);
          },
        }),
      );
    }

    if (this.reinforcements.length === 0) {
      return this.fail("No available reinforcements");
    }

    this.state = "moving";
  }

  private monitorMovement() {
    // Remove dead units
    this.reinforcements = this.reinforcements.filter((u) => u.health > 0);

    if (this.reinforcements.length === 0) {
      return this.fail("All reinforcements eliminated");
    }

    // Check if any units have arrived
    const arrivedCount = this.arrivedUnits.size;
    if (arrivedCount > 0) {
      this.state = "arriving";
    }

    // If all movement tasks are done, we're finished
    if (this.tasks.every((t) => t.result !== null)) {
      this.state = "completed";
      return this.complete();
    }
  }

  private processArrivals() {
    // Hand off arrived units to the parent task
    for (const unit of this.arrivedUnits) {
      if (this.options.onUnitArrived) {
        this.options.onUnitArrived(unit);
      }

      // Unassign from reinforcement duty
      this.ai.units.unassign(unit);
    }

    this.arrivedUnits.clear();
    this.state = "moving";
  }

  cleanup() {
    // Release any units still assigned
    for (const unit of this.reinforcements) {
      if (!this.arrivedUnits.has(unit)) {
        this.ai.units.unassign(unit);
      }
    }
  }

  serialize(): ReinforcementTaskSerialized {
    return {
      target: tileToTileCoords(this.options.target),
      requiredStrength: this.options.requiredStrength,
      state: this.state,
      reinforcements: this.reinforcements
        .map(unitToIdAndName)
        .filter((u) => u !== null),
      currentStrength: this.currentStrength,
    };
  }
}
