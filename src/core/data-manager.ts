import { BUILDINGS } from "@/data/products/buildings";
import { IDLE_PRODUCTS } from "@/data/products/idle-products";
import { UNITS_DEFINITIONS } from "@/data/products/units";
import { RESOURCES_DEFINITIONS } from "@/data/resources";
import { TECH_DEFINITIONS } from "@/data/techs";
import {
  Building,
  Entity,
  IdleProduct,
  ResourceDefinition,
  Technology,
  UnitDefinition,
} from "./data.interface";

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

const RESOURCES_MAP = new Map<string, ResourceDefinition>();
for (const definition of RESOURCES_DEFINITIONS) {
  RESOURCES_MAP.set(definition.id, definition);
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
