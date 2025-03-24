import { ResourceDefinition } from "@/core/data.interface";
import { TileImprovement } from "@/core/tile-improvements";
import { SeaLevel, LandForm, Climate } from "@/shared";

export const RESOURCES_DEFINITIONS: ResourceDefinition[] = [
  {
    id: "resource_stone",
    entityType: "resource",
    name: "Stone",
    requiredImprovement: TileImprovement.mine,
    bonuses: {
      yieldValue: { production: 1 },
    },
    bonusesWhenWorked: {
      yieldValue: { production: 2 },
    },
    distribution: {
      seaLevel: SeaLevel.none,
      landFormProbability: {
        [LandForm.plains]: 0.25,
        [LandForm.hills]: 0.75,
      },
      quantityMedian: 3,
      quantityStddev: 2,
    },
  },
  {
    id: "resource_copper",
    entityType: "resource",
    name: "Copper",
    requiredImprovement: TileImprovement.mine,
    bonuses: {
      yieldValue: { production: 1 },
    },
    bonusesWhenWorked: {
      yieldValue: { production: 3 },
    },
    distribution: {
      seaLevel: SeaLevel.none,
      landFormProbability: {
        [LandForm.plains]: 0.25,
        [LandForm.hills]: 0.75,
      },
      quantityMedian: 3,
      quantityStddev: 2,
    },
  },
  {
    id: "resource_iron",
    entityType: "resource",
    name: "Iron",
    requiredImprovement: TileImprovement.mine,
    bonuses: {
      yieldValue: { production: 1 },
    },
    bonusesWhenWorked: {
      yieldValue: { production: 3 },
    },
    distribution: {
      seaLevel: SeaLevel.none,
      landFormProbability: {
        [LandForm.plains]: 0.25,
        [LandForm.hills]: 0.75,
      },
      quantityMedian: 3,
      quantityStddev: 2,
    },
  },
  {
    id: "resource_wheat",
    entityType: "resource",
    name: "Wheat",
    requiredImprovement: TileImprovement.farm,
    bonuses: {
      yieldValue: { food: 1 },
    },
    bonusesWhenWorked: {
      yieldValue: { food: 3 },
    },
    distribution: {
      seaLevel: SeaLevel.none,
      climates: [Climate.temperate, Climate.savanna],
      landFormProbability: {
        [LandForm.plains]: 0.25,
        [LandForm.hills]: 0.75,
      },
      quantityMedian: 3,
      quantityStddev: 2,
    },
  },
  {
    id: "resource_corn",
    entityType: "resource",
    name: "Corn",
    requiredImprovement: TileImprovement.farm,
    bonuses: {
      yieldValue: { food: 1 },
    },
    bonusesWhenWorked: {
      yieldValue: { food: 3 },
    },
    distribution: {
      seaLevel: SeaLevel.none,
      landFormProbability: {
        [LandForm.plains]: 0.25,
        [LandForm.hills]: 0.75,
      },
      quantityMedian: 3,
      quantityStddev: 2,
    },
  },
  {
    id: "resource_rice",
    entityType: "resource",
    name: "Rice",
    requiredImprovement: TileImprovement.farm,
    bonuses: {
      yieldValue: { food: 1 },
    },
    bonusesWhenWorked: {
      yieldValue: { food: 3 },
    },
    distribution: {
      seaLevel: SeaLevel.none,
      landFormProbability: {
        [LandForm.plains]: 0.25,
        [LandForm.hills]: 0.75,
      },
      quantityMedian: 3,
      quantityStddev: 2,
    },
  },
  {
    id: "resource_fish",
    entityType: "resource",
    name: "Fish",
    requiredImprovement: TileImprovement.farm,
    bonuses: {
      yieldValue: { food: 1 },
    },
    bonusesWhenWorked: {
      yieldValue: { food: 3 },
    },
    distribution: {
      seaLevel: SeaLevel.shallow,
      landFormProbability: {
        [LandForm.plains]: 1,
        [LandForm.hills]: 1,
      },
      quantityMedian: 3,
      quantityStddev: 2,
    },
  },
  {
    id: "resource_gold",
    entityType: "resource",
    name: "Gold",
    requiredImprovement: TileImprovement.mine,
    bonuses: {
      yieldValue: { gold: 2 },
    },
    bonusesWhenWorked: {
      yieldValue: { gold: 5 },
    },
    distribution: {
      seaLevel: SeaLevel.none,
      landFormProbability: {
        [LandForm.plains]: 0.25,
        [LandForm.hills]: 0.75,
      },
      quantityMedian: 3,
      quantityStddev: 2,
    },
  },
  {
    id: "resource_silver",
    entityType: "resource",
    name: "Silver",
    requiredImprovement: TileImprovement.mine,
    bonuses: {
      yieldValue: { gold: 1 },
    },
    bonusesWhenWorked: {
      yieldValue: { gold: 3 },
    },
    distribution: {
      seaLevel: SeaLevel.none,
      landFormProbability: {
        [LandForm.plains]: 0.25,
        [LandForm.hills]: 0.75,
      },
      quantityMedian: 3,
      quantityStddev: 2,
    },
  },
];
