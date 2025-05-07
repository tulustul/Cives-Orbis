import { RawBuilding } from "@/core/data.interface";
import {
  CityHaveBuildingRequirement,
  NeverRequirement
} from "@/core/requirements";

export const BUILDINGS: RawBuilding[] = [
  {
    id: "building_palace",
    entityType: "building",
    name: "Palace",
    productionCost: 0,
    bonuses: { yieldValue: { culture: 1, knowledge: 1 } },
    strongRequirements: [new NeverRequirement()],
    weakRequirements: []
  },
  {
    id: "building_granary",
    entityType: "building",
    name: "Granary",
    productionCost: 40,
    bonuses: { yieldValue: { food: 3 } },
    strongRequirements: [],
    weakRequirements: []
  },
  {
    id: "building_well",
    entityType: "building",
    name: "Well",
    productionCost: 20,
    bonuses: { yieldValue: { food: 1 } },
    strongRequirements: [],
    weakRequirements: []
  },
  {
    id: "building_big_granary",
    entityType: "building",
    name: "Grand granary",
    productionCost: 100,
    bonuses: { yieldFactor: { food: 0.2 } },
    strongRequirements: [new CityHaveBuildingRequirement("building_granary")],
    weakRequirements: []
  },
  {
    id: "building_workshop",
    entityType: "building",
    name: "Workshop",
    productionCost: 80,
    bonuses: { yieldValue: { production: 5 } },
    strongRequirements: [],
    weakRequirements: []
  },
  {
    id: "building_big_workshop",
    entityType: "building",
    name: "Grand workshop",
    productionCost: 200,
    bonuses: { yieldFactor: { production: 0.2 } },
    strongRequirements: [new CityHaveBuildingRequirement("building_workshop")],
    weakRequirements: []
  },
  {
    id: "building_slave_market",
    entityType: "building",
    name: "Slave market",
    productionCost: 50,
    bonuses: { yieldValue: { publicWorks: 2 } },
    strongRequirements: [],
    weakRequirements: []
  },
  {
    id: "building_monument",
    entityType: "building",
    name: "Monument",
    productionCost: 30,
    bonuses: { yieldValue: { culture: 1 } },
    strongRequirements: [],
    weakRequirements: []
  },
  {
    id: "building_elderCouncil",
    entityType: "building",
    name: "Elder council",
    productionCost: 30,
    bonuses: { yieldValue: { knowledge: 1 } },
    strongRequirements: [],
    weakRequirements: []
  },
  {
    id: "building_library",
    entityType: "building",
    name: "Library",
    productionCost: 80,
    bonuses: { yieldValue: { knowledge: 3 } },
    strongRequirements: [],
    weakRequirements: []
  },
  {
    id: "building_all_doing_building",
    entityType: "building",
    name: "All doing building",
    productionCost: 500,
    bonuses: {
      yieldValue: { food: 1, production: 1 },
      yieldFactor: { food: 0.1, production: 0.1 }
    },
    strongRequirements: [
      new CityHaveBuildingRequirement("building_big_granary"),
      new CityHaveBuildingRequirement("building_big_workshop")
    ],
    weakRequirements: []
  },
  {
    id: "building_bronze_smithy",
    entityType: "building",
    name: "Bronze Smithy",
    productionCost: 60,
    bonuses: {
      yieldValue: { production: 2 },
      yieldFactor: { production: 0.1 }
    },
    strongRequirements: [],
    weakRequirements: []
  },
  {
    id: "building_iron_smithy",
    entityType: "building",
    name: "Iron Smithy",
    productionCost: 80,
    bonuses: {
      yieldValue: { production: 2 },
      yieldFactor: { production: 0.1 }
    },
    strongRequirements: [],
    weakRequirements: []
  },
  {
    id: "building_pottery_workshop",
    entityType: "building",
    name: "Pottery Workshop",
    productionCost: 50,
    bonuses: {
      yieldValue: { production: 1, culture: 1 }
    },
    strongRequirements: [],
    weakRequirements: []
  },
  {
    id: "building_winery",
    entityType: "building",
    name: "Winery",
    productionCost: 60,
    bonuses: {
      yieldValue: { gold: 2 }
    },
    strongRequirements: [],
    weakRequirements: []
  },
  {
    id: "building_brewery",
    entityType: "building",
    name: "Brewery",
    productionCost: 60,
    bonuses: {
      yieldValue: { gold: 2 }
    },
    strongRequirements: [],
    weakRequirements: []
  },
  {
    id: "building_oil_press",
    entityType: "building",
    name: "Oil Press",
    productionCost: 60,
    bonuses: {
      yieldValue: { gold: 2 }
    },
    strongRequirements: [],
    weakRequirements: []
  }
];
