export interface InfluenceData {
  total: number;
}

export interface TileInfluence {
  friendly: InfluenceData;
  enemy: InfluenceData;
}

export type PlainCityAssessment = {
  effort: number; // Force required to capture/defend
  value: number; // Strategic value of the city
  score: number; // Combined prioritization score
  distance: number; // Distance from nearest friendly city
  friendlyInfluence: number;
  enemyInfluence: number;
};
