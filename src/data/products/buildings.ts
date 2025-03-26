import { RawBuilding } from "@/core/data.interface";
import {
  CityHaveBuildingRequirement,
  CityNeverRequirement
} from "@/core/requirements";

export const BUILDINGS: RawBuilding[] = [
  {
    id: "building_palace",
    entityType: "building",
    name: "Palace",
    productionCost: 0,
    bonuses: { yieldValue: { culture: 1, knowledge: 1 } },
    strongRequirements: [new CityNeverRequirement()],
    weakRequirements: [],
    technology: "tech_society"
  },
  {
    id: "building_granary",
    entityType: "building",
    name: "Granary",
    productionCost: 40,
    bonuses: { yieldValue: { food: 3 } },
    strongRequirements: [],
    weakRequirements: [],
    technology: "tech_pottery"
  },
  {
    id: "building_well",
    entityType: "building",
    name: "Well",
    productionCost: 20,
    bonuses: { yieldValue: { food: 1 } },
    strongRequirements: [],
    weakRequirements: [],
    technology: "tech_agriculture"
  },
  {
    id: "building_big_granary",
    entityType: "building",
    name: "Grand granary",
    productionCost: 100,
    bonuses: { yieldFactor: { food: 0.2 } },
    strongRequirements: [new CityHaveBuildingRequirement("building_granary")],
    weakRequirements: [],
    technology: "tech_irrigation"
  },
  {
    id: "building_workshop",
    entityType: "building",
    name: "Workshop",
    productionCost: 80,
    bonuses: { yieldValue: { production: 5 } },
    strongRequirements: [],
    weakRequirements: [],
    technology: "tech_bronzeWorking"
  },
  {
    id: "building_big_workshop",
    entityType: "building",
    name: "Grand workshop",
    productionCost: 200,
    bonuses: { yieldFactor: { production: 0.2 } },
    strongRequirements: [new CityHaveBuildingRequirement("building_workshop")],
    weakRequirements: [],
    technology: "tech_mechanics"
  },
  {
    id: "building_slave_market",
    entityType: "building",
    name: "Slave market",
    productionCost: 50,
    bonuses: { yieldValue: { publicWorks: 2 } },
    strongRequirements: [],
    weakRequirements: [],
    technology: "tech_agriculture"
  },
  {
    id: "building_monument",
    entityType: "building",
    name: "Monument",
    productionCost: 30,
    bonuses: { yieldValue: { culture: 1 } },
    strongRequirements: [],
    weakRequirements: [],
    technology: "tech_society"
  },
  {
    id: "building_elderCouncil",
    entityType: "building",
    name: "Elder council",
    productionCost: 30,
    bonuses: { yieldValue: { knowledge: 1 } },
    strongRequirements: [],
    weakRequirements: [],
    technology: "tech_society"
  },
  {
    id: "building_library",
    entityType: "building",
    name: "Library",
    productionCost: 80,
    bonuses: { yieldValue: { knowledge: 3 } },
    strongRequirements: [],
    weakRequirements: [],
    technology: "tech_writing"
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
    weakRequirements: [],
    technology: "tech_engineering"
  }
];
