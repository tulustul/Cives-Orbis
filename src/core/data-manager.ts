import { BUILDINGS } from "@/data/products/buildings";
import { IDLE_PRODUCTS } from "@/data/products/idle-products";
import { UNITS_DEFINITIONS } from "@/data/products/units";
import { RESOURCES_DEFINITIONS } from "@/data/resources";
import { TECH_DEFINITIONS } from "@/data/techs";
import {
  Building,
  Entity,
  HaveRequirements,
  IdleProduct,
  ResourceDefinition,
  Technology,
  UnitDefinition,
} from "./data.interface";

const technologies: Technology[] = TECH_DEFINITIONS.map((tech) => {
  return { ...tech, requiredTechnologies: [], products: [] };
});
const TECHS_MAP = new Map<string, Technology>();
export const TECHNOLOGIES: Technology[] = [];
for (const tech of technologies) {
  TECHS_MAP.set(tech.id, tech);
  TECHNOLOGIES.push(tech);
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
    getTechById(id)
  );
}

const ENTITIES_MAP = new Map<string, Entity & HaveRequirements>();

const UNITS_MAP = new Map<string, UnitDefinition>();
for (const rawDef of UNITS_DEFINITIONS) {
  const def: UnitDefinition = {
    ...rawDef,
    technology: getTechById(rawDef.technology),
  };
  UNITS_MAP.set(def.id, def);
  ENTITIES_MAP.set(def.id, def);
}

const BUILDINGS_MAP = new Map<string, Building>();
for (const rawDef of BUILDINGS) {
  const def: Building = {
    ...rawDef,
    technology: getTechById(rawDef.technology),
  };
  BUILDINGS_MAP.set(def.id, def);
  ENTITIES_MAP.set(def.id, def);
}

const IDLE_PRODUCTS_MAP = new Map<string, IdleProduct>();
for (const rawDef of IDLE_PRODUCTS) {
  const def: IdleProduct = {
    ...rawDef,
    technology: getTechById(rawDef.technology),
  };
  IDLE_PRODUCTS_MAP.set(def.id, def);
  ENTITIES_MAP.set(def.id, def);
}

for (const product of [
  ...UNITS_MAP.values(),
  ...BUILDINGS_MAP.values(),
  ...IDLE_PRODUCTS_MAP.values(),
]) {
  product.technology.products.push(product);
}

const RESOURCES_MAP = new Map<string, ResourceDefinition>();
for (const definition of RESOURCES_DEFINITIONS) {
  RESOURCES_MAP.set(definition.id, definition);
}

export function getEntityById(id: string): Entity & HaveRequirements {
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
