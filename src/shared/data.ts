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

export type Bonuses = {
  yieldValue?: Partial<Yields>;
  yieldFactor?: Partial<Yields>;

  transferProductionToFood?: number;
  transferProductionToCulture?: number;
  transferProductionToPublicWorks?: number;
};

export type ProductType = "unit" | "building" | "idleProduct";

export type ResourceType = "food" | "material" | "commodity" | "luxury";

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
