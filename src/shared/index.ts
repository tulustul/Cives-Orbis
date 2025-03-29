import { Yields } from "../core/yields";

export * from "./tile.interface";

export type PlayerTask =
  | {
      task: "city" | "unit";
      id: number;
    }
  | { task: "chooseTech" };

export interface PlayerYields {
  perTurn: Yields;
  income: Yields;
  total: Yields;
  costs: Yields;
}
