import { ProductDefinition, UnitDefinition } from "@/core/data/types";
import { PassableArea } from "@/core/tiles-map";
import { UnitCore } from "@/core/unit";
import { UnitTrait } from "@/shared";
import { AiOrder } from "../types";
import { CityProduceTask } from "./cityProduceTask";
import { AiTask, AiTaskOptions } from "./task";

export type CityProduceUnitTaskOptions = AiTaskOptions & {
  focus?: AiOrder["focus"];
  priority: AiOrder["priority"];
  unitTrait: UnitTrait[];
  passableArea?: PassableArea;
  onCompleted?: (unit: UnitCore) => void;
};

export type CityProduceUnitTaskSerialized = {
  focus?: AiOrder["focus"];
  priority: AiOrder["priority"];
  unitTrait: UnitTrait[];
  passableArea?: number;
};

export class CityProduceUnitTask extends AiTask<
  CityProduceUnitTaskOptions,
  CityProduceUnitTaskSerialized
> {
  readonly type = "cityProduceUnit";

  produceTask: CityProduceTask | null = null;

  init() {
    let unitDefs = Array.from(this.ai.player.knowledge.discoveredEntities.unit);
    unitDefs = unitDefs.filter((u) => {
      for (const trait of this.options.unitTrait) {
        if (!u.traits.includes(trait)) {
          return false;
        }
      }
      return true;
    });
    const product = getBestUnitDef(unitDefs) as ProductDefinition;
    if (!product) {
      return this.fail("No suitable unit definition found");
    }

    this.produceTask = new CityProduceTask(this.ai, {
      focus: this.options.focus,
      priority: this.options.priority,
      product,
      passableArea: this.options.passableArea,
    });
    this.addTask(this.produceTask);
  }

  tick(): void {
    if (!this.produceTask?.requestedProduction) {
      return;
    }

    const { city, product } = this.produceTask.requestedProduction;
    const unit = city.tile.units.find((u) => u.definition.id === product.id);
    if (!unit) {
      return this.fail("Produced unit not found in city tile");
    }

    if (this.options.onCompleted) {
      this.options.onCompleted(unit);
    }
    this.complete();
  }

  serialize(): CityProduceUnitTaskSerialized {
    return {
      priority: this.options.priority,
      unitTrait: this.options.unitTrait,
      focus: this.options.focus,
      passableArea: this.options.passableArea?.id,
    };
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
