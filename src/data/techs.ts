import { RawTechnology } from "@/core/data.interface";

export const TECH_DEFINITIONS: RawTechnology[] = [
  // Stone Age
  {
    id: "tech_agriculture",
    name: "Agriculture",
    requiredTechnologies: [],
    cost: 20,
    era: "Stone Age",
  },
  {
    id: "tech_animalHusbandry",
    name: "Animal Husbandry",
    requiredTechnologies: ["tech_agriculture"],
    cost: 20,
    era: "Stone Age",
  },
  {
    id: "tech_pottery",
    name: "Pottery",
    requiredTechnologies: ["tech_agriculture"],
    cost: 20,
    era: "Stone Age",
  },
  {
    id: "tech_mining",
    name: "Mining",
    requiredTechnologies: ["tech_agriculture"],
    cost: 20,
    era: "Stone Age",
  },
  {
    id: "tech_fishing",
    name: "Fishing",
    requiredTechnologies: ["tech_agriculture"],
    cost: 20,
    era: "Stone Age",
  },
  {
    id: "tech_weaving",
    name: "Weaving",
    requiredTechnologies: ["tech_animalHusbandry"],
    cost: 25,
    era: "Stone Age",
  },
  {
    id: "tech_writing",
    name: "Writing",
    requiredTechnologies: ["tech_pottery"],
    cost: 40,
    era: "Stone Age",
  },
  {
    id: "tech_masonry",
    name: "Masonry",
    requiredTechnologies: ["tech_mining"],
    cost: 35,
    era: "Stone Age",
  },
  {
    id: "tech_sailing",
    name: "Sailing",
    requiredTechnologies: ["tech_fishing"],
    cost: 25,
    era: "Stone Age",
  },
  {
    id: "tech_wheel",
    name: "Wheel",
    requiredTechnologies: ["tech_agriculture"],
    cost: 25,
    era: "Stone Age",
  },
  {
    id: "tech_hunting",
    name: "Hunting",
    requiredTechnologies: ["tech_agriculture"],
    cost: 20,
    era: "Stone Age",
  },
  {
    id: "tech_archery",
    name: "Archery",
    requiredTechnologies: ["tech_hunting"],
    cost: 30,
    era: "Stone Age",
  },

  // Bronze Age
  {
    id: "tech_bronzeWorking",
    name: "Bronze Working",
    requiredTechnologies: ["tech_mining"],
    cost: 30,
    era: "Bronze Age",
  },
  {
    id: "tech_calendar",
    name: "Calendar",
    requiredTechnologies: ["tech_writing"],
    cost: 40,
    era: "Bronze Age",
  },
  {
    id: "tech_mathematics",
    name: "Mathematics",
    requiredTechnologies: ["tech_writing"],
    cost: 45,
    era: "Bronze Age",
  },
  {
    id: "tech_astrology",
    name: "Astrology",
    requiredTechnologies: ["tech_calendar"],
    cost: 45,
    era: "Bronze Age",
  },
  {
    id: "tech_irrigation",
    name: "Irrigation",
    requiredTechnologies: ["tech_wheel", "tech_calendar"],
    cost: 50,
    era: "Bronze Age",
  },
  {
    id: "tech_construction",
    name: "Construction",
    requiredTechnologies: ["tech_masonry"],
    cost: 60,
    era: "Bronze Age",
  },
  {
    id: "tech_horsebackRiding",
    name: "Horseback Riding",
    requiredTechnologies: ["tech_animalHusbandry"],
    cost: 50,
    era: "Bronze Age",
  },
  {
    id: "tech_currency",
    name: "Currency",
    requiredTechnologies: ["tech_mathematics"],
    cost: 50,
    era: "Bronze Age",
  },
  {
    id: "tech_engineering",
    name: "Engineering",
    requiredTechnologies: ["tech_masonry", "tech_mathematics"],
    cost: 60,
    era: "Bronze Age",
  },
  {
    id: "tech_optics",
    name: "Optics",
    requiredTechnologies: ["tech_sailing"],
    cost: 50,
    era: "Bronze Age",
  },
  {
    id: "tech_shipbuilding",
    name: "Shipbuilding",
    requiredTechnologies: ["tech_sailing", "tech_engineering"],
    cost: 65,
    era: "Bronze Age",
  },

  // Iron Age
  {
    id: "tech_ironWorking",
    name: "Iron Working",
    requiredTechnologies: ["tech_bronzeWorking"],
    cost: 60,
    era: "Iron Age",
  },
  {
    id: "tech_philosophy",
    name: "Philosophy",
    requiredTechnologies: ["tech_writing"],
    cost: 70,
    era: "Iron Age",
  },
  {
    id: "tech_poetry",
    name: "Drama and Poetry",
    requiredTechnologies: ["tech_philosophy"],
    cost: 70,
    era: "Iron Age",
  },
  {
    id: "tech_astronomy",
    name: "Astronomy",
    requiredTechnologies: ["tech_astrology", "tech_mathematics"],
    cost: 90,
    era: "Iron Age",
  },
  {
    id: "tech_compass",
    name: "Compass",
    requiredTechnologies: ["tech_astronomy", "tech_shipbuilding"],
    cost: 95,
    era: "Iron Age",
  },
  {
    id: "tech_metallurgy",
    name: "Metallurgy",
    requiredTechnologies: ["tech_ironWorking"],
    cost: 80,
    era: "Iron Age",
  },
  {
    id: "tech_machinery",
    name: "Machinery",
    requiredTechnologies: ["tech_engineering", "tech_metallurgy"],
    cost: 85,
    era: "Iron Age",
  },
  {
    id: "tech_theology",
    name: "Theology",
    requiredTechnologies: ["tech_philosophy"],
    cost: 90,
    era: "Iron Age",
  },
  {
    id: "tech_education",
    name: "Education",
    requiredTechnologies: ["tech_theology"],
    cost: 100,
    era: "Iron Age",
  },
  {
    id: "tech_feudalism",
    name: "Feudalism",
    requiredTechnologies: ["tech_horsebackRiding", "tech_currency"],
    cost: 85,
    era: "Iron Age",
  },
  {
    id: "tech_guilds",
    name: "Guilds",
    requiredTechnologies: ["tech_currency", "tech_metallurgy"],
    cost: 90,
    era: "Iron Age",
  },
  {
    id: "tech_chivalry",
    name: "Chivalry",
    requiredTechnologies: ["tech_feudalism", "tech_horsebackRiding"],
    cost: 95,
    era: "Iron Age",
  },
  {
    id: "tech_civilService",
    name: "Civil Service",
    requiredTechnologies: ["tech_currency", "tech_writing"],
    cost: 95,
    era: "Iron Age",
  },

  // Gunpowder Age
  {
    id: "tech_physics",
    name: "Physics",
    requiredTechnologies: ["tech_mathematics", "tech_machinery"],
    cost: 100,
    era: "Gunpowder Age",
  },
  {
    id: "tech_chemistry",
    name: "Chemistry",
    requiredTechnologies: ["tech_metallurgy", "tech_education"],
    cost: 105,
    era: "Gunpowder Age",
  },
  {
    id: "tech_banking",
    name: "Banking",
    requiredTechnologies: ["tech_guilds", "tech_mathematics"],
    cost: 110,
    era: "Gunpowder Age",
  },
  {
    id: "tech_printing",
    name: "Printing",
    requiredTechnologies: ["tech_machinery", "tech_education"],
    cost: 115,
    era: "Gunpowder Age",
  },
  {
    id: "tech_economics",
    name: "Economics",
    requiredTechnologies: ["tech_banking", "tech_printing"],
    cost: 125,
    era: "Gunpowder Age",
  },
  {
    id: "tech_navigation",
    name: "Navigation",
    requiredTechnologies: ["tech_compass", "tech_astronomy"],
    cost: 120,
    era: "Gunpowder Age",
  },
  {
    id: "tech_cartography",
    name: "Cartography",
    requiredTechnologies: ["tech_navigation"],
    cost: 125,
    era: "Gunpowder Age",
  },
  {
    id: "tech_gunpowder",
    name: "Gunpowder",
    requiredTechnologies: ["tech_chemistry", "tech_physics"],
    cost: 130,
    era: "Gunpowder Age",
  },
  {
    id: "tech_architecture",
    name: "Architecture",
    requiredTechnologies: ["tech_construction", "tech_engineering"],
    cost: 110,
    era: "Gunpowder Age",
  },

  // Coal Age
  {
    id: "tech_steamPower",
    name: "Steam Power",
    requiredTechnologies: ["tech_physics", "tech_metallurgy"],
    cost: 140,
    era: "Coal Age",
  },
  {
    id: "tech_ballistics",
    name: "Ballistics",
    requiredTechnologies: ["tech_gunpowder", "tech_physics"],
    cost: 145,
    era: "Coal Age",
  },
  {
    id: "tech_rifling",
    name: "Rifling",
    requiredTechnologies: ["tech_gunpowder"],
    cost: 150,
    era: "Coal Age",
  },
  {
    id: "tech_biology",
    name: "Biology",
    requiredTechnologies: ["tech_education", "tech_navigation"],
    cost: 155,
    era: "Coal Age",
  },
  {
    id: "tech_nationalism",
    name: "Nationalism",
    requiredTechnologies: ["tech_printing", "tech_civilService"],
    cost: 160,
    era: "Coal Age",
  },
  {
    id: "tech_militaryScience",
    name: "Military Science",
    requiredTechnologies: ["tech_rifling", "tech_nationalism"],
    cost: 170,
    era: "Coal Age",
  },
  {
    id: "tech_railroad",
    name: "Railroad",
    requiredTechnologies: ["tech_steamPower"],
    cost: 165,
    era: "Coal Age",
  },
  {
    id: "tech_industrialization",
    name: "Industrialization",
    requiredTechnologies: ["tech_steamPower", "tech_economics"],
    cost: 180,
    era: "Coal Age",
  },
  {
    id: "tech_sanitation",
    name: "Sanitation",
    requiredTechnologies: ["tech_biology"],
    cost: 175,
    era: "Coal Age",
  },

  // Industrial Age
  {
    id: "tech_electricity",
    name: "Electricity",
    requiredTechnologies: ["tech_physics", "tech_industrialization"],
    cost: 200,
    era: "Industrial Age",
  },
  {
    id: "tech_steel",
    name: "Steel",
    requiredTechnologies: ["tech_industrialization", "tech_chemistry"],
    cost: 210,
    era: "Industrial Age",
  },
  {
    id: "tech_combustionEngine",
    name: "Combustion Engine",
    requiredTechnologies: ["tech_steamPower", "tech_chemistry"],
    cost: 220,
    era: "Industrial Age",
  },
  {
    id: "tech_radio",
    name: "Radio",
    requiredTechnologies: ["tech_electricity"],
    cost: 230,
    era: "Industrial Age",
  },
  {
    id: "tech_flight",
    name: "Flight",
    requiredTechnologies: ["tech_combustionEngine", "tech_physics"],
    cost: 240,
    era: "Industrial Age",
  },
  {
    id: "tech_assembly",
    name: "Assembly Line",
    requiredTechnologies: ["tech_industrialization", "tech_electricity"],
    cost: 235,
    era: "Industrial Age",
  },
  {
    id: "tech_massProduction",
    name: "Mass Production",
    requiredTechnologies: ["tech_assembly"],
    cost: 250,
    era: "Industrial Age",
  },
  {
    id: "tech_refrigeration",
    name: "Refrigeration",
    requiredTechnologies: ["tech_electricity", "tech_chemistry"],
    cost: 245,
    era: "Industrial Age",
  },
  {
    id: "tech_syntheticMaterials",
    name: "Synthetic Materials",
    requiredTechnologies: ["tech_chemistry", "tech_industrialization"],
    cost: 255,
    era: "Industrial Age",
  },

  // Electric Age
  {
    id: "tech_electronics",
    name: "Electronics",
    requiredTechnologies: ["tech_electricity", "tech_radio"],
    cost: 270,
    era: "Electric Age",
  },
  {
    id: "tech_nuclearFission",
    name: "Nuclear Fission",
    requiredTechnologies: ["tech_physics", "tech_chemistry"],
    cost: 290,
    era: "Electric Age",
  },
  {
    id: "tech_rocketry",
    name: "Rocketry",
    requiredTechnologies: ["tech_flight", "tech_ballistics"],
    cost: 285,
    era: "Electric Age",
  },
  {
    id: "tech_radar",
    name: "Radar",
    requiredTechnologies: ["tech_radio", "tech_flight"],
    cost: 280,
    era: "Electric Age",
  },
  {
    id: "tech_computers",
    name: "Computers",
    requiredTechnologies: ["tech_electronics", "tech_mathematics"],
    cost: 300,
    era: "Electric Age",
  },
  {
    id: "tech_satellites",
    name: "Satellites",
    requiredTechnologies: ["tech_rocketry", "tech_radar"],
    cost: 310,
    era: "Electric Age",
  },
  {
    id: "tech_lasers",
    name: "Lasers",
    requiredTechnologies: ["tech_electronics", "tech_optics"],
    cost: 320,
    era: "Electric Age",
  },
  {
    id: "tech_robotics",
    name: "Robotics",
    requiredTechnologies: ["tech_computers", "tech_electronics"],
    cost: 330,
    era: "Electric Age",
  },
  {
    id: "tech_nuclearPower",
    name: "Nuclear Power",
    requiredTechnologies: ["tech_nuclearFission"],
    cost: 340,
    era: "Electric Age",
  },

  // Information Age
  {
    id: "tech_internet",
    name: "Internet",
    requiredTechnologies: ["tech_computers", "tech_satellites"],
    cost: 360,
    era: "Information Age",
  },
  {
    id: "tech_mobileCommunication",
    name: "Mobile Communication",
    requiredTechnologies: ["tech_electronics", "tech_satellites"],
    cost: 370,
    era: "Information Age",
  },
  {
    id: "tech_fiberOptics",
    name: "Fiber Optics",
    requiredTechnologies: ["tech_lasers", "tech_electronics"],
    cost: 380,
    era: "Information Age",
  },
  {
    id: "tech_nanotechnology",
    name: "Nanotechnology",
    requiredTechnologies: ["tech_computers", "tech_syntheticMaterials"],
    cost: 390,
    era: "Information Age",
  },
  {
    id: "tech_geneticEngineering",
    name: "Genetic Engineering",
    requiredTechnologies: ["tech_biology", "tech_computers"],
    cost: 400,
    era: "Information Age",
  },
  {
    id: "tech_renewableEnergy",
    name: "Renewable Energy",
    requiredTechnologies: ["tech_electronics", "tech_syntheticMaterials"],
    cost: 410,
    era: "Information Age",
  },
  {
    id: "tech_advancedMaterials",
    name: "Advanced Materials",
    requiredTechnologies: ["tech_syntheticMaterials", "tech_nanotechnology"],
    cost: 420,
    era: "Information Age",
  },
  {
    id: "tech_quantumComputing",
    name: "Quantum Computing",
    requiredTechnologies: ["tech_computers", "tech_nanotechnology"],
    cost: 430,
    era: "Information Age",
  },

  // AI Age
  {
    id: "tech_artificialIntelligence",
    name: "Artificial Intelligence",
    requiredTechnologies: ["tech_quantumComputing", "tech_internet"],
    cost: 450,
    era: "AI Age",
  },
  {
    id: "tech_virtualReality",
    name: "Virtual Reality",
    requiredTechnologies: ["tech_computers", "tech_internet"],
    cost: 460,
    era: "AI Age",
  },
  {
    id: "tech_neuralInterfaces",
    name: "Neural Interfaces",
    requiredTechnologies: [
      "tech_artificialIntelligence",
      "tech_geneticEngineering",
    ],
    cost: 470,
    era: "AI Age",
  },
  {
    id: "tech_fusionPower",
    name: "Fusion Power",
    requiredTechnologies: ["tech_nuclearPower", "tech_advancedMaterials"],
    cost: 480,
    era: "AI Age",
  },
  {
    id: "tech_spaceColonization",
    name: "Space Colonization",
    requiredTechnologies: ["tech_satellites", "tech_advancedMaterials"],
    cost: 490,
    era: "AI Age",
  },
  {
    id: "tech_quantumTeleportation",
    name: "Quantum Teleportation",
    requiredTechnologies: ["tech_quantumComputing", "tech_nanotechnology"],
    cost: 500,
    era: "AI Age",
  },
  {
    id: "tech_superintelligence",
    name: "Superintelligence",
    requiredTechnologies: [
      "tech_artificialIntelligence",
      "tech_quantumComputing",
    ],
    cost: 510,
    era: "AI Age",
  },
  {
    id: "tech_mindUploading",
    name: "Mind Uploading",
    requiredTechnologies: ["tech_neuralInterfaces", "tech_superintelligence"],
    cost: 520,
    era: "AI Age",
  },
];
