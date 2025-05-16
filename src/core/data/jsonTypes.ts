import { CityEffect } from "../effects";
import {
  climateNamesInverse,
  landFormNamesInverse,
  seaLevelNamesInverse,
  UnitTraitNamesInverse,
  UnitTypeNamesInverse,
} from "./const";
import {
  NationColors,
  ResourceCategory,
  TechEra,
  UnitAction,
  Yields,
} from "@/shared";

export type ClimateName = keyof typeof climateNamesInverse;
export type LandFormName = keyof typeof landFormNamesInverse;
export type SeaLevelName = keyof typeof seaLevelNamesInverse;
export type UnitTypeName = keyof typeof UnitTypeNamesInverse;
export type UnitTraitName = keyof typeof UnitTraitNamesInverse;

export type JsonCityNeverRequirement = {
  type: "never";
};

export type JsonCityHaveBuildingRequirement = {
  type: "cityHaveBuilding";
  building: string;
};

export type JsonCitySizeRequirement = {
  type: "citySize";
  size: number;
};

export type JsonCityIsCoastlineRequirement = {
  type: "cityIsCoastline";
};

export type JsonEntity = {
  id: string;
  name: string;
};

export type JsonRequirement =
  | JsonCityNeverRequirement
  | JsonCityHaveBuildingRequirement
  | JsonCitySizeRequirement
  | JsonCityIsCoastlineRequirement;

export type JsonProduct = JsonEntity & {
  // entity will be hidden from player
  strongRequirements: JsonRequirement[];

  // entity will be disabled for player
  weakRequirements: JsonRequirement[];

  productionCost: number;

  // Optional resources needed for production, mapping from resource ID to quantity
  resourceRequirements?: Record<string, number>;
};

export type JsonUnit = JsonProduct & {
  actionPoints: number;
  strength: number;
  actions: UnitAction[];
  type: UnitTypeName;
  trait: UnitTraitName;
  capacity: number;
  supplyRange: number;
};

export type JsonBuilding = JsonProduct & {
  effects: CityEffect[];
};

export type JsonNation = JsonEntity & {
  cityNames: string[];
  colors: NationColors;
};

export type ResourceAbundance = "veryRare" | "rare" | "common" | "veryCommon";
export type ResourceRichness = "veryPoor" | "poor" | "rich" | "veryRich";

export type JsonResourceDistribution = {
  abundance: ResourceAbundance;
  richness: ResourceRichness;

  landForm?: LandFormName;
  seaLevel?: SeaLevelName;
  climate?: ClimateName;
  forest?: boolean;
  river?: boolean;
  coast?: boolean;
};

export type JsonResourceDepositDefinition = {
  yields: Partial<Yields>;
  yieldsWhenWorked: Partial<Yields>;
  requiredImprovement: string;
};

export type JsonResource = JsonEntity & {
  categories: ResourceCategory[];
  distribution: JsonResourceDistribution[];
  depositDef?: JsonResourceDepositDefinition;
};

export type PolicyArea = JsonEntity & { options: PolicyArea[] };

export type LinkMiddlePoint = {
  tech: string;
  point: number;
};

export type JsonTechLayout = {
  x: number;
  y: number;
  linksMiddlePoint: LinkMiddlePoint[];
};

export type TechUnlockType =
  | "unit"
  | "building"
  | "idleProduct"
  | "tileImprovement"
  | "resource"
  | "ability";

export type TechUnlock = {
  type: TechUnlockType;
  id: string;
};

export type JsonTechnology = JsonEntity & {
  requiredTechnologies: string[];
  cost: number;
  era: TechEra;
  layout: JsonTechLayout;
  unlocks: string[];
};

export type JsonTileImprovement = JsonEntity & {
  baseTurns: number;
  climates?: ClimateName[];
  landForms?: LandFormName[];
  seaLevels?: SeaLevelName[];
  forest?: boolean;
  river?: boolean;
  wetlands?: boolean;
  extraYields?: Partial<Yields>;
  spawnsResource?: string;
  requireResource?: boolean;
  action: UnitAction;
};

export type ResourceNeed = {
  resourceCategory: ResourceCategory;
  diversityExponent: number;
  amountExponent: number;
};

export type JsonPopulationType = {
  id: string;
  name: string;
  description: string;
  foodConsumptionMultiplier: number;
  extraYields: Partial<Yields>;
  priority: number; // Lower number = higher priority for assignment
  growthRate: number; // Base growth rate per turn when needs are 100% met
  declineRate: number; // Base decline rate per turn when needs are 0% met
  // Resources needed for growth
  resourceNeeds: ResourceNeed[];
};

export type JsonData<T> = {
  $schema: string;
  items: T[];
};

export type JsonTechs = JsonData<JsonTechnology>;
export type JsonResources = JsonData<JsonResource>;
export type JsonNations = JsonData<JsonNation>;
export type JsonPopulationTypes = JsonData<JsonPopulationType>;
export type JsonTileImprovements = JsonData<JsonTileImprovement>;
export type JsonBuildings = JsonData<JsonBuilding>;
export type JsonUnits = JsonData<JsonUnit>;
