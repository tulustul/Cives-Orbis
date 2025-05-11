import { dataManager } from "@/core/data/dataManager";
import { ResourceRichness } from "@/core/data/jsonTypes";
import { randomNormal } from "@/core/random";
import { ResourceDeposit } from "@/core/resources";
import { getResourceRichness } from "@/core/tile-utils";
import { TilesMapCore } from "@/core/tiles-map";

type Distribution = { mean: number; stddev: number };

const BASE_RICHNESS: Record<ResourceRichness, Distribution> = {
  veryPoor: { mean: 1, stddev: 1 },
  poor: { mean: 2, stddev: 2 },
  rich: { mean: 3, stddev: 2 },
  veryRich: { mean: 4, stddev: 3 },
};

export function placeResources(
  map: TilesMapCore,
  globalAbundance: number,
  globalRichness: number,
) {
  const resources = dataManager.resources.categories.natural;

  for (const tile of map.tilesMap.values()) {
    if (Math.random() > globalAbundance) {
      continue;
    }

    const resourceIndex = Math.floor(Math.random() * resources.length);
    const resourceDef = resources[resourceIndex];

    const resourceRichness = getResourceRichness(tile, resourceDef);
    if (resourceRichness === null) {
      continue;
    }

    const quantity = getQuantity(resourceRichness, globalRichness);

    tile.resource = ResourceDeposit.from({
      def: resourceDef,
      tile,
      quantity,
      difficulty: 0,
    });
  }
}

function getQuantity(
  resourceRichness: ResourceRichness,
  globalRichness: number,
): number {
  const base = BASE_RICHNESS[resourceRichness];
  const mean = base.mean * globalRichness;
  const stddev = base.stddev * globalRichness;
  return Math.max(1, Math.ceil(randomNormal(mean, stddev)));
}
