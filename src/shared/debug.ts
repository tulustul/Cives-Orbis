import { AiTaskResult, AiTaskStatus, UnitAssignmentType } from "./data";

export type AiTaskSerialized<T> = {
  type: string;
  id: number;
  tasks: AiTaskSerialized<any>[];
  data: T;
  status: AiTaskResult | AiTaskStatus;
  reason: string;
};

export type AiDebugTasks = {
  tasks: AiTaskSerialized<any>[];
};

export type AiDebugUnitsRegistryUnit = {
  id: number;
  name: string;
  assignment: UnitAssignmentType | null;
};

export type AiDebugUnitsRegistry = {
  units: AiDebugUnitsRegistryUnit[];
};
