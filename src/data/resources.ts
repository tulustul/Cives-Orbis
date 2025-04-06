import { ResourceDefinition } from "@/core/data.interface";
import { TileImprovement } from "@/core/tile-improvements";
import { SeaLevel, LandForm, Climate } from "@/shared";

export const RESOURCES_DEFINITIONS: ResourceDefinition[] = [
  {
    id: "resource-stone",
    entityType: "resource",
    name: "Stone",
    resourceType: "material",
    depositDef: {
      requiredImprovement: TileImprovement.mine,
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 2 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.mine,
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 2 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.mine,
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 2 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
    resourceType: "material",
    depositDef: {
      requiredImprovement: TileImprovement.mine,
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 2 }
      }
    }
  },
  {
    id: "resource-wood",
    entityType: "resource",
    name: "wood",
    resourceType: "material",
    depositDef: {
      requiredImprovement: TileImprovement.sawmill,
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
      requiredImprovement: TileImprovement.mine,
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.mine,
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.mine,
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.mine,
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.mine,
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.mine,
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.mine,
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.mine,
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.mine,
      bonuses: {
        yieldValue: { production: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { production: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { food: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { food: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { food: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { food: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { food: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { food: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { food: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { food: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { food: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { food: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { food: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { food: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { food: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { food: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.shallow,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { food: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { food: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.shallow,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { food: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { food: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.shallow,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { food: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { food: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.shallow,
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
      requiredImprovement: TileImprovement.mine,
      bonuses: {
        yieldValue: { gold: 2 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 5 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.mine,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
    id: "resource-camel",
    entityType: "resource",
    resourceType: "material",
    name: "Camel",
    depositDef: {
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
      requiredImprovement: TileImprovement.farm,
      bonuses: {
        yieldValue: { gold: 1 }
      },
      bonusesWhenWorked: {
        yieldValue: { gold: 3 }
      },
      distribution: {
        seaLevel: SeaLevel.none,
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
