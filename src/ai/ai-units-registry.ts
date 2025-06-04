import { PlayerCore } from "@/core/player";
import { UnitCore } from "@/core/unit";
import { UnitAssignmentType, UnitTrait } from "@/shared";

type UnitAssignment = {
  unit: UnitCore;
  type: UnitAssignmentType;
};

function emptyUnitsByAssignmentSets(): Record<
  UnitAssignmentType,
  Set<UnitCore>
> {
  return {
    garrison: new Set(),
    exploration: new Set(),
    transport: new Set(),
    settling: new Set(),
    escort: new Set(),
  };
}

function emptyUnitsByTraits(): Record<UnitTrait, UnitCore[]> {
  return {
    settler: [],
    worker: [],
    military: [],
    explorer: [],
    supply: [],
    land: [],
    naval: [],
    siege: [],
    transport: [],
  };
}

function emptyUnitsByTraitsSets(): Record<UnitTrait, Set<UnitCore>> {
  return {
    settler: new Set(),
    worker: new Set(),
    military: new Set(),
    explorer: new Set(),
    supply: new Set(),
    land: new Set(),
    naval: new Set(),
    siege: new Set(),
    transport: new Set(),
  };
}

export class AiUnitsRegistry {
  byTrait: Record<UnitTrait, UnitCore[]> = emptyUnitsByTraits();
  freeByTrait: Record<UnitTrait, Set<UnitCore>> = emptyUnitsByTraitsSets();
  byAssignment: Record<UnitAssignmentType, Set<UnitCore>> =
    emptyUnitsByAssignmentSets();

  assignments = new Map<UnitCore, UnitAssignment>();

  constructor(private player: PlayerCore) {}

  update() {
    this.byTrait = emptyUnitsByTraits();
    this.freeByTrait = emptyUnitsByTraitsSets();
    this.byAssignment = emptyUnitsByAssignmentSets();
    for (const unit of this.player.units) {
      for (const trait of unit.definition.traits) {
        this.byTrait[trait].push(unit);
        if (this.assignments.has(unit)) {
          this.byAssignment[this.assignments.get(unit)!.type].add(unit);
        } else {
          this.freeByTrait[trait].add(unit);
        }
      }
    }
  }

  assign(unit: UnitCore, type: UnitAssignmentType) {
    this.unassign(unit);
    this.assignments.set(unit, { unit, type });
    this.byAssignment[type].add(unit);
    for (const trait of unit.definition.traits) {
      this.freeByTrait[trait].delete(unit);
    }
  }

  unassign(unit: UnitCore) {
    const assignmentType = this.assignments.get(unit)?.type;
    if (!assignmentType) {
      return;
    }
    this.byAssignment[assignmentType].delete(unit);
    this.assignments.delete(unit);
    for (const trait of unit.definition.traits) {
      this.freeByTrait[trait].add(unit);
    }
  }
}
