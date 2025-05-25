import { CityCore } from "@/core/city";
import { ProductDefinition } from "@/core/data/types";
import { PassableArea } from "@/core/tiles-map";
import { UnitCore } from "@/core/unit";
import { UnitTrait } from "@/shared";
import { AIPlayer } from "../ai-player";
import { AiOrder } from "../types";
import { AiOperation, AiOperationState } from "./baseOperation";

export type UnitPromise = {
  unit?: UnitCore | null;
};

export type CityProduceOperationOptions = {
  focus?: AiOrder["focus"];
  priority: AiOrder["priority"];
  product?: ProductDefinition;
  unitTrait?: UnitTrait;
  passableArea?: PassableArea;
};

export type RequestedProduction = {
  city: CityCore;
  product: ProductDefinition;
};

export class CityProduceOperation extends AiOperation {
  unitPromise: Promise<UnitCore> | null = null;
  requestedProduction: RequestedProduction | null = null;

  constructor(ai: AIPlayer, private options: CityProduceOperationOptions) {
    super(ai);
  }

  plan(): void {}

  validate(): boolean {
    return true;
  }

  *execute(): Generator<AiOrder> {
    if (this.requestedProduction) {
      if (this.requestedProduction.city.production.product !== null) {
        // Still producting, waiting to the next turn.
        return;
      }

      this.state = AiOperationState.completed;
      return;
    }

    let product = this.options.product;

    if (!product) {
      this.state = AiOperationState.failed;
      return;
    }

    const cityCandidates = this.ai.player.citiesWithoutProduction.filter(
      (city) =>
        city.production.canProduce(product) &&
        (this.options.passableArea === undefined ||
          city.passableAreas.has(this.options.passableArea)),
    );

    if (cityCandidates.length === 0) {
      return;
    }

    const city =
      cityCandidates[Math.floor(Math.random() * cityCandidates.length)];

    yield {
      group: "city-produce",
      entityId: city.id,
      focus: this.options.focus,
      priority: this.options.priority,
      perform: () => {
        city.production.produce(product);
        this.requestedProduction = {
          city,
          product,
        };
      },
    };
  }
}
