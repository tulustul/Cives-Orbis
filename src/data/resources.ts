import { RawResourceDefinition } from "@/core/data.interface";
import { Climate, LandForm, SeaLevel } from "@/shared";

export const RESOURCES_DEFINITIONS: RawResourceDefinition[] = [
  {
    id: "resource-stone",
    entityType: "resource",
    name: "Stone",
    resourceType: "material",
    depositDef: {
      requiredImprovement: "tile-impr-quarry",
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 2 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-limestone",
    entityType: "resource",
    name: "Limestone",
    resourceType: "material",
    depositDef: {
      requiredImprovement: "tile-impr-quarry",
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 2 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-marble",
    entityType: "resource",
    name: "Marble",
    resourceType: "material",
    depositDef: {
      requiredImprovement: "tile-impr-quarry",
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 2 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-clay",
    entityType: "resource",
    name: "Clay",
    resourceType: "material"
  },
  {
    id: "resource-wood",
    entityType: "resource",
    name: "wood",
    resourceType: "material",
    depositDef: {
      requiredImprovement: "tile-impr-lumbermill",
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 2 }
      }
    }
  },
  {
    id: "resource-copperOre",
    entityType: "resource",
    resourceType: "material",
    name: "Copper Ore",
    depositDef: {
      requiredImprovement: "tile-impr-mine",
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-tinOre",
    entityType: "resource",
    resourceType: "material",
    name: "Tin Ore",
    depositDef: {
      requiredImprovement: "tile-impr-mine",
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-pig",
    entityType: "resource",
    resourceType: "food",
    name: "Pig",
    depositDef: {
      requiredImprovement: "tile-impr-pasture",
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-ironOre",
    entityType: "resource",
    resourceType: "material",
    name: "Iron Ore",
    depositDef: {
      requiredImprovement: "tile-impr-mine",
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-salt",
    entityType: "resource",
    resourceType: "material",
    name: "Salt",
    depositDef: {
      requiredImprovement: "tile-impr-mine",
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-coal",
    entityType: "resource",
    resourceType: "material",
    name: "Coal",
    depositDef: {
      requiredImprovement: "tile-impr-mine",
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-gem",
    entityType: "resource",
    resourceType: "luxury",
    name: "Gem",
    depositDef: {
      requiredImprovement: "tile-impr-mine",
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-sapphire",
    entityType: "resource",
    resourceType: "luxury",
    name: "Sapphire",
    depositDef: {
      requiredImprovement: "tile-impr-mine",
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-amber",
    entityType: "resource",
    resourceType: "luxury",
    name: "Amber",
    depositDef: {
      requiredImprovement: "tile-impr-mine",
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-wheat",
    entityType: "resource",
    resourceType: "food",
    name: "Wheat",
    depositDef: {
      requiredImprovement: "tile-impr-farm",
      bonuses: {
        yieldValue: { food: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { food: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        climates: [Climate.temperate, Climate.savanna],
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-tomato",
    entityType: "resource",
    resourceType: "food",
    name: "Tomato",
    depositDef: {
      requiredImprovement: "tile-impr-plantation",
      bonuses: {
        yieldValue: { food: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { food: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        climates: [Climate.temperate, Climate.savanna],
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-sulphur",
    entityType: "resource",
    resourceType: "material",
    name: "Sulphur",
    depositDef: {
      requiredImprovement: "tile-impr-mine",
      bonuses: {
        yieldValue: { food: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { food: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        climates: [Climate.temperate, Climate.savanna],
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-cinnamon",
    entityType: "resource",
    resourceType: "luxury",
    name: "Cinnamon",
    depositDef: {
      requiredImprovement: "tile-impr-plantation",
      bonuses: {
        yieldValue: { food: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { food: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-maize",
    entityType: "resource",
    resourceType: "food",
    name: "Maize",
    depositDef: {
      requiredImprovement: "tile-impr-farm",
      bonuses: {
        yieldValue: { food: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { food: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-rice",
    resourceType: "food",
    entityType: "resource",
    name: "Rice",
    depositDef: {
      requiredImprovement: "tile-impr-farm",
      bonuses: {
        yieldValue: { food: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { food: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-fish",
    resourceType: "food",
    entityType: "resource",
    name: "Fish",
    depositDef: {
      requiredImprovement: "tile-impr-fishery",
      bonuses: {
        yieldValue: { food: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { food: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.shallow,
        landFormProbability: {
          [LandForm.plains]: 1,
          [LandForm.hills]: 1
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-whale",
    resourceType: "food",
    entityType: "resource",
    name: "Whale",
    depositDef: {
      requiredImprovement: "tile-impr-fishery",
      bonuses: {
        yieldValue: { food: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { food: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.shallow,
        landFormProbability: {
          [LandForm.plains]: 1,
          [LandForm.hills]: 1
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-camel",
    resourceType: "material",
    entityType: "resource",
    name: "Camel",
    depositDef: {
      requiredImprovement: "tile-impr-pasture",
      bonuses: {
        yieldValue: { food: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { food: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.shallow,
        landFormProbability: {
          [LandForm.plains]: 1,
          [LandForm.hills]: 1
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-pearl",
    resourceType: "food",
    entityType: "resource",
    name: "Pearl",
    depositDef: {
      requiredImprovement: "tile-impr-fishery",
      bonuses: {
        yieldValue: { food: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { food: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.shallow,
        landFormProbability: {
          [LandForm.plains]: 1,
          [LandForm.hills]: 1
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-goldOre",
    entityType: "resource",
    resourceType: "material",
    name: "Gold Ore",
    depositDef: {
      requiredImprovement: "tile-impr-mine",
      bonuses: {
        yieldValue: { gold: 2 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 5 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-gold",
    entityType: "resource",
    resourceType: "material",
    name: "Gold"
  },
  {
    id: "resource-silverOre",
    entityType: "resource",
    resourceType: "material",
    name: "Silver Ore",
    depositDef: {
      requiredImprovement: "tile-impr-mine",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-silver",
    entityType: "resource",
    resourceType: "material",
    name: "Silver"
  },
  {
    id: "resource-tobacco",
    entityType: "resource",
    resourceType: "luxury",
    name: "Tobacco",
    depositDef: {
      requiredImprovement: "tile-impr-plantation",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-cattle",
    entityType: "resource",
    resourceType: "food",
    name: "Cattle",
    depositDef: {
      requiredImprovement: "tile-impr-pasture",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-coffe",
    entityType: "resource",
    resourceType: "food",
    name: "Coffe",
    depositDef: {
      requiredImprovement: "tile-impr-plantation",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-goat",
    entityType: "resource",
    resourceType: "food",
    name: "Goat",
    depositDef: {
      requiredImprovement: "tile-impr-pasture",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-sheep",
    entityType: "resource",
    resourceType: "food",
    name: "Sheep",
    depositDef: {
      requiredImprovement: "tile-impr-pasture",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-elephant",
    entityType: "resource",
    resourceType: "luxury",
    name: "Elephant",
    depositDef: {
      requiredImprovement: "tile-impr-pasture",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-fur",
    entityType: "resource",
    resourceType: "food",
    name: "Fur",
    depositDef: {
      requiredImprovement: "tile-impr-huntingGround",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-grape",
    entityType: "resource",
    resourceType: "food",
    name: "Grape",
    depositDef: {
      requiredImprovement: "tile-impr-plantation",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-olive",
    entityType: "resource",
    resourceType: "food",
    name: "Olive",
    depositDef: {
      requiredImprovement: "tile-impr-plantation",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-spice",
    entityType: "resource",
    resourceType: "luxury",
    name: "Spice",
    depositDef: {
      requiredImprovement: "tile-impr-plantation",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-dye",
    entityType: "resource",
    resourceType: "luxury",
    name: "Dye",
    depositDef: {
      requiredImprovement: "tile-impr-plantation",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-orange",
    entityType: "resource",
    resourceType: "food",
    name: "Orange",
    depositDef: {
      requiredImprovement: "tile-impr-plantation",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-apple",
    entityType: "resource",
    resourceType: "food",
    name: "Apple",
    depositDef: {
      requiredImprovement: "tile-impr-plantation",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-lemon",
    entityType: "resource",
    resourceType: "food",
    name: "Lemon",
    depositDef: {
      requiredImprovement: "tile-impr-plantation",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-diamond",
    entityType: "resource",
    resourceType: "luxury",
    name: "Diamond",
    depositDef: {
      requiredImprovement: "tile-impr-mine",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-glassware",
    entityType: "resource",
    resourceType: "luxury",
    name: "Glassware"
  },
  {
    id: "resource-goat",
    entityType: "resource",
    resourceType: "food",
    name: "Goat",
    depositDef: {
      requiredImprovement: "tile-impr-pasture",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-horse",
    entityType: "resource",
    resourceType: "material",
    name: "Horse",
    depositDef: {
      requiredImprovement: "tile-impr-pasture",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-game",
    entityType: "resource",
    resourceType: "food",
    name: "Wild Game",
    depositDef: {
      requiredImprovement: "tile-impr-huntingGround",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-ox",
    entityType: "resource",
    resourceType: "material",
    name: "Ox",
    depositDef: {
      requiredImprovement: "tile-impr-pasture",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-llama",
    entityType: "resource",
    resourceType: "material",
    name: "Llama",
    depositDef: {
      requiredImprovement: "tile-impr-pasture",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-chicken",
    entityType: "resource",
    resourceType: "food",
    name: "Chicken",
    depositDef: {
      requiredImprovement: "tile-impr-pasture",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-oil",
    entityType: "resource",
    resourceType: "food",
    name: "Oil",
    depositDef: {
      requiredImprovement: "tile-impr-mine",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-cotton",
    entityType: "resource",
    resourceType: "material",
    name: "Cotton",
    depositDef: {
      requiredImprovement: "tile-impr-plantation",
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevels: SeaLevel.none,
        landFormProbability: {
          [LandForm.plains]: 0.25,
          [LandForm.hills]: 0.75
        },
        quantityMedian: 3,
        quantityStddev: 2
      }
    }
  },
  {
    id: "resource-wine",
    entityType: "resource",
    resourceType: "luxury",
    name: "Wine"
  },
  {
    id: "resource-beer",
    entityType: "resource",
    resourceType: "luxury",
    name: "Beer"
  },
  {
    id: "resource-oliveOil",
    entityType: "resource",
    resourceType: "luxury",
    name: "Olive Oil"
  },
  {
    id: "resource-textile",
    entityType: "resource",
    resourceType: "luxury",
    name: "Textile"
  },
  {
    id: "resource-brick",
    entityType: "resource",
    resourceType: "luxury",
    name: "Brick"
  },
  {
    id: "resource-silk",
    entityType: "resource",
    resourceType: "luxury",
    name: "Silk"
  },
  {
    id: "resource-bread",
    entityType: "resource",
    resourceType: "luxury",
    name: "Bread"
  },
  {
    id: "resource-wool",
    entityType: "resource",
    resourceType: "luxury",
    name: "Wool"
  },
  {
    id: "resource-cheese",
    entityType: "resource",
    resourceType: "food",
    name: "Cheese"
  },
  {
    id: "resource-glassware",
    entityType: "resource",
    resourceType: "luxury",
    name: "Glassware"
  },
  {
    id: "resource-jewelry",
    entityType: "resource",
    resourceType: "luxury",
    name: "Jewelry"
  },
  {
    id: "resource-bronze",
    entityType: "resource",
    resourceType: "material",
    name: "Bronze Ingot"
  },
  {
    id: "resource-iron",
    entityType: "resource",
    resourceType: "material",
    name: "Iron Ingot"
  },
  {
    id: "resource-pottery",
    entityType: "resource",
    resourceType: "luxury",
    name: "Pottery"
  },
  {
    id: "resource-ivory",
    entityType: "resource",
    resourceType: "luxury",
    name: "Ivory"
  },
  {
    id: "resource-perfume",
    entityType: "resource",
    resourceType: "luxury",
    name: "Perfume"
  },
  {
    id: "resource-copper",
    entityType: "resource",
    resourceType: "luxury",
    name: "Copper"
  },
  {
    id: "resource-steel",
    entityType: "resource",
    resourceType: "luxury",
    name: "Steel"
  }
];
