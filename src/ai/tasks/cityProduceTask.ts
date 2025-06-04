import { CityCore } from "@/core/city";
import { ProductDefinition } from "@/core/data/types";
import { PassableArea } from "@/core/tiles-map";
import { UnitTrait } from "@/shared";
import { AiOrder } from "../types";
import { AiTask, AiTaskOptions } from "./task";
import { AIPlayer } from "../ai-player";

export type CityProduceTaskOptions = AiTaskOptions & {
  focus?: AiOrder["focus"];
  priority: AiOrder["priority"];
  unitTrait?: UnitTrait;
  product?: ProductDefinition;
  passableArea?: PassableArea;
};

export type RequestedProduction = {
  city: CityCore;
  product: ProductDefinition;
};

export type CityProduceTaskSerialized = {
  options: {
    focus?: AiOrder["focus"];
    priority: AiOrder["priority"];
    unitTrait?: UnitTrait;
    product?: string;
    passableArea?: number;
  };
  requestedProduction: {
    city?: number;
    product?: string;
  };
};

export class CityProduceTask extends AiTask<
  CityProduceTaskOptions,
  CityProduceTaskSerialized
> {
  readonly type = "cityProduce";

  requestedProduction: RequestedProduction | null = null;

  constructor(ai: AIPlayer, options: CityProduceTaskOptions) {
    super(ai, options);
    this.tick();
  }

  tick(): void {
    if (!this.requestedProduction) {
      return this.requestProduction();
    }

    if (this.requestedProduction.city.production.product !== null) {
      // Still producting, waiting to the next turn.
      return;
    }

    this.complete();
  }

  private requestProduction() {
    let product = this.options.product;

    if (!product) {
      return this.fail("No product specified");
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

    this.ai.orders.push({
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
    });
  }

  serialize(): CityProduceTaskSerialized {
    return {
      options: {
        ...this.options,
        product: this.options.product?.id,
        passableArea: this.options.passableArea?.id,
      },
      requestedProduction: {
        city: this.requestedProduction?.city.id,
        product: this.requestedProduction?.product.id,
      },
    };
  }

  // deserialize(data:any) {
  //   this.options.focus = data.focus;
  //   this.options.priority = data.priority;
  //   this.options.product = this.ai.player.knowledge.getProductById(data.product);
  //   this.options.passableArea = this.ai.player.knowledge.getPassableAreaById(
  //     data.passableArea,
  //   );

  //   if (data.requestedProduction) {
  //     this.requestedProduction = {
  //       city: this.ai.player.cities.getById(data.requestedProduction.city),
  //       product: this.ai.player.knowledge.getProductById(
  //         data.requestedProduction.product,
  //       ),
  //     };
  // }
}
