import { ProductDefinition } from "@/core/data/types";
import { AiOrder } from "./types";
import { AISystem } from "./ai-system";
import { PassableArea } from "@/core/tiles-map";

type CityProductionRequest = {
  focus: AiOrder["focus"];
  priority: AiOrder["priority"];
  product: ProductDefinition;
  passableArea?: PassableArea;
};

export class ProductionAI extends AISystem {
  requests: CityProductionRequest[] = [];

  *plan(): Generator<AiOrder> {
    const requests = this.requests;
    this.requests = [];

    for (const request of requests) {
      yield* this.planProduction(request);
    }
  }

  request(request: CityProductionRequest) {
    this.requests.push(request);
  }

  private *planProduction(request: CityProductionRequest): Generator<AiOrder> {
    const cityCandidates = this.player.citiesWithoutProduction.filter(
      (city) =>
        city.production.canProduce(request.product) &&
        (request.passableArea === undefined ||
          city.passableAreas.has(request.passableArea)),
    );

    if (cityCandidates.length === 0) {
      return;
    }

    const city =
      cityCandidates[Math.floor(Math.random() * cityCandidates.length)];

    yield {
      group: "city-produce",
      entityId: city.id,
      focus: request.focus,
      priority: request.priority,
      perform: () => {
        city.production.produce(request.product);
      },
    };
  }
}
