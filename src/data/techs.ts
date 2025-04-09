import { RawTechnology } from "@/core/data.interface";

export const TECH_DEFINITIONS: RawTechnology[] = [
  {
    "id": "tech_society",
    "entityType": "technology",
    "name": "Society",
    "requiredTechnologies": [],
    "cost": 0,
    "era": "Copper Age",
    "unlocks": [
      "unit_worker",
      "unit_scout",
      "unit_warrior",
      "building_palace",
      "building_monument",
      "building_elderCouncil"
    ],
    "layout": {
      "x": 50.0,
      "y": 473.00000000000006,
      "linksMiddlePoint": {
        "tech_agriculture": 0.0,
        "tech_animalHusbandry": 0.0,
        "tech_copperWorking": 0.0,
        "tech_hunting": 0.0,
        "tech_fishing": 0.0
      }
    }
  },
  {
    "id": "tech_agriculture",
    "entityType": "technology",
    "name": "Agriculture",
    "requiredTechnologies": ["tech_society"],
    "cost": 20,
    "era": "Copper Age",
    "unlocks": [
      "building_well",
      "building_slave_market",
      "farm",
      "idle_product_growth",
      "tile-impr-farm"
    ],
    "layout": {
      "x": 490.00000000000006,
      "y": 209.00000000000003,
      "linksMiddlePoint": {
        "tech_pottery": 0.0,
        "tech_irrigation": -484.0000000000001
      }
    }
  },
  {
    "id": "tech_animalHusbandry",
    "entityType": "technology",
    "name": "Animal Husbandry",
    "requiredTechnologies": ["tech_society"],
    "cost": 20,
    "era": "Copper Age",
    "unlocks": [
      "resource_cattle",
      "resource_sheep",
      "resource_goat",
      "resource_pig",
      "tile-impr-pasture"
    ],
    "layout": {
      "x": 490.00000000000006,
      "y": 385.00000000000006,
      "linksMiddlePoint": {
        "tech_wheel": 0.0
      }
    }
  },
  {
    "id": "tech_pottery",
    "entityType": "technology",
    "name": "Pottery",
    "requiredTechnologies": ["tech_agriculture"],
    "cost": 20,
    "era": "Copper Age",
    "unlocks": [
      "building_granary",
      "unit_settler",
      "resource_pottery",
      "tile-impr-clayPit"
    ],
    "layout": {
      "x": 930.0000000000001,
      "y": 253.00000000000003,
      "linksMiddlePoint": {
        "tech_writing": 0.0,
        "tech_irrigation": 0.0
      }
    }
  },
  {
    "id": "tech_wheel",
    "entityType": "technology",
    "name": "Wheel",
    "requiredTechnologies": ["tech_animalHusbandry"],
    "cost": 25,
    "era": "Copper Age",
    "unlocks": [],
    "layout": {
      "x": 930.0000000000001,
      "y": 385.00000000000006,
      "linksMiddlePoint": {
        "tech_chariotry": 0.0
      }
    }
  },
  {
    "id": "tech_fishing",
    "entityType": "technology",
    "name": "Fishing",
    "requiredTechnologies": ["tech_society"],
    "cost": 20,
    "era": "Copper Age",
    "unlocks": ["resource_fish", "tile-impr-fishery"],
    "layout": {
      "x": 490.00000000000006,
      "y": 737.0000000000001,
      "linksMiddlePoint": {
        "tech_sailing": 0.0
      }
    }
  },
  {
    "id": "tech_masonry",
    "entityType": "technology",
    "name": "Masonry",
    "requiredTechnologies": ["tech_copperWorking"],
    "cost": 35,
    "era": "Copper Age",
    "unlocks": ["tile-impr-quarry"],
    "layout": {
      "x": 930.0000000000001,
      "y": 594.0,
      "linksMiddlePoint": {
        "tech_bronzeWorking": 0.0,
        "tech_construction": 0.0
      }
    }
  },
  {
    "id": "tech_sailing",
    "entityType": "technology",
    "name": "Sailing",
    "requiredTechnologies": ["tech_fishing"],
    "cost": 25,
    "era": "Copper Age",
    "unlocks": ["unit_tireme", "unit_galley", "resource_pearls"],
    "layout": {
      "x": 930.0000000000001,
      "y": 770.0000000000001,
      "linksMiddlePoint": {
        "tech_shipbuilding": 0.0
      }
    }
  },
  {
    "id": "tech_hunting",
    "entityType": "technology",
    "name": "Hunting",
    "requiredTechnologies": ["tech_society"],
    "cost": 20,
    "era": "Copper Age",
    "unlocks": ["resource_furs", "tile-impr-huntingGround"],
    "layout": {
      "x": 490.00000000000006,
      "y": 473.00000000000006,
      "linksMiddlePoint": {
        "tech_archery": 0.0
      }
    }
  },
  {
    "id": "tech_archery",
    "entityType": "technology",
    "name": "Archery",
    "requiredTechnologies": ["tech_hunting"],
    "cost": 30,
    "era": "Copper Age",
    "unlocks": [],
    "layout": {
      "x": 930.0000000000001,
      "y": 473.00000000000006,
      "linksMiddlePoint": {
        "tech_chariotry": 0.0
      }
    }
  },
  {
    "id": "tech_copperWorking",
    "entityType": "technology",
    "name": "Copper Working",
    "requiredTechnologies": ["tech_society"],
    "cost": 20,
    "era": "Copper Age",
    "unlocks": ["resource_copper_ore", "tile-impr-mine"],
    "layout": {
      "x": 490.00000000000006,
      "y": 561.0,
      "linksMiddlePoint": {
        "tech_masonry": 0.0
      }
    }
  },
  {
    "id": "tech_writing",
    "entityType": "technology",
    "name": "Writing",
    "requiredTechnologies": ["tech_pottery"],
    "cost": 40,
    "era": "Bronze Age",
    "unlocks": ["building_library"],
    "layout": {
      "x": 1370.0,
      "y": 253.00000000000003,
      "linksMiddlePoint": {
        "tech_calendar": 0.0,
        "tech_mathematics": 0.0,
        "tech_literature": 0.0
      }
    }
  },
  {
    "id": "tech_chariotry",
    "entityType": "technology",
    "name": "Chariotry",
    "requiredTechnologies": ["tech_wheel", "tech_archery"],
    "cost": 50,
    "era": "Bronze Age",
    "unlocks": [],
    "layout": {
      "x": 1370.0,
      "y": 429.00000000000006,
      "linksMiddlePoint": {
        "tech_horsebackRiding": 0.0
      }
    }
  },
  {
    "id": "tech_bronzeWorking",
    "entityType": "technology",
    "name": "Bronze Working",
    "requiredTechnologies": ["tech_masonry"],
    "cost": 30,
    "era": "Bronze Age",
    "unlocks": [
      "building_workshop",
      "unit_supply_wagon",
      "resource_bronze",
      "tile-impr-lumbermill"
    ],
    "layout": {
      "x": 1370.0,
      "y": 550.0,
      "linksMiddlePoint": {
        "tech_metallurgy": 48.400000000000006
      }
    }
  },
  {
    "id": "tech_calendar",
    "entityType": "technology",
    "name": "Calendar",
    "requiredTechnologies": ["tech_writing", "tech_irrigation"],
    "cost": 40,
    "era": "Bronze Age",
    "unlocks": ["tile-impr-plantation"],
    "layout": {
      "x": 1810.0000000000002,
      "y": 165.0,
      "linksMiddlePoint": {
        "tech_astrology": 0.0
      }
    }
  },
  {
    "id": "tech_mathematics",
    "entityType": "technology",
    "name": "Mathematics",
    "requiredTechnologies": ["tech_writing"],
    "cost": 45,
    "era": "Bronze Age",
    "unlocks": [],
    "layout": {
      "x": 1810.0000000000002,
      "y": 253.00000000000003,
      "linksMiddlePoint": {
        "tech_astrology": 0.0,
        "tech_currency": 0.0
      }
    }
  },
  {
    "id": "tech_astrology",
    "entityType": "technology",
    "name": "Astrology",
    "requiredTechnologies": ["tech_calendar", "tech_mathematics"],
    "cost": 45,
    "era": "Bronze Age",
    "unlocks": [],
    "layout": {
      "x": 2250.0,
      "y": 165.0,
      "linksMiddlePoint": {
        "tech_astronomy": 0.0
      }
    }
  },
  {
    "id": "tech_irrigation",
    "entityType": "technology",
    "name": "Irrigation",
    "requiredTechnologies": ["tech_agriculture", "tech_pottery"],
    "cost": 50,
    "era": "Bronze Age",
    "unlocks": ["building_big_granary", "tile-impr-irrigation"],
    "layout": {
      "x": 1370.0,
      "y": 165.0,
      "linksMiddlePoint": {
        "tech_calendar": 0.0
      }
    }
  },
  {
    "id": "tech_construction",
    "entityType": "technology",
    "name": "Constructions",
    "requiredTechnologies": ["tech_masonry"],
    "cost": 60,
    "era": "Bronze Age",
    "unlocks": [],
    "layout": {
      "x": 1370.0,
      "y": 638.0,
      "linksMiddlePoint": {
        "tech_shipbuilding": -48.400000000000006
      }
    }
  },
  {
    "id": "tech_horsebackRiding",
    "entityType": "technology",
    "name": "Horseback Riding",
    "requiredTechnologies": ["tech_chariotry"],
    "cost": 50,
    "era": "Bronze Age",
    "unlocks": ["resource_horses"],
    "layout": {
      "x": 2250.0,
      "y": 572.0,
      "linksMiddlePoint": {
        "tech_stirrup": 0.0
      }
    }
  },
  {
    "id": "tech_currency",
    "entityType": "technology",
    "name": "Currency",
    "requiredTechnologies": ["tech_mathematics"],
    "cost": 50,
    "era": "Bronze Age",
    "unlocks": ["tile-impr-cottage"],
    "layout": {
      "x": 2250.0,
      "y": 253.00000000000003,
      "linksMiddlePoint": {}
    }
  },
  {
    "id": "tech_engineering",
    "entityType": "technology",
    "name": "Engineering",
    "requiredTechnologies": ["tech_ironWorking"],
    "cost": 60,
    "era": "Bronze Age",
    "unlocks": ["building_all_doing_building", "idle_product_public_works"],
    "layout": {
      "x": 3130.0000000000005,
      "y": 550.0,
      "linksMiddlePoint": {
        "tech_mechanics": 0.0,
        "tech_cropRotation": 0.0
      }
    }
  },
  {
    "id": "tech_optics",
    "entityType": "technology",
    "name": "Optics",
    "requiredTechnologies": ["tech_glassBlowing"],
    "cost": 50,
    "era": "Bronze Age",
    "unlocks": [],
    "layout": {
      "x": 3130.0000000000005,
      "y": 770.0000000000001,
      "linksMiddlePoint": {}
    }
  },
  {
    "id": "tech_shipbuilding",
    "entityType": "technology",
    "name": "Ship Building",
    "requiredTechnologies": ["tech_sailing", "tech_construction"],
    "cost": 65,
    "era": "Bronze Age",
    "unlocks": [],
    "layout": {
      "x": 1810.0000000000002,
      "y": 770.0000000000001,
      "linksMiddlePoint": {}
    }
  },
  {
    "id": "tech_literature",
    "entityType": "technology",
    "name": "Literature",
    "requiredTechnologies": ["tech_writing"],
    "cost": 50,
    "era": "Bronze Age",
    "unlocks": [],
    "layout": {
      "x": 1810.0000000000002,
      "y": 363.00000000000006,
      "linksMiddlePoint": {
        "tech_cartography": 0.0,
        "tech_philosophy": 0.0,
        "tech_poetry": 0.0
      }
    }
  },
  {
    "id": "tech_metallurgy",
    "entityType": "technology",
    "name": "Metallurgy",
    "requiredTechnologies": ["tech_bronzeWorking"],
    "cost": 80,
    "era": "Iron Age",
    "unlocks": [],
    "layout": {
      "x": 1810.0000000000002,
      "y": 638.0,
      "linksMiddlePoint": {
        "tech_jewelry": 0.0,
        "tech_ironWorking": 0.0
      }
    }
  },
  {
    "id": "tech_cartography",
    "entityType": "technology",
    "name": "Cartography",
    "requiredTechnologies": ["tech_literature"],
    "cost": 60,
    "era": "Bronze Age",
    "unlocks": [],
    "layout": {
      "x": 2250.0,
      "y": 484.00000000000006,
      "linksMiddlePoint": {}
    }
  },
  {
    "id": "tech_ironWorking",
    "entityType": "technology",
    "name": "Iron Working",
    "requiredTechnologies": ["tech_metallurgy"],
    "cost": 60,
    "era": "Iron Age",
    "unlocks": ["unit_uber_warrior", "resource_iron", "resource_iron_ore"],
    "layout": {
      "x": 2712.0,
      "y": 638.0,
      "linksMiddlePoint": {
        "tech_stirrup": 0.0,
        "tech_engineering": 0.0,
        "tech_metalArmor": 0.0
      }
    }
  },
  {
    "id": "tech_philosophy",
    "entityType": "technology",
    "name": "Philosophy",
    "requiredTechnologies": ["tech_literature"],
    "cost": 70,
    "era": "Iron Age",
    "unlocks": [],
    "layout": {
      "x": 2690.0,
      "y": 319.0,
      "linksMiddlePoint": {
        "tech_education": 0.0,
        "tech_anatomy": 0.0
      }
    }
  },
  {
    "id": "tech_poetry",
    "entityType": "technology",
    "name": "Drama and Poetry",
    "requiredTechnologies": ["tech_literature"],
    "cost": 70,
    "era": "Iron Age",
    "unlocks": ["idle_product_culture"],
    "layout": {
      "x": 2690.0,
      "y": 407.00000000000006,
      "linksMiddlePoint": {}
    }
  },
  {
    "id": "tech_astronomy",
    "entityType": "technology",
    "name": "Astronomy",
    "requiredTechnologies": ["tech_astrology"],
    "cost": 90,
    "era": "Iron Age",
    "unlocks": [],
    "layout": {
      "x": 2690.0,
      "y": 165.0,
      "linksMiddlePoint": {}
    }
  },
  {
    "id": "tech_stirrup",
    "entityType": "technology",
    "name": "Stirrup",
    "requiredTechnologies": ["tech_horsebackRiding", "tech_ironWorking"],
    "cost": 90,
    "era": "Iron Age",
    "unlocks": [],
    "layout": {
      "x": 3130.0000000000005,
      "y": 462.00000000000006,
      "linksMiddlePoint": {}
    }
  },
  {
    "id": "tech_jewelry",
    "entityType": "technology",
    "name": "Jewelry",
    "requiredTechnologies": ["tech_metallurgy"],
    "cost": 80,
    "era": "Iron Age",
    "unlocks": ["resource_jewelry", "resource_gems"],
    "layout": {
      "x": 2250.0,
      "y": 726.0000000000001,
      "linksMiddlePoint": {
        "tech_glassBlowing": 0.0
      }
    }
  },
  {
    "id": "tech_education",
    "entityType": "technology",
    "name": "Education",
    "requiredTechnologies": ["tech_philosophy"],
    "cost": 100,
    "era": "Iron Age",
    "unlocks": [],
    "layout": {
      "x": 3130.0000000000005,
      "y": 275.0,
      "linksMiddlePoint": {
        "tech_alchemy": 0.0,
        "tech_medicine": 0.0
      }
    }
  },
  {
    "id": "tech_anatomy",
    "entityType": "technology",
    "name": "Anatomy",
    "requiredTechnologies": ["tech_philosophy"],
    "cost": 90,
    "era": "Iron Age",
    "unlocks": [],
    "layout": {
      "x": 3130.0000000000005,
      "y": 187.00000000000003,
      "linksMiddlePoint": {
        "tech_medicine": 0.0
      }
    }
  },
  {
    "id": "tech_metalArmor",
    "entityType": "technology",
    "name": "Metal Armor",
    "requiredTechnologies": ["tech_ironWorking"],
    "cost": 80,
    "era": "Iron Age",
    "unlocks": [],
    "layout": {
      "x": 3130.0000000000005,
      "y": 638.0,
      "linksMiddlePoint": {}
    }
  },
  {
    "id": "tech_glassBlowing",
    "entityType": "technology",
    "name": "Glass Blowing",
    "requiredTechnologies": ["tech_jewelry"],
    "cost": 85,
    "era": "Iron Age",
    "unlocks": ["resource_glassware"],
    "layout": {
      "x": 2712.0,
      "y": 770.0000000000001,
      "linksMiddlePoint": {
        "tech_optics": 0.0
      }
    }
  },
  {
    "id": "tech_mechanics",
    "entityType": "technology",
    "name": "Mechanics",
    "requiredTechnologies": ["tech_engineering"],
    "cost": 90,
    "era": "Iron Age",
    "unlocks": ["building_big_workshop"],
    "layout": {
      "x": 3570.0000000000005,
      "y": 550.0,
      "linksMiddlePoint": {}
    }
  },
  {
    "id": "tech_cropRotation",
    "entityType": "technology",
    "name": "Crop Rotation",
    "requiredTechnologies": ["tech_engineering"],
    "cost": 90,
    "era": "Iron Age",
    "unlocks": [],
    "layout": {
      "x": 3570.0000000000005,
      "y": 440.00000000000006,
      "linksMiddlePoint": {}
    }
  },
  {
    "id": "tech_medicine",
    "entityType": "technology",
    "name": "Medicine",
    "requiredTechnologies": ["tech_anatomy", "tech_education"],
    "cost": 100,
    "era": "Iron Age",
    "unlocks": [],
    "layout": {
      "x": 3570.0000000000005,
      "y": 187.00000000000003,
      "linksMiddlePoint": {}
    }
  },
  {
    "id": "tech_alchemy",
    "entityType": "technology",
    "name": "Alchemy",
    "requiredTechnologies": ["tech_education"],
    "cost": 100,
    "era": "Iron Age",
    "unlocks": [],
    "layout": {
      "x": 3570.0000000000005,
      "y": 275.0,
      "linksMiddlePoint": {}
    }
  }
];
