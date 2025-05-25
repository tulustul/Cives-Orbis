import { AiPriorities } from "./ai-player";

// Order is a single time action.
export type AiOrder = {
  group: "unit" | "city" | "city-produce";
  focus?: keyof Omit<AiPriorities, "randomize">;
  entityId: number;
  priority: number;
  perform: () => void;
};
