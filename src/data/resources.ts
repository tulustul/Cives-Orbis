import { ResourceDefinition } from "@/core/data.interface";
import { TileImprovement } from "@/core/tile-improvements";
import { SeaLevel, LandForm, Climate } from "@/shared";

export const RESOURCES_DEFINITIONS: ResourceDefinition[] = [
  {
    id: "resource_stone",
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
    id: "resource_clay",
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
    id: "resource_wood",
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
    id: "resource_copper_ore",
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
    id: "resource_tin_ore",
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
    id: "resource_iron_ore",
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
    id: "resource_salt",
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
    id: "resource_gems",
    entityType: "resource",
    resourceType: "luxury",
    name: "Gems",
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
    id: "resource_amber",
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
    id: "resource_wheat",
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
    id: "resource_maize",
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
    id: "resource_rice",
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
    id: "resource_fish",
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
    id: "resource_pearls",
    resourceType: "food",
    entityType: "resource",
    name: "Pearls",
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
    id: "resource_gold",
    entityType: "resource",
    resourceType: "material",
    name: "Gold",
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
    id: "resource_silver",
    entityType: "resource",
    resourceType: "material",
    name: "Silver",
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
    id: "resource_cattle",
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
    id: "resource_goats",
    entityType: "resource",
    resourceType: "food",
    name: "Goats",
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
    id: "resource_sheeps",
    entityType: "resource",
    resourceType: "food",
    name: "Sheeps",
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
    id: "resource_pigs",
    entityType: "resource",
    resourceType: "food",
    name: "Pigs",
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
    id: "resource_horses",
    entityType: "resource",
    resourceType: "luxury",
    name: "Horses",
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
    id: "resource_elephants",
    entityType: "resource",
    resourceType: "luxury",
    name: "Elephants",
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
    id: "resource_camels",
    entityType: "resource",
    resourceType: "luxury",
    name: "Camels",
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
    id: "resource_furs",
    entityType: "resource",
    resourceType: "food",
    name: "Furs",
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
    id: "resource_grapes",
    entityType: "resource",
    resourceType: "food",
    name: "Grapes",
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
    id: "resource_olives",
    entityType: "resource",
    resourceType: "food",
    name: "Olives",
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
    id: "resource_spices",
    entityType: "resource",
    resourceType: "food",
    name: "Spices",
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
    id: "resource_dyes",
    entityType: "resource",
    resourceType: "luxury",
    name: "Dyes",
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
    id: "resource_wine",
    entityType: "resource",
    resourceType: "luxury",
    name: "Wine"
  },
  {
    id: "resource_beer",
    entityType: "resource",
    resourceType: "luxury",
    name: "Beer"
  },
  {
    id: "resource_olive_oil",
    entityType: "resource",
    resourceType: "luxury",
    name: "Olive Oil"
  },
  {
    id: "resource_textiles",
    entityType: "resource",
    resourceType: "luxury",
    name: "Textiles"
  },
  {
    id: "resource_wool",
    entityType: "resource",
    resourceType: "luxury",
    name: "Wool"
  },
  {
    id: "resource_glassware",
    entityType: "resource",
    resourceType: "luxury",
    name: "Glassware"
  },
  {
    id: "resource_jewelry",
    entityType: "resource",
    resourceType: "luxury",
    name: "Jewelry"
  },
  {
    id: "resource_bronze",
    entityType: "resource",
    resourceType: "material",
    name: "Bronze Ingot"
  },
  {
    id: "resource_iron",
    entityType: "resource",
    resourceType: "material",
    name: "Iron Ingot"
  },
  {
    id: "resource_pottery",
    entityType: "resource",
    resourceType: "luxury",
    name: "Pottery"
  },
  {
    id: "resource_leather",
    entityType: "resource",
    resourceType: "luxury",
    name: "Leather"
  },
  {
    id: "resource_ivory",
    entityType: "resource",
    resourceType: "luxury",
    name: "Ivory"
  },
  {
    id: "resource_perfumes",
    entityType: "resource",
    resourceType: "luxury",
    name: "Perfumes"
  }
];
