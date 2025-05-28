import { ProductDefinition, UnitDefinition } from "@/core/data/types";
import { PassableArea } from "@/core/tiles-map";
import { UnitCore } from "@/core/unit";
import { UnitTrait } from "@/shared";
import { AIPlayer } from "../ai-player";
import { AiOrder } from "../types";
import { CityProduceTask } from "./cityProduceTask";
import { AiTask } from "./task";

export type CityProduceTaskOptions = {
  focus?: AiOrder["focus"];
  priority: AiOrder["priority"];
  unitTrait: UnitTrait;
  passableArea?: PassableArea;
  onCompleted?: (unit: UnitCore) => void;
};

export type CityProduceUnitTaskSerialized = {
  focus?: AiOrder["focus"];
  priority: AiOrder["priority"];
  unitTrait: UnitTrait;
  passableArea?: number;
};

type State = "init" | "producing";

export class CityProduceUnitTask extends AiTask<CityProduceUnitTaskSerialized> {
  readonly type = "cityProduceUnit";

  produceTask: CityProduceTask | null = null;

  state: State = "init";

  constructor(ai: AIPlayer, private options: CityProduceTaskOptions) {
    super(ai);
    this.tick();
  }

  tick(): void {
    switch (this.state) {
      case "init":
        return this.init();
      case "producing":
        return this.produce();
    }
  }

  private init(): void {
    let unitDefs = Array.from(this.ai.player.knowledge.discoveredEntities.unit);
    unitDefs = unitDefs.filter((u) =>
      u.traits.includes(this.options.unitTrait),
    );
    const product = getBestUnitDef(unitDefs) as ProductDefinition;
    if (!product) {
      return this.fail();
    }

    this.produceTask = new CityProduceTask(this.ai, {
      focus: this.options.focus,
      priority: this.options.priority,
      product,
      passableArea: this.options.passableArea,
    });
    this.tasks.push(this.produceTask);

    this.state = "producing";
    this.produce();
  }

  private produce(): void {
    if (!this.produceTask?.requestedProduction) {
      return;
    }

    const { city, product } = this.produceTask.requestedProduction;
    const unit = city.tile.units.find((u) => u.definition.id === product.id);
    if (!unit) {
      return this.fail();
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
