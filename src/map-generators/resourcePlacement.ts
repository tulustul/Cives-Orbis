import { dataManager } from "@/core/data/dataManager";
import { ResourceAbundance, ResourceRichness } from "@/core/data/jsonTypes";
import { ResourceDefinition } from "@/core/data/types";
import { randomNormal } from "@/core/random";
import { ResourceDeposit } from "@/core/resources";
import { TileCore } from "@/core/tile";
import { getResourceDistribution } from "@/core/tile-utils";
import { TilesMapCore } from "@/core/tiles-map";
import { LandForm, SeaLevel } from "@/shared";

type Distribution = { mean: number; stddev: number };

const BASE_RICHNESS: Record<ResourceRichness, Distribution> = {
  veryPoor: { mean: 1, stddev: 1 },
  poor: { mean: 2, stddev: 2 },
  rich: { mean: 3, stddev: 2 },
  veryRich: { mean: 4, stddev: 3 },
};

const BASE_ABUDANCE: Record<ResourceAbundance, number> = {
  veryRare: 0.2,
  rare: 0.6,
  common: 1.3,
  veryCommon: 2,
};

export function placeResources(
  map: TilesMapCore,
  globalAbundance: number,
  globalRichness: number,
) {
  const options: ResourceGenerationOptions = {
    map,
    globalAbundance,
    globalRichness,
  };
  const mineralOptions = { ...options, globalAbundance: globalAbundance * 0.5 };

  map.precomputePassableAreas();
  const cat = dataManager.resources.categories;

  const strategicMinerals = intersection(cat.strategic, cat.mineral);
  const strategicOrganic = intersection(cat.strategic, cat.organic);
  const livestockFood = intersection(cat.livestock, cat.food);
  const secondaryCrop = difference(
    intersection(cat.crop, cat.food),
    cat.primaryFood,
  );
  const luxuryMineral = intersection(cat.luxury, cat.mineral);
  const luxuryOrganic = intersection(cat.luxury, cat.organic);
  const foodGlobal = intersection(cat.food, cat.mineral);

  new MineralResourceGenerator(strategicMinerals, mineralOptions).generate();
  new OrganicResourceGenerator(strategicOrganic, options).generate();
  new OrganicResourceGenerator(cat.primaryFood, options).generate();
  new OrganicResourceGenerator(livestockFood, options).generate();
  new OrganicResourceGenerator(secondaryCrop, options).generate();
  new OrganicResourceGenerator(luxuryOrganic, options).generate();
  new MineralResourceGenerator(luxuryMineral, mineralOptions).generate();
  new MineralResourceGenerator(foodGlobal, options).generate();
}

function intersection<T>(a: T[], b: T[]): T[] {
  return Array.from(new Set(a.filter((obj) => b.includes(obj))));
}

function difference<T>(a: T[], b: T[]): T[] {
  const bSet = new Set(b);
  return a.filter((item) => !bSet.has(item));
}

