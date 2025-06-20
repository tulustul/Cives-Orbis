import { PlainCityAssessment, TileInfluence } from "./ai";
import { TileCoords } from "./channel";
import {
  AiTaskResult,
  AiTaskStatus,
  TileAssignmentType,
  UnitAssignmentType,
} from "./data";

export type AiTaskSerialized<T> = {
  type: string;
  id: number;
  tasks: AiTaskSerialized<any>[];
  data: T;
  status: AiTaskResult | AiTaskStatus;
  reason: string;
};

export type AiDebugTasks = {
  tasks: AiTaskSerialized<any>[];
};

export type AiDebugUnitsRegistryUnit = {
  id: number;
  name: string;
  assignment: UnitAssignmentType | null;
};

export type AiDebugUnitsRegistry = {
  units: AiDebugUnitsRegistryUnit[];
};

export type AiDebugTilesRegistryTile = {
  tile: TileCoords;
  type: TileAssignmentType;
  exclusion: number | null;
};

export type AiDebugTilesRegistry = {
  tiles: AiDebugTilesRegistryTile[];
};

export type AiDebugMapAnalysisTile = {
  tile: TileCoords;
  influence: TileInfluence;
};

export type AiDebugMapAnalysisCityAssessment = PlainCityAssessment & {
  cityId: number;
  cityName: string;
};

export type AiDebugMapAnalysis = {
  tiles: AiDebugMapAnalysisTile[];
  attackTargets: AiDebugMapAnalysisCityAssessment[];
  defenseTargets: AiDebugMapAnalysisCityAssessment[];
};
