import { EntityType, ResourceCategory } from "@/shared";

import nationsUrl from "@/data/nations.json?url";
import buildingsUrl from "@/data/buildings.json?url";
import idleProductsUrl from "@/data/idleProducts.json?url";
import unitsUrl from "@/data/units.json?url";
import populationTypesUrl from "@/data/populationTypes.json?url";
import resourcesUrl from "@/data/resources.json?url";
import tileImprovementsUrl from "@/data/tileImprovements.json?url";
import techsUrl from "@/data/techs.json?url";
import {
  Building,
  Entity,
  Nation,
  PopulationTypeDefinition,
  ResourceDefinition,
  ResourceDepositDefinition,
  ResourceDistribution,
  Technology,
  TileImprovementDefinition,
  UnitDefinition,
} from "@/core/data/types";
import {
  JsonBuilding,
  JsonData,
  JsonEntity,
  JsonNation,
  JsonPopulationType,
  JsonRequirement,
  JsonResource,
  JsonTechnology,
  JsonTileImprovement,
  JsonUnit,
} from "./jsonTypes";
import {
  CityHaveBuildingRequirement,
  CitySizeRequirement,
  CoastlineCityRequirement,
  NeverRequirement,
  Requirement,
} from "../requirements";
import {
  climateNamesInverse,
  landFormNamesInverse,
  seaLevelNamesInverse,
  UnitTraitNamesInverse,
  UnitTypeNamesInverse,
} from "./const";
import path from "node:path";

export class DataManager {
  private markAsReady!: () => void;

  ready = new Promise<void>((resolve) => {
    this.markAsReady = resolve;
  });

  nations = new NationProvider(this, nationsUrl);
  buildings = new BuildingProvider(this, buildingsUrl);
  idleProducts = new BuildingProvider(this, idleProductsUrl);
  units = new UnitProvider(this, unitsUrl);
  tileImprovements = new TileImprovementProvider(this, tileImprovementsUrl);
  resources = new ResourceProvider(this, resourcesUrl);
  populationTypes = new PopulationTypeProvider(this, populationTypesUrl);
  technologies = new TechProvider(this, techsUrl);

  providers: Record<EntityType, EntityProvider<any, any>> = {
    building: this.buildings,
    idleProduct: this.idleProducts,
    unit: this.units,
    tileImprovement: this.tileImprovements,
    resource: this.resources,
    nation: this.nations,
    populationType: this.populationTypes,
    technology: this.technologies,
  };

  map = new Map<string, Entity>();

  constructor() {
    this.init();
  }

  async init() {
    const providers: EntityProvider<any, any>[] = [
      this.nations,
      this.buildings,
      this.idleProducts,
      this.units,
      this.tileImprovements,
      this.resources,
      this.populationTypes,
      this.technologies,
    ];
    await Promise.all(providers.map((provider) => provider.fetch()));

    const all: Entity[] = providers.reduce<Entity[]>((acc, provider) => {
      return acc.concat(provider.all);
    }, []);
    for (const entity of all) {
      this.map.set(entity.id, entity);
    }

    for (const provider of providers) {
      for (const entity of provider.all) {
        const json = provider.jsons.get(entity.id);
        provider.resolveReferences(entity, json);
      }
      provider.jsons.clear(); // no longer needed, release memory
    }

    this.markAsReady();
  }

  get(id: string) {
    const entity = this.map.get(id);
    if (!entity) {
      throw new Error(`Entity with id "${id}" not found`);
    }
    return entity;
  }
}

abstract class EntityProvider<T extends Entity, K extends JsonEntity> {
  public map: Map<string, T> = new Map();
  public jsons: Map<string, K> = new Map();
  public all: T[] = [];

  constructor(protected manager: DataManager, private url: string) {}

  async fetch() {
    const data = await fetchJson<JsonData<K>>(this.url);

    for (const json of data.items) {
      const parsed = this.parse(json);
      this.map.set(parsed.id, parsed);
      this.jsons.set(parsed.id, json);
      this.all.push(parsed);
    }
  }

  get(id: string): T {
    const entity = this.map.get(id);
    if (!entity) {
      throw new Error(`Entity with id "${id}" not found`);
    }
    return entity;
  }

  pickRandom(exclude: T[] = []): T {
    const filtered = this.all.filter((entity) => !exclude.includes(entity));
    if (filtered.length === 0) {
      throw new Error("No entities left to pick from");
    }
    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex];
  }

  abstract parse(json: K): T;

  resolveReferences(_: T, __: K): void {}
}

class NationProvider extends EntityProvider<Nation, JsonNation> {
  parse(json: JsonNation): Nation {
    return { ...json, entityType: "nation" };
  }
}

class BuildingProvider extends EntityProvider<Building, JsonBuilding> {
  parse(json: JsonBuilding): Building {
    return {
      ...json,
      entityType: "building",
      weakRequirements: parseRequirements(json.weakRequirements),
      strongRequirements: parseRequirements(json.weakRequirements),
    };
  }

  resolveReferences(building: Building, json: JsonBuilding) {
    building.technology = this.manager.technologies.unlocks.get(json.id);
  }
}

