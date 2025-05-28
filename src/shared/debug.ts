export type AiTaskSerialized<T> = {
  type: string;
  tasks: AiTaskSerialized<any>[];
  data: T;
};

export type AiDebug = {
  tasks: AiTaskSerialized<any>[];
};
