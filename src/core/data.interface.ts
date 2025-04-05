import { Climate, LandForm, SeaLevel } from "../shared";
import { Bonuses } from "./bonus";
import { Requirement } from "./requirements";
import { TileImprovement } from "./tile-improvements";
import { UnitAction } from "./unit-actions";

export type EntityType =
  | "unit"
  | "building"
  | "idleProduct"
  | "resource"
  | "technology"
  | "nation";

export type Entity = {
  entityType: EntityType;
  id: string;
  name: string;
};

export type HaveRequirements = {
  // entity will be hidden from player
  strongRequirements: Requirement[];

  // entity will be disabled for player
  weakRequirements: Requirement[];
};

export type HaveBonuses = {
  bonuses: Bonuses;
};

export type RequireTech = {
  technology?: Technology;
};

export type ProductType = "unit" | "building" | "idleProduct";

export type BaseProductDefinition = Entity &
  HaveRequirements &
  HaveBonuses & {
    entityType: ProductType;
    productionCost: number;
    // Optional resources needed for production, mapping from resource ID to quantity
    resourceRequirements?: Record<string, number>;
  };

export type RawProductDefinition = BaseProductDefinition;
type _ProductDefinition = BaseProductDefinition & RequireTech;

export enum UnitType {
  land,
  naval,
}

export enum UnitTrait {
  settler,
  explorer,
  worker,
  military,
  supply,
}

type _UnitDef = {
  entityType: "unit";
  actionPoints: number;
  strength: number;
  actions: UnitAction[];
  type: UnitType;
  trait: UnitTrait;
  capacity: number;
  supplyRange: number;
};

export type RawUnitDefinition = RawProductDefinition & _UnitDef;
export type UnitDefinition = _ProductDefinition & _UnitDef & RequireTech;

export type RawBuilding = RawProductDefinition & {
  entityType: "building";
};

export type Building = _ProductDefinition & {
  entityType: "building";
};

export type RawIdleProduct = RawProductDefinition & {
  entityType: "idleProduct";
};
export type IdleProduct = _ProductDefinition & {
  entityType: "idleProduct";
};

export type ProductDefinition = UnitDefinition | Building | IdleProduct;

export enum GovernmentSection {
  organization,
  economics,
}

export type GovernmentOption = Entity &
  HaveRequirements &
  HaveBonuses & {
    section: GovernmentSection;
  };

export type Nation = Entity & {
  parentNation: string | null;
  bonuses: Bonuses;
  citiesNames: string[];
};

export type ResourceDistribution = {
  // tile requirements
  seaLevel?: SeaLevel;
  climates?: Climate[];
  forest?: boolean;

  // the higher the more close together the resource is placed.
  clasterize?: number;

  // quantity distribution
  quantityMedian: number;
  quantityStddev: number;

  landFormProbability: {
    [LandForm.plains]: number;
    [LandForm.hills]: number;
  };
};

export type ResourceType = "food" | "material" | "luxury";

export type ResourceDepositDefinition = {
  requiredImprovement: TileImprovement;
  bonuses: Bonuses;
  bonusesWhenWorked: Bonuses;
  distribution?: ResourceDistribution;
};

export type ResourceDefinition = Entity & {
  resourceType: ResourceType;
  depositDef?: ResourceDepositDefinition;
};

export type PolicyArea = Entity & { options: PolicyArea[] };

export type PolicyOption = Entity & HaveBonuses & HaveRequirements;

export type Law = Entity & HaveBonuses & HaveRequirements;

export type TechEra =
  | "Copper Age"
  | "Bronze Age"
  | "Iron Age"
  | "Steel Age"
  | "Gunpowder Age"
  | "Coal Age"
  | "Industrial Age"
  | "Electric Age"
  | "Information Age"
  | "AI Age";

export type TechLayout = {
  x: number;
  y: number;
  linksMiddlePoint: Record<string, number>;
};

export type TechUnlockType =
  | "unit"
  | "building"
  | "idleProduct"
  | "tileImprovement"
  | "resource"
  | "ability";

export interface TechUnlock {
  type: TechUnlockType;
  id: string;
}

export type RawTechnology = Entity & {
  requiredTechnologies: string[];
  cost: number;
  era: TechEra;
  layout: TechLayout;
  unlocks: string[];
};

export type Technology = Entity & {
  entityType: "technology";
  requiredTechnologies: Technology[];
  cost: number;
  era: TechEra;
  unlocks: Entity[];
  layout: TechLayout;
};
