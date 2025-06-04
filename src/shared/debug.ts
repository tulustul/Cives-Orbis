import { AiTaskResult, AiTaskStatus } from "./data";

export type AiTaskSerialized<T> = {
  type: string;
  id: number;
  tasks: AiTaskSerialized<any>[];
  data: T;
  status: AiTaskResult | AiTaskStatus;
  reason: string;
};

export type AiDebug = {
  tasks: AiTaskSerialized<any>[];
};
