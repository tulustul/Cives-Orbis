import { Climate, SeaLevel } from "@/shared";
import * as terrainData from "@/assets/atlas-tiles.json";

export type TileTextureName = keyof typeof terrainData.frames;

export const TILE_BY_SEA_LEVEL: Record<SeaLevel, TileTextureName | ""> = {
  [SeaLevel.shallow]: "water.png",
  [SeaLevel.deep]: "deepWater.png",
  [SeaLevel.none]: "",
};

export const TILE_BY_CLIMATE: Record<Climate, TileTextureName> = {
  [Climate.tropical]: "tropical.png",
  [Climate.savanna]: "savanna.png",
  [Climate.desert]: "desert.png",
  [Climate.arctic]: "arctic.png",
  [Climate.temperate]: "temperate.png",
  [Climate.tundra]: "tundra.png",
};

export const HILL_BY_CLIMATE: Record<Climate, TileTextureName> = {
  [Climate.tropical]: "hill-tropical.png",
  [Climate.savanna]: "hill-savanna.png",
  [Climate.desert]: "hill-desert.png",
  [Climate.arctic]: "hill-arctic.png",
  [Climate.temperate]: "hill-temperate.png",
  [Climate.tundra]: "hill-tundra.png",
};

export const FOREST_BY_CLIMATE: Record<Climate, TileTextureName | ""> = {
  [Climate.tropical]: "tree-tropical-4.png",
  [Climate.savanna]: "",
  [Climate.desert]: "",
  [Climate.arctic]: "",
  [Climate.temperate]: "tree-temperate-1.png",
  [Climate.tundra]: "tree-tropical-4.png",
};

export const MOUNTAIN_BY_CLIMATE: Record<Climate, TileTextureName> = {
  [Climate.tropical]: "mountain.png",
  [Climate.savanna]: "mountain.png",
  [Climate.desert]: "mountain.png",
  [Climate.arctic]: "mountain.png",
  [Climate.temperate]: "mountain.png",
  [Climate.tundra]: "mountain.png",
};
