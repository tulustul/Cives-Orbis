import { AISystem } from "./ai-system";
import { AiOrder } from "./types";

export class MilitaryOperationalAi extends AISystem {
  *plan(): Generator<AiOrder> {}
}
