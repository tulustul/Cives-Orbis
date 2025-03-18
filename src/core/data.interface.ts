import { Bonuses } from "./bonus";
import { Requirement } from "./requirements";
import { TileImprovement } from "./tile-improvements";
import { SeaLevel, Climate, LandForm } from "../shared";
import { UnitAction } from "./unit-actions";

export type Entity = {
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

export type RequireRawTech = {
  technology: string;
};

export type RequireTech = {
  technology: Technology;
};

export type ProductType = "unit" | "building" | "idleProduct";

export type BaseProductDefinition = Entity &
  HaveRequirements &
  HaveBonuses & {
    productType: ProductType;
    productionCost: number;
  };

export type RawProductDefinition = BaseProductDefinition & RequireRawTech;
export type ProductDefinition = BaseProductDefinition & RequireTech;

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
  productType: "unit";
  actionPoints: number;
  strength: number;
  actions: UnitAction[];
  type: UnitType;
  trait: UnitTrait;
  capacity: number;
  supplyRange: number;
};

export type RawUnitDefinition = RawProductDefinition &
  _UnitDef &
  RequireRawTech;
export type UnitDefinition = ProductDefinition & _UnitDef & RequireTech;

export type RawBuilding = RawProductDefinition & {
  productType: "building";
};
export type Building = ProductDefinition & {
  productType: "building";
};

export type RawIdleProduct = RawProductDefinition & {
  productType: "idleProduct";
};
export type IdleProduct = ProductDefinition & {
  productType: "idleProduct";
};

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

export type ResourceDefinition = Entity & {
  requiredImprovement: TileImprovement;
  bonuses: Bonuses;
  bonusesWhenWorked: Bonuses;
  distribution: ResourceDistribution;
};

export type PolicyArea = Entity & { options: PolicyArea[] };

export type PolicyOption = Entity & HaveBonuses & HaveRequirements;

export type Law = Entity & HaveBonuses & HaveRequirements;

export type TechEra = 
  "Stone Age" | 
  "Bronze Age" | 
  "Iron Age" | 
  "Gunpowder Age" | 
  "Coal Age" | 
  "Industrial Age" | 
  "Electric Age" | 
  "Information Age" | 
  "AI Age";

export type RawTechnology = Entity & {
  requiredTechnologies: string[];
  cost: number;
  era: TechEra;
};

export type Technology = Entity & {
  requiredTechnologies: Technology[];
  cost: number;
  era: TechEra;
  products: ProductDefinition[];
};
