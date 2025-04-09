import { RawTileImprovementDefinition } from "@/core/data.interface";
import { LandForm } from "@/shared";

export const TILE_IMPROVEMENTS: RawTileImprovementDefinition[] = [
  {
    entityType: "tileImprovement",
    id: "tile-impr-farm",
    name: "Farm",
    action: "buildFarm",
    landForms: [LandForm.plains],
    forest: false,
    river: true,
    baseTurns: 5,
    extraYields: {
      food: 1
    }
  },
  {
    entityType: "tileImprovement",
    id: "tile-impr-irrigation",
    name: "Irrigation",
    action: "buildIrrigation",
    landForms: [LandForm.plains],
    forest: false,
    river: true,
    baseTurns: 5,
    extraYields: {
      food: 2
    }
  },
  {
    entityType: "tileImprovement",
    id: "tile-impr-mine",
    name: "Mine",
    action: "buildMine",
    landForms: [LandForm.plains, LandForm.hills],
    forest: false,
    baseTurns: 8,
    extraYields: {
      production: 1
    }
  },
  {
    entityType: "tileImprovement",
    id: "tile-impr-lumbermill",
    name: "Lumbermill",
    action: "buildLumbermill",
    forest: true,
    baseTurns: 5,
    extraYields: {
      production: 1
    }
  },
  {
    entityType: "tileImprovement",
    id: "tile-impr-quarry",
    name: "Quarry",
    action: "buildQuarry",
    requireResource: true,
    forest: false,
    baseTurns: 8,
    extraYields: {
      production: 1
    }
  },
  {
    entityType: "tileImprovement",
    id: "tile-impr-clayPit",
    name: "Clay pit",
    action: "buildClayPit",
    spawnsResource: "resource_clay",
    forest: false,
    river: true,
    baseTurns: 8
  },
  {
    entityType: "tileImprovement",
    id: "tile-impr-plantation",
    name: "Plantation",
    action: "buildPlantation",
    requireResource: true,
    forest: false,
    baseTurns: 10
  },
  {
    entityType: "tileImprovement",
    id: "tile-impr-pasture",
    name: "Pasture",
    action: "buildPasture",
    requireResource: true,
    forest: false,
    baseTurns: 10
  },
  {
    entityType: "tileImprovement",
    id: "tile-impr-fishery",
    name: "Fishery",
    action: "buildFishery",
    requireResource: true,
    baseTurns: 0
  },
  {
    entityType: "tileImprovement",
    id: "tile-impr-huntingGround",
    name: "Hunting ground",
    action: "buildHuntingGround",
    requireResource: true,
    baseTurns: 0
  },
  {
    entityType: "tileImprovement",
    id: "tile-impr-cottage",
    name: "Cottage",
    action: "buildCottage",
    baseTurns: 10,
    extraYields: {
      gold: 1
    }
  }
];
