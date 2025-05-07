import { Climate, LandForm, SeaLevel } from "@/shared";
import { UnitTrait, UnitType } from "../data.interface";

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

export const unitTypeNames: Record<UnitType, string> = {
  [UnitType.land]: "land",
  [UnitType.naval]: "naval",
};

export const UnitTypeNamesInverse = {
  land: UnitType.land,
  naval: UnitType.naval,
};

export const unitTraitNames: Record<UnitTrait, string> = {
  [UnitTrait.explorer]: "explorer",
  [UnitTrait.military]: "military",
  [UnitTrait.settler]: "settler",
  [UnitTrait.supply]: "supply",
  [UnitTrait.worker]: "worker",
};

export const UnitTraitNamesInverse = {
  explorer: UnitTrait.explorer,
  military: UnitTrait.military,
  settler: UnitTrait.settler,
  supply: UnitTrait.supply,
  worker: UnitTrait.worker,
};
