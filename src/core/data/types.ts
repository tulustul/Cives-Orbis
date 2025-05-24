import { IRequirement } from "@/core/requirements";
import {
  Climate,
  EntityType,
  LandForm,
  ProductType,
  ResourceCategory,
  SeaLevel,
  TechEra,
  TechLayout,
  Yields,
} from "@/shared";
import {
  JsonNation,
  JsonTileImprovement,
  JsonUnit,
  ResourceAbundance,
  ResourceNeed,
  ResourceRichness,
} from "./jsonTypes";
import { ICityEffect } from "../effects";

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
  strongRequirements: IRequirement<any>[];

  // entity will be disabled for player
  weakRequirements: IRequirement<any>[];
};

export type RequireTech = {
  technology?: Technology;
};

export type BaseProductDefinition = Entity &
  HaveRequirements & {
    entityType: ProductType;
    productionCost: number;
    // Optional resources needed for production, mapping from resource ID to quantity
    resourceRequirements?: Record<string, number>;
  };

type _ProductDefinition = BaseProductDefinition & RequireTech;

export type UnitDefinition = _ProductDefinition &
  Omit<JsonUnit, "type" | "strongRequirements" | "weakRequirements"> &
  RequireTech & {
    entityType: "unit";
  };

export type Building = _ProductDefinition & {
  entityType: "building";
  effects: ICityEffect<any>[];
};

export type IdleProduct = _ProductDefinition & {
  entityType: "idleProduct";
  effects: ICityEffect<any>[];
};

export type ProductDefinition = UnitDefinition | Building | IdleProduct;

export type Nation = Entity & JsonNation;

export type ResourceDistribution = {
  abundance: ResourceAbundance;
  richness: ResourceRichness;

  landForm?: LandForm;
  seaLevel?: SeaLevel;
  climate?: Climate;
  forest?: boolean;
  river?: boolean;
  coast?: boolean;
  wetlands?: boolean;
};

export type ResourceDepositDefinition = {
  yields: Partial<Yields>;
  yieldsWhenWorked: Partial<Yields>;
  requiredImprovement: TileImprovementDefinition;
};

export type ResourceDefinition = Entity & {
  categories: ResourceCategory[];
  distribution: ResourceDistribution[];
  depositDef?: ResourceDepositDefinition;
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
