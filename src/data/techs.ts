import { RawTechnology } from "@/core/data.interface";

export const TECH_DEFINITIONS: RawTechnology[] = [
  {
    "id": "tech_society",
    "entityType": "technology",
    "name": "Society",
    "requiredTechnologies": [],
    "cost": 0,
    "era": "Copper Age",
    "layout": {
      "x": 50.0,
      "y": 537.5,
      "linksMiddlePoint": {
        "tech_agriculture": 100.0,
        "tech_animalHusbandry": 100.0,
        "tech_copperWorking": 100.0,
        "tech_hunting": 100.0,
        "tech_fishing": 100.0
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
    "layout": {
      "x": 550.0,
      "y": 237.5,
      "linksMiddlePoint": {
        "tech_pottery": 300.0,
        "tech_irrigation": 400.0
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
    "layout": {
      "x": 550.0,
      "y": 437.5,
      "linksMiddlePoint": {
        "tech_wheel": 300.0
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
    "layout": {
      "x": 1050.0,
      "y": 287.5,
      "linksMiddlePoint": {
        "tech_writing": 500.0,
        "tech_irrigation": 500.0
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
    "layout": {
      "x": 1050.0,
      "y": 437.5,
      "linksMiddlePoint": {
        "tech_chariotry": 500.0
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
    "layout": {
      "x": 550.0,
      "y": 837.5,
      "linksMiddlePoint": {
        "tech_sailing": 300.0
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
    "layout": {
      "x": 1050.0,
      "y": 675.0,
      "linksMiddlePoint": {
        "tech_bronzeWorking": 500.0,
        "tech_construction": 500.0
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
    "layout": {
      "x": 1050.0,
      "y": 875.0,
      "linksMiddlePoint": {
        "tech_shipbuilding": 600.0
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
    "layout": {
      "x": 550.0,
      "y": 537.5,
      "linksMiddlePoint": {
        "tech_archery": 300.0
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
    "layout": {
      "x": 1050.0,
      "y": 537.5,
      "linksMiddlePoint": {
        "tech_chariotry": 500.0
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
    "layout": {
      "x": 550.0,
      "y": 637.5,
      "linksMiddlePoint": {
        "tech_masonry": 300.0
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
    "layout": {
      "x": 1550.0,
      "y": 287.5,
      "linksMiddlePoint": {
        "tech_calendar": 700.0,
        "tech_mathematics": 700.0,
        "tech_literature": 700.0
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
    "layout": {
      "x": 1550.0,
      "y": 487.5,
      "linksMiddlePoint": {
        "tech_horsebackRiding": 800.0
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
    "layout": {
      "x": 1550.0,
      "y": 625.0,
      "linksMiddlePoint": {
        "tech_metallurgy": 700.0
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
    "layout": {
      "x": 2050.0,
      "y": 187.5,
      "linksMiddlePoint": {
        "tech_astrology": 900.0
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
    "layout": {
      "x": 2050.0,
      "y": 287.5,
      "linksMiddlePoint": {
        "tech_astrology": 900.0,
        "tech_currency": 900.0
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
    "layout": {
      "x": 2550.0,
      "y": 187.5,
      "linksMiddlePoint": {
        "tech_astronomy": 1100.0
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
    "layout": {
      "x": 1550.0,
      "y": 187.5,
      "linksMiddlePoint": {
        "tech_calendar": 700.0
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
    "layout": {
      "x": 1550.0,
      "y": 725.0,
      "linksMiddlePoint": {
        "tech_shipbuilding": 700.0
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
    "layout": {
      "x": 2550.0,
      "y": 650.0,
      "linksMiddlePoint": {
        "tech_stirrup": 1200.0
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
    "layout": {
      "x": 2550.0,
      "y": 287.5,
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
    "layout": {
      "x": 3550.0,
      "y": 625.0,
      "linksMiddlePoint": {
        "tech_mechanics": 1500.0,
        "tech_cropRotation": 1500.0
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
    "layout": {
      "x": 3550.0,
      "y": 875.0,
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
    "layout": {
      "x": 2050.0,
      "y": 875.0,
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
    "layout": {
      "x": 2050.0,
      "y": 412.5,
      "linksMiddlePoint": {
        "tech_cartography": 900.0,
        "tech_philosophy": 1000.0,
        "tech_poetry": 1000.0
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
    "layout": {
      "x": 2050.0,
      "y": 725.0,
      "linksMiddlePoint": {
        "tech_jewelry": 900.0,
        "tech_ironWorking": 1005.0
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
    "layout": {
      "x": 2550.0,
      "y": 550.0,
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
    "layout": {
      "x": 3075.0,
      "y": 725.0,
      "linksMiddlePoint": {
        "tech_stirrup": 1305.0,
        "tech_engineering": 1305.0,
        "tech_metalArmor": 1305.0
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
    "layout": {
      "x": 3050.0,
      "y": 362.5,
      "linksMiddlePoint": {
        "tech_education": 1300.0,
        "tech_anatomy": 1300.0
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
    "layout": {
      "x": 3050.0,
      "y": 462.5,
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
    "layout": {
      "x": 3050.0,
      "y": 187.5,
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
    "layout": {
      "x": 3550.0,
      "y": 525.0,
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
    "layout": {
      "x": 2550.0,
      "y": 825.0,
      "linksMiddlePoint": {
        "tech_glassBlowing": 1105.0
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
    "layout": {
      "x": 3550.0,
      "y": 312.5,
      "linksMiddlePoint": {
        "tech_alchemy": 1500.0,
        "tech_medicine": 1500.0
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
    "layout": {
      "x": 3550.0,
      "y": 212.5,
      "linksMiddlePoint": {
        "tech_medicine": 1500.0
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
    "layout": {
      "x": 3550.0,
      "y": 725.0,
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
    "layout": {
      "x": 3075.0,
      "y": 875.0,
      "linksMiddlePoint": {
        "tech_optics": 1305.0
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
    "layout": {
      "x": 4050.0,
      "y": 625.0,
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
    "layout": {
      "x": 4050.0,
      "y": 500.0,
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
    "layout": {
      "x": 4050.0,
      "y": 212.5,
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
    "layout": {
      "x": 4050.0,
      "y": 312.5,
      "linksMiddlePoint": {}
    }
  }
];
