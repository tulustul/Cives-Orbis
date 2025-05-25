import { ProductDefinition, UnitDefinition } from "@/core/data/types";
import { PassableArea } from "@/core/tiles-map";
import { UnitCore } from "@/core/unit";
import { UnitTrait } from "@/shared";
import { AIPlayer } from "../ai-player";
import { AiOrder } from "../types";
import { AiOperation, AiOperationState } from "./baseOperation";
import { CityProduceOperation } from "./cityProduceOperation";

export type CityProduceOperationOptions = {
  focus?: AiOrder["focus"];
  priority: AiOrder["priority"];
  unitTrait: UnitTrait;
  passableArea?: PassableArea;
};

export class CityProduceUnitOperation extends AiOperation {
  resolve = (_: UnitCore) => {};

  unitPromise = new Promise<UnitCore>((resolve) => {
    this.resolve = resolve;
  });

  produceOperation: CityProduceOperation | null = null;

  constructor(ai: AIPlayer, private options: CityProduceOperationOptions) {
    super(ai);
    this.plan();
  }

  plan(): void {
    let unitDefs = Array.from(this.ai.player.knowledge.discoveredEntities.unit);
    unitDefs = unitDefs.filter((u) =>
      u.traits.includes(this.options.unitTrait),
    );
    const product = getBestUnitDef(unitDefs) as ProductDefinition;

    this.produceOperation = new CityProduceOperation(this.ai, {
      focus: this.options.focus,
      priority: this.options.priority,
      product,
      passableArea: this.options.passableArea,
    });

    this.operations.push(this.produceOperation);
  }

  validate(): boolean {
    return true;
  }

  *execute(): Generator<AiOrder> {
    if (!this.produceOperation) {
      return;
    }

    if (this.produceOperation.state === AiOperationState.completed) {
      this.state = AiOperationState.completed;
      return;
    }

    if (!this.produceOperation.requestedProduction) {
      return;
    }

    const { city, product } = this.produceOperation.requestedProduction;
    const unit = city.tile.units.find((u) => u.definition.id === product.id);
    if (!unit) {
      this.state = AiOperationState.failed;
      return;
    }

    this.resolve(unit);
    this.state = AiOperationState.completed;
  }
}

function getBestUnitDef(unitDefs: UnitDefinition[]): UnitDefinition | null {
  let bestUnitDef: UnitDefinition | null = null;
  let bestScore = -Infinity;

  for (const unitDef of unitDefs) {
    if (unitDef.productionCost > bestScore) {
      bestScore = unitDef.productionCost;
      bestUnitDef = unitDef;
    }
  }

  return bestUnitDef;
}
