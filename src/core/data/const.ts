import { Climate, LandForm, SeaLevel } from "@/shared";

export const climateNames: Record<Climate, string> = {
  [Climate.temperate]: "temperate",
  [Climate.tundra]: "tundra",
  [Climate.desert]: "desert",
  [Climate.tropical]: "tropical",
  [Climate.arctic]: "arctic",
  [Climate.savanna]: "savanna",
};

export const climateNamesInverse = {
  temperate: Climate.temperate,
  tundra: Climate.tundra,
  desert: Climate.desert,
  tropical: Climate.tropical,
  arctic: Climate.arctic,
  savanna: Climate.savanna,
};

export const landFormNames: Record<LandForm, string> = {
  [LandForm.plains]: "plains",
  [LandForm.hills]: "hills",
  [LandForm.mountains]: "mountains",
};

export const landFormNamesInverse = {
  plains: LandForm.plains,
  hills: LandForm.hills,
  mountains: LandForm.mountains,
};

export const seaLevelNames: Record<SeaLevel, string> = {
  [SeaLevel.none]: "none",
  [SeaLevel.shallow]: "shallow",
  [SeaLevel.deep]: "deep",
};

export const seaLevelNamesInverse = {
  none: SeaLevel.none,
  shallow: SeaLevel.shallow,
  deep: SeaLevel.deep,
};
