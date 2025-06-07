import { PassableArea } from "@/core/tiles-map";
import { AreaAssignmentType } from "@/shared";

type AreaAssignment = {
  area: PassableArea;
  types: Record<AreaAssignmentType, number>;
};

function emptyAreasByAssignment(): Record<
  AreaAssignmentType,
  AreaAssignment[]
> {
  return {
    exploration: [],
  };
}

function emptyArea(): Record<AreaAssignmentType, number> {
  return {
    exploration: 0,
  };
}

export class AiAreaRegistry {
  byAssignment = emptyAreasByAssignment();

  assignments = new Map<PassableArea, AreaAssignment>();

  assign(area: PassableArea | undefined | null, type: AreaAssignmentType) {
    if (!area) {
      return;
    }
    let assignment = this.assignments.get(area);
    if (!assignment) {
      assignment = { area, types: emptyArea() };
      this.assignments.set(area, assignment);
    }
    assignment.types[type]++;
    this.byAssignment[type].push(assignment);
  }

  unassign(area: PassableArea | undefined | null, type: AreaAssignmentType) {
    if (!area) {
      return;
    }
    const assignment = this.assignments.get(area);
    if (assignment) {
      assignment.types[type]--;
    }
  }

  getAreaAssignments(area: PassableArea, type: AreaAssignmentType): number {
    return this.assignments.get(area)?.types[type] ?? 0;
  }
}
