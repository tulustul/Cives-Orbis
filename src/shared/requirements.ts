export type CityNeverRequirement = {
  type: "city.never";
};

export type CityHaveBuildingRequirement = {
  type: "city.haveBuilding";
  building: string;
};

export type CitySizeRequirement = {
  type: "city.size";
  size: number;
};

export type CityIsCoastlineRequirement = {
  type: "city.isCoastline";
};

export type Requirement =
  | CityNeverRequirement
  | CityHaveBuildingRequirement
  | CitySizeRequirement
  | CityIsCoastlineRequirement;

export type RequirementType = Requirement["type"];