class UnitProvider extends EntityProvider<UnitDefinition, JsonUnit> {
  parse(json: JsonUnit): UnitDefinition {
    return {
      ...json,
      entityType: "unit",
      type: UnitTypeNamesInverse[json.type],
      trait: UnitTraitNamesInverse[json.trait],
      weakRequirements: parseRequirements(json.weakRequirements),
      strongRequirements: parseRequirements(json.weakRequirements),
    };
  }

  resolveReferences(unit: UnitDefinition, json: JsonUnit) {
    unit.technology = this.manager.technologies.unlocks.get(json.id);
  }
}

class TileImprovementProvider extends EntityProvider<
  TileImprovementDefinition,
  JsonTileImprovement
> {
  parse(json: JsonTileImprovement): TileImprovementDefinition {
    return {
      ...json,
      entityType: "tileImprovement",
      seaLevels: json.seaLevels?.map(
        (seaLevel) => seaLevelNamesInverse[seaLevel],
      ),
      landForms: json.landForms?.map(
        (landForm) => landFormNamesInverse[landForm],
      ),
      climates: json.climates?.map((climate) => climateNamesInverse[climate]),
      spawnsResource: undefined,
    };
  }

  resolveReferences(
    tileImprovement: TileImprovementDefinition,
    json: JsonTileImprovement,
  ) {
    if (json.spawnsResource) {
      tileImprovement.spawnsResource = this.manager.resources.get(
        json.spawnsResource,
      );
    }
    tileImprovement.technology = this.manager.technologies.unlocks.get(json.id);
  }
}

class ResourceProvider extends EntityProvider<
  ResourceDefinition,
  JsonResource
> {
  categories: Record<ResourceCategory, ResourceDefinition[]> = {
    food: [],
    primaryFood: [],
    secondaryFood: [],
    livestock: [],
    crop: [],
    luxury: [],
    material: [],
    mineral: [],
    natural: [],
    organic: [],
    manmade: [],
    strategic: [],
  };

  parse(json: JsonResource): ResourceDefinition {
    let depositDef: ResourceDepositDefinition | undefined = undefined;
    if (json.depositDef) {
      depositDef = {
        ...json.depositDef,
        requiredImprovement: this.manager.tileImprovements.get(
          json.depositDef.requiredImprovement,
        ),
      };
    }

    const distribution: ResourceDistribution[] = [];
    for (const jsonDistribution of json.distribution) {
      distribution.push({
        ...jsonDistribution,
        landForm: jsonDistribution.landForm
          ? landFormNamesInverse[jsonDistribution.landForm]
          : undefined,
        climate: jsonDistribution.climate
          ? climateNamesInverse[jsonDistribution.climate]
          : undefined,
        seaLevel: jsonDistribution.seaLevel
          ? seaLevelNamesInverse[jsonDistribution.seaLevel]
          : undefined,
      });
    }

    const resourceDef: ResourceDefinition = {
      ...json,
      entityType: "resource",
      depositDef,
      distribution,
    };

    for (const category of json.categories) {
      this.categories[category].push(resourceDef);
    }

    return resourceDef;
  }
}

class PopulationTypeProvider extends EntityProvider<
  PopulationTypeDefinition,
  JsonPopulationType
> {
  parse(json: JsonPopulationType): PopulationTypeDefinition {
    return {
      ...json,
      entityType: "populationType",
    };
  }
}

class TechProvider extends EntityProvider<Technology, JsonTechnology> {
  unlocks = new Map<string, Technology>();

  parse(json: JsonTechnology): Technology {
    const linksMiddlePoint: Record<string, number> = {};
    for (const link of json.layout.linksMiddlePoint) {
      linksMiddlePoint[link.tech] = link.point;
    }

    const tech: Technology = {
      ...json,
      entityType: "technology",
      unlocks: [],
      requiredTechnologies: [],
      layout: {
        x: json.layout.x,
        y: json.layout.y,
        linksMiddlePoint,
      },
    };

    for (const unlock of json.unlocks) {
      this.unlocks.set(unlock, tech);
    }

    return tech;
  }

  resolveReferences(tech: Technology, json: JsonTechnology): void {
    tech.requiredTechnologies = json.requiredTechnologies.map((id) =>
      this.manager.technologies.get(id),
    );
    tech.unlocks = json.unlocks.map((id) => this.manager.get(id));
  }
}

function parseRequirements(requirements: JsonRequirement[]): Requirement[] {
  return requirements.map(parseRequirement);
}

function parseRequirement(r: JsonRequirement): Requirement {
  switch (r.type) {
    case "never":
      return new NeverRequirement();
    case "cityHaveBuilding":
      return new CityHaveBuildingRequirement(r.building);
    case "citySize":
      return new CitySizeRequirement(r.size);
    case "cityIsCoastline":
      return new CoastlineCityRequirement();
  }
  throw new Error(`Unknown requirement type: ${(r as any).type}`);
}

async function fetchJson<T>(url: string): Promise<T> {
  if (import.meta.env.MODE === "test") {
    url = path.join(process.cwd(), url);
    const data = await import(/* @vite-ignore */ url);
    return data.default as T;
  }

  const response = await fetch(url);
  return (await response.json()) as T;
}

export const dataManager = new DataManager();
