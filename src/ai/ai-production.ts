import { ProductDefinition } from "@/core/data/types";
import { AiOperation } from "./types";
import { AISystem } from "./ai-system";
import { PassableArea } from "@/core/tiles-map";

type CityProductionRequest = {
  focus: AiOperation["focus"];
  priority: AiOperation["priority"];
  product: ProductDefinition;
  passableArea?: PassableArea;
};

export class ProductionAI extends AISystem {
  requests: CityProductionRequest[] = [];

  plan() {
    this.operations = [];
    const requests = this.requests;
    this.requests = [];

    for (const request of requests) {
      this.planProduction(request);
    }

    return this.operations;
  }

  request(request: CityProductionRequest) {
    this.requests.push(request);
  }

  private planProduction(request: CityProductionRequest) {
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

    this.operations.push({
      group: "city-produce",
      entityId: city.id,
      focus: request.focus,
      priority: request.priority,
      perform: () => {
        city.production.produce(request.product);
      },
    });
  }
}
