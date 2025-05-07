import { Entity, ResourceType } from "@/core/data.interface";
import { Yields } from "../core/yields";

export type PopulationType = "peasant" | "artisan" | "elite" | "slave";

export type ResourceNeed = {
  resourceType: ResourceType;
  diversityExponent: number;
  amountExponent: number;
};

// Categories of resources (for diversification bonuses)
export enum ResourceCategory {
  Food = "food",
  BasicLuxury = "basicLuxury",
  AdvancedLuxury = "advancedLuxury",
  Materials = "materials"
}

export type PopulationTypeDefinition = {
  id: PopulationType;
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
export type PopulationTypeDefinition2 = Entity & {
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

export const POPULATION_TYPES: Record<
  PopulationType,
  PopulationTypeDefinition
> = {
  slave: {
    id: "slave",
    name: "Slave",
    description:
      "Forced laborers who consume less food but have limited productivity",
    foodConsumptionMultiplier: 0.7,
    extraYields: {},
    priority: 1,
    growthRate: 0,
    declineRate: 0.01,
    resourceNeeds: [
      { resourceType: "food", amountExponent: 1, diversityExponent: 1 }
    ]
  },
  peasant: {
    id: "peasant",
    name: "Peasant",
    description: "Common citizens who work the fields and produce food",
    foodConsumptionMultiplier: 1.0,
    extraYields: {},
    priority: 2,
    growthRate: 0.05,
    declineRate: 0.08,
    resourceNeeds: [
      { resourceType: "food", amountExponent: 1.05, diversityExponent: 1.05 }
    ]
  },
  artisan: {
    id: "artisan",
    name: "Artisan",
    description: "Skilled workers who produce more but consume more food",
    foodConsumptionMultiplier: 1.2,
    extraYields: { production: 1, gold: 1 },
    priority: 3,
    growthRate: 0.03,
    declineRate: 0.06,
    resourceNeeds: [
      { resourceType: "food", amountExponent: 1.08, diversityExponent: 1.08 },
      { resourceType: "luxury", amountExponent: 1.03, diversityExponent: 1.03 }
    ]
  },
  elite: {
    id: "elite",
    name: "Elite",
    description:
      "Upper class citizens who consume the most food but contribute to culture and knowledge",
    foodConsumptionMultiplier: 1.5,
    extraYields: { culture: 1, knowledge: 1, gold: 3 },
    priority: 4,
    growthRate: 0.02,
    declineRate: 0.04,
    resourceNeeds: [
      { resourceType: "food", amountExponent: 1.15, diversityExponent: 1.15 },
      { resourceType: "luxury", amountExponent: 1.1, diversityExponent: 1.1 }
    ]
  }
};
