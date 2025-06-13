import { PlayerCore } from "@/core/player";
import { UnitGroup } from "@/core/unitGroup";
import { UnitAssignmentType, UnitTrait } from "@/shared";

type UnitAssignment = {
  unit: UnitGroup;
  type: UnitAssignmentType;
};

function emptyUnitsByAssignmentSets(): Record<
  UnitAssignmentType,
  Set<UnitGroup>
> {
  return {
    garrison: new Set(),
    exploration: new Set(),
    transport: new Set(),
    settling: new Set(),
    escort: new Set(),
    working: new Set(),
    defense: new Set(),
    reinforcement: new Set(),
    intercept: new Set(),
    army: new Set(),
  };
}

function emptyUnitsByTraits(): Record<UnitTrait, UnitGroup[]> {
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

function emptyUnitsByTraitsSets(): Record<UnitTrait, Set<UnitGroup>> {
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
  byTrait: Record<UnitTrait, UnitGroup[]> = emptyUnitsByTraits();
  freeByTrait: Record<UnitTrait, Set<UnitGroup>> = emptyUnitsByTraitsSets();
  byAssignment: Record<UnitAssignmentType, Set<UnitGroup>> =
    emptyUnitsByAssignmentSets();

  assignments = new Map<UnitGroup, UnitAssignment>();

  constructor(private player: PlayerCore) {}

  update() {
    this.byTrait = emptyUnitsByTraits();
    this.freeByTrait = emptyUnitsByTraitsSets();
    this.byAssignment = emptyUnitsByAssignmentSets();
    for (const unit of this.player.unitGroups) {
      for (const trait of unit.traits) {
        this.byTrait[trait].push(unit);
        if (this.assignments.has(unit)) {
          this.byAssignment[this.assignments.get(unit)!.type].add(unit);
        } else {
          this.freeByTrait[trait].add(unit);
        }
      }
    }
  }

  assign(unit: UnitGroup, type: UnitAssignmentType) {
    this.unassign(unit);
    this.assignments.set(unit, { unit, type });
    this.byAssignment[type].add(unit);
    for (const trait of unit.traits) {
      this.freeByTrait[trait].delete(unit);
    }
  }

  unassign(unit: UnitGroup) {
    const assignmentType = this.assignments.get(unit)?.type;
    if (!assignmentType) {
      return;
    }
    this.byAssignment[assignmentType].delete(unit);
    this.assignments.delete(unit);
    for (const trait of unit.traits) {
      this.freeByTrait[trait].add(unit);
    }
  }
}