function pickRandom<T>(arr: T[]): T {
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
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

type ResourceGenerationOptions = {
  map: TilesMapCore;
  globalAbundance: number;
  globalRichness: number;
};

abstract class ResourceGenerator {
  protected globalAbundance: number;
  protected globalRichness: number;
  protected map: TilesMapCore;

  constructor(
    protected resources: ResourceDefinition[],
    options: ResourceGenerationOptions,
  ) {
    this.map = options.map;
    this.globalAbundance = options.globalAbundance;
    this.globalRichness = options.globalRichness;
  }

  abstract generate(): void;

  protected place(distribution: Map<ResourceDefinition, TileCore[]>) {
    for (const [resourceDef, tiles] of distribution) {
      for (const tile of tiles) {
        if (tile.resource) {
          continue;
        }

        const distribution = getResourceDistribution(tile, resourceDef);

        if (!distribution) {
          continue;
        }

        const abudance =
          this.globalAbundance * BASE_ABUDANCE[distribution.abundance];
        if (Math.random() > abudance) {
          continue;
        }
        const quantity = getQuantity(
          distribution.richness,
          this.globalRichness,
        );
        tile.resource = ResourceDeposit.from({
          def: resourceDef,
          tile,
          quantity,
          difficulty: 0,
        });
      }
    }
  }
}

class MineralResourceGenerator extends ResourceGenerator {
  generate() {
    const distribution = new Map<ResourceDefinition, TileCore[]>();

    for (const resourceDef of this.resources) {
      const tiles: TileCore[] = [];
      for (const tile of this.map.tilesMap.values()) {
        tiles.push(tile);
      }
      distribution.set(resourceDef, tiles);
    }

    this.place(distribution);
  }
}

class OrganicResourceGenerator extends ResourceGenerator {
  private resultAreas = new Map<ResourceDefinition, TileCore[]>();

  private frontiers = new Map<ResourceDefinition, Set<TileCore>>();

  private globallyClaimedTiles = new Set<TileCore>();

  private visitedTiles = new Map<ResourceDefinition, Set<TileCore>>();

  private delayedTiles = new Map<string, number>();

  generate() {
    this.buildStartingLocations();
    const distribution = this.expand();
    this.place(distribution);
  }

  private buildStartingLocations() {
    for (const resource of this.resources) {
      const potentialStartTiles: TileCore[] = [];
      for (const tile of this.map.tilesMap.values()) {
        if (
          !this.globallyClaimedTiles.has(tile) &&
          getResourceDistribution(tile, resource) &&
          tile.landForm !== LandForm.mountains &&
          tile.seaLevel === SeaLevel.none
        ) {
          potentialStartTiles.push(tile);
        }
      }

      if (potentialStartTiles.length > 0) {
        const startTile = pickRandom(potentialStartTiles);
        this.resultAreas.set(resource, [startTile]);
        this.frontiers.set(resource, new Set([startTile]));
        this.globallyClaimedTiles.add(startTile);
        this.visitedTiles.set(resource, new Set([startTile]));
      }
    }
  }

  private expand() {
    let expansionOccurredInWave = true;
    while (expansionOccurredInWave) {
      expansionOccurredInWave = false;
      const nextWaveFrontiersForAllResources = new Map<
        ResourceDefinition,
        Set<TileCore>
      >();

      for (const resource of this.resources) {
        const visited = this.visitedTiles.get(resource)!;
        const currentResourceFrontier = this.frontiers.get(resource);
        const newFrontierTilesForThisResource = new Set<TileCore>();
        const resourceAreaList = this.resultAreas.get(resource)!;

        if (!currentResourceFrontier || currentResourceFrontier.size === 0) {
          nextWaveFrontiersForAllResources.set(resource, new Set());
          continue;
        }

        for (const tile of currentResourceFrontier) {
          const isSuitable = !!getResourceDistribution(tile, resource);

          if (!isSuitable) {
            const key = `${resource.id}:${tile.x},${tile.y}`;
            const delayCount = this.delayedTiles.get(key) ?? 20;
            if (delayCount > 0) {
              this.delayedTiles.set(key, delayCount - 1);
              newFrontierTilesForThisResource.add(tile);
              expansionOccurredInWave = true;
              continue;
            }
            this.delayedTiles.delete(key);
          }

          for (const neighbor of tile.neighbours) {
            if (this.globallyClaimedTiles.has(neighbor)) {
              continue;
            }

            if (visited.has(neighbor)) {
              continue;
            }

            visited.add(neighbor);
            resourceAreaList.push(neighbor);
            this.globallyClaimedTiles.add(neighbor);
            newFrontierTilesForThisResource.add(neighbor);
            expansionOccurredInWave = true;
          }
        }

        nextWaveFrontiersForAllResources.set(
          resource,
          newFrontierTilesForThisResource,
        );
      }

      this.frontiers = nextWaveFrontiersForAllResources;
    }

    return this.resultAreas;
  }
}
