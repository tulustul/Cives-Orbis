export type NationColors = {
  primary: string;
  secondary: string;
};

export type EntityType =
  | "unit"
  | "building"
  | "idleProduct"
  | "resource"
  | "technology"
  | "tileImprovement"
  | "nation"
  | "populationType";

export type TechEra =
  | "Copper Age"
  | "Bronze Age"
  | "Iron Age"
  | "Steel Age"
  | "Gunpowder Age"
  | "Coal Age"
  | "Industrial Age"
  | "Electric Age"
  | "Information Age"
  | "AI Age";

export type KnowledgeTechState =
  | "discovered"
  | "researching"
  | "available"
  | "queued"
  | "unavailable";

export type UnitAction =
  | "foundCity"
  | "buildRoad"
  | "buildFarm"
  | "buildMine"
  | "buildLumbermill"
  | "buildQuarry"
  | "buildIrrigation"
  | "buildClayPit"
  | "buildPlantation"
  | "buildPasture"
  | "buildHuntingGround"
  | "buildCottage"
  | "buildFishery";

export type ResourceCategory =
  // Resources that occur naturally in the world.
  | "natural"

  // Essential resources required for game progression; must be fairly distributed on the map.
  | "strategic"

  // Resources produced from other resources through processing.
  | "manmade"

  // Resources that deplete as they are used.
  | "mineral"

  // Resources whose natural occurrence is limited by geography, such as mountains or water bodies creating geographic diversity.
  | "organic"

  // Resources that serve as food sources for the population.
  | "food"

  // Each region should have access to primary and secondary food sources.
  | "primaryFood"
  | "secondaryFood"

  // Resources that fulfill the population's needs.
  | "luxury"

  // Subcategories to ensure balanced resource distribution: each area should have some crops and livestock.
  | "livestock"
  | "crop"

  // Resources primarily used for crafting or construction.
  | "material";

export type UnitOrder = "go" | "skip" | "sleep";

export type TechLayout = {
  x: number;
  y: number;
  linksMiddlePoint: Record<string, number>;
};

export type Yields = {
  food: number;
  production: number;
  gold: number;
  culture: number;
  knowledge: number;
  publicWorks: number;
  faith: number;
};

export type YieldKey = keyof Yields;

export type PlayerYields = {
  perTurn: Yields;
  income: Yields;
  total: Yields;
  costs: Yields;
};

export enum UnitType {
  land,
  naval,
}

export enum UnitTrait {
  settler,
  explorer,
  worker,
  military,
  supply,
}

export type ProductType = "unit" | "building" | "idleProduct";

export type PlayerViewBoundingBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type StatsData = {
  cities: number[];
  food: number[];
  production: number[];
  culture: number[];
  military: number[];
  knowledge: number[];
  techs: number[];
};

export type CityVisibility = "all" | "basic" | "hidden";

export enum TileRoad {
  road,
}

export type Option<T> = {
  label: string;
  value: T;
};

export type PlayerTask =
  | {
      task: "city" | "unit";
      id: number;
    }
  | { task: "chooseTech" };
