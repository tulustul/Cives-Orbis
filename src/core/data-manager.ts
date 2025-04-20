import { BUILDINGS } from "@/data/products/buildings";
import { IDLE_PRODUCTS } from "@/data/products/idle-products";
import { UNITS_DEFINITIONS } from "@/data/products/units";
import { RESOURCES_DEFINITIONS } from "@/data/resources";
import { TECH_DEFINITIONS } from "@/data/techs";
import {
  Building,
  Entity,
  IdleProduct,
  Nation,
  ResourceDefinition,
  Technology,
  TileImprovementDefinition,
  UnitDefinition,
} from "./data.interface";
import { TILE_IMPROVEMENTS } from "@/data/tileImprovements";
import { NATIONS } from "@/data/nations";

const ENTITIES_MAP = new Map<string, Entity>();

const technologies: Technology[] = TECH_DEFINITIONS.map((tech) => {
  return {
    ...tech,
    requiredTechnologies: [],
    unlocks: [],
    entityType: "technology",
  };
});
const TECHS_MAP = new Map<string, Technology>();
export const TECHNOLOGIES: Technology[] = [];
for (const tech of technologies) {
  TECHS_MAP.set(tech.id, tech);
  TECHNOLOGIES.push(tech);
  ENTITIES_MAP.set(tech.id, tech);
}

const unlockIdToTech = new Map<string, Technology>();
for (const tech of TECH_DEFINITIONS) {
  for (const unlock of tech.unlocks) {
    unlockIdToTech.set(unlock, TECHS_MAP.get(tech.id)!);
  }
}

export function getTechById(id: string): Technology {
  const def = TECHS_MAP.get(id);
  if (!def) {
    throw Error(`DataManager: No technology with id "${id}"`);
  }
  return def;
}

for (const rawTech of TECH_DEFINITIONS) {
  const tech = getTechById(rawTech.id);
  tech.requiredTechnologies = rawTech.requiredTechnologies.map((id) =>
    getTechById(id),
  );
}

const UNITS_MAP = new Map<string, UnitDefinition>();
for (const rawDef of UNITS_DEFINITIONS) {
  const technology = unlockIdToTech.get(rawDef.id);
  const def: UnitDefinition = { ...rawDef, technology };
  technology?.unlocks.push(def);
  UNITS_MAP.set(def.id, def);
  ENTITIES_MAP.set(def.id, def);
}
export const unitDefs = Array.from(UNITS_MAP.values());

const BUILDINGS_MAP = new Map<string, Building>();
for (const rawDef of BUILDINGS) {
  const technology = unlockIdToTech.get(rawDef.id);
  const def: Building = { ...rawDef, technology };
  technology?.unlocks.push(def);
  BUILDINGS_MAP.set(def.id, def);
  ENTITIES_MAP.set(def.id, def);
}
export const buildingDefs = Array.from(BUILDINGS_MAP.values());

const IDLE_PRODUCTS_MAP = new Map<string, IdleProduct>();
for (const rawDef of IDLE_PRODUCTS) {
  const technology = unlockIdToTech.get(rawDef.id);
  const def: IdleProduct = { ...rawDef, technology };
  technology?.unlocks.push(def);
  IDLE_PRODUCTS_MAP.set(def.id, def);
  ENTITIES_MAP.set(def.id, def);
}
export const idleProductDefs = Array.from(IDLE_PRODUCTS_MAP.values());

export const TILE_IMPR_MAP = new Map<string, TileImprovementDefinition>();
for (const rawDef of TILE_IMPROVEMENTS) {
  const technology = unlockIdToTech.get(rawDef.id);
  const def: TileImprovementDefinition = {
    ...rawDef,
    spawnsResource: undefined,
    technology,
  };
  technology?.unlocks.push(def);
  TILE_IMPR_MAP.set(def.id, def);
  ENTITIES_MAP.set(def.id, def);
}

export const RESOURCES_MAP = new Map<string, ResourceDefinition>();
for (const rawDef of RESOURCES_DEFINITIONS) {
  let def: ResourceDefinition;
  if (rawDef.depositDef) {
    const requiredImprovement = getTileImprDefinitionById(
      rawDef.depositDef.requiredImprovement,
    );
    def = {
      ...rawDef,
      depositDef: { ...rawDef.depositDef, requiredImprovement },
    };
  } else {
    def = { ...rawDef } as ResourceDefinition;
  }
  RESOURCES_MAP.set(def.id, def);
}

for (const rawDef of TILE_IMPROVEMENTS) {
  const spawnsResource = rawDef.spawnsResource
    ? RESOURCES_MAP.get(rawDef.spawnsResource)
    : undefined;
  const def = TILE_IMPR_MAP.get(rawDef.id)!;
  def.spawnsResource = spawnsResource;
}

export function getEntityById(id: string): Entity {
  const entityDef = ENTITIES_MAP.get(id);
  if (!entityDef) {
    throw Error(`DataManager: No entity with id "${id}"`);
  }
  return entityDef;
}

export function getUnitById(id: string): UnitDefinition {
  const unitDef = UNITS_MAP.get(id);
  if (!unitDef) {
    throw Error(`DataManager: No unit with id "${id}"`);
  }
  return unitDef;
}

export function getBuildingById(id: string): Building {
  const buildingDef = BUILDINGS_MAP.get(id);
  if (!buildingDef) {
    throw Error(`DataManager: No building with id "${id}"`);
  }
  return buildingDef;
}

export function getIdleProductById(id: string): IdleProduct {
  const idleProductDef = IDLE_PRODUCTS_MAP.get(id);
  if (!idleProductDef) {
    throw Error(`DataManager: No idle product with id "${id}"`);
  }
  return idleProductDef;
}

export function getResourceDefinitionById(id: string): ResourceDefinition {
  const resource = RESOURCES_MAP.get(id);
  if (!resource) {
    throw Error(`DataManager: No resource with id "${id}"`);
  }
  return resource;
}

export function getTileImprDefinitionById(
  id: string,
): TileImprovementDefinition {
  const resource = TILE_IMPR_MAP.get(id);
  if (!resource) {
    throw Error(`DataManager: No resource with id "${id}"`);
  }
  return resource;
}

const NATIONS_MAP = new Map<string, Nation>();
for (const nation of NATIONS) {
  NATIONS_MAP.set(nation.id, nation);
  ENTITIES_MAP.set(nation.id, nation);
}

export function getNationById(id: string): Nation {
  const nation = NATIONS_MAP.get(id);
  if (!nation) {
    throw Error(`DataManager: No nation with id "${id}"`);
  }
  return nation;
}

export function pickRandomNation(exclude: Nation[] = []): Nation {
  const filteredNations = NATIONS.filter((nation) => !exclude.includes(nation));
  if (filteredNations.length === 0) {
    throw new Error("No nations left to pick from");
  }
  const randomIndex = Math.floor(Math.random() * filteredNations.length);
  return filteredNations[randomIndex];
}
