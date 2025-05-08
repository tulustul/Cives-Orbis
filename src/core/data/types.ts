import { Bonuses } from "@/core/bonus";
import { Requirement } from "@/core/requirements";
import { Yields } from "@/core/yields";
import { Climate, LandForm, SeaLevel } from "@/shared";
import {
  HaveBonuses,
  JsonNation,
  JsonResourceDistribution,
  JsonTileImprovement,
  JsonUnit,
  ProductType,
  ResourceType,
  TechEra,
} from "./jsonTypes";

export type {
  TechEra,
  NationColors,
  ProductType,
  ResourceType,
} from "./jsonTypes";

export type EntityType =
  | "unit"
  | "building"
  | "idleProduct"
  | "resource"
  | "technology"
  | "tileImprovement"
  | "nation"
  | "populationType";

export type ResourceNeed = {
  resourceType: ResourceType;
  diversityExponent: number;
  amountExponent: number;
};

export type PopulationTypeDefinition = Entity & {
  entityType: "populationType";
  description: string;
  foodConsumptionMultiplier: number;
  extraYields: Partial<Yields>;
  priority: number; // Lower number = higher priority for assignment
  growthRate: number; // Base growth rate per turn when needs are 100% met
  declineRate: number; // Base decline rate per turn when needs are 0% met
  // Resources needed for growth
  resourceNeeds: ResourceNeed[];
};

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

export type RequireTech = {
  technology?: Technology;
};

export type BaseProductDefinition = Entity &
  HaveRequirements &
  HaveBonuses & {
    entityType: ProductType;
    productionCost: number;
    // Optional resources needed for production, mapping from resource ID to quantity
    resourceRequirements?: Record<string, number>;
  };

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

export type UnitDefinition = _ProductDefinition &
  Omit<JsonUnit, "type" | "trait" | "strongRequirements" | "weakRequirements"> &
  RequireTech & {
    entityType: "unit";
    type: UnitType;
    trait: UnitTrait;
  };

export type Building = _ProductDefinition & {
  entityType: "building";
};

export type IdleProduct = _ProductDefinition & {
  entityType: "idleProduct";
};

export type ProductDefinition = UnitDefinition | Building | IdleProduct;

export type Nation = Entity & JsonNation;

export type ResourceDistribution = Omit<
  JsonResourceDistribution,
  "landForms" | "seaLevels" | "climates"
> & {
  landForms?: LandForm[];
  seaLevels?: SeaLevel[];
  climates?: Climate[];
};

export type BaseResourceDepositDefinition = {
  bonuses: Bonuses;
  bonusesWhenWorked: Bonuses;
  distribution?: ResourceDistribution;
};

export type ResourceDepositDefinition = BaseResourceDepositDefinition & {
  requiredImprovement: TileImprovementDefinition;
};

export type ResourceDefinition = Entity & {
  resourceType: ResourceType;
  depositDef?: ResourceDepositDefinition;
};

export type TechLayout = {
  x: number;
  y: number;
  linksMiddlePoint: Record<string, number>;
};

export type Technology = Entity & {
  entityType: "technology";
  requiredTechnologies: Technology[];
  cost: number;
  era: TechEra;
  unlocks: Entity[];
  layout: TechLayout;
};

export type TileImprovementVariant = {
  baseTurns: number;
  climates?: Climate[];
  landForms?: LandForm[];
  seaLevels?: SeaLevel[];
  forest?: boolean;
  river?: boolean;
  extraYields?: Partial<Yields>;
};

export type TileImprovementDefinition = Omit<
  JsonTileImprovement,
  "spawnsResource" | "climates" | "landForms" | "seaLevels"
> &
  RequireTech & {
    entityType: "tileImprovement";
    climates?: Climate[];
    landForms?: LandForm[];
    seaLevels?: SeaLevel[];
    spawnsResource?: ResourceDefinition;
  };
