import { TileRoad } from "@/core/tile-improvements";
import { RESOURCES_DEFINITIONS } from "@/data/resources";
import { TILE_IMPROVEMENTS } from "@/data/tileImprovements";
import { Climate, LandForm, SeaLevel, TileDirection } from "@/shared";
import { Option } from "@/ui/components";

export const SEA_LEVEL_OPTIONS: Option<SeaLevel>[] = [
  { label: "none", value: SeaLevel.none },
  { label: "shallow", value: SeaLevel.shallow },
  { label: "deep", value: SeaLevel.deep },
];

export const LAND_FORM_OPTIONS: Option<LandForm>[] = [
  { label: "plains", value: LandForm.plains },
  { label: "hills", value: LandForm.hills },
  { label: "mountains", value: LandForm.mountains },
];

export const CLIMATE_OPTIONS: Option<Climate>[] = [
  { label: "tropical", value: Climate.tropical },
  { label: "savanna", value: Climate.savanna },
  { label: "desert", value: Climate.desert },
  { label: "temperate", value: Climate.temperate },
  { label: "tundra", value: Climate.tundra },
  { label: "arctic", value: Climate.arctic },
];

export const FOREST_OPTIONS: Option<boolean>[] = [
  { label: "no forest", value: false },
  { label: "forest", value: true },
];

export const WETLANDS_OPTIONS: Option<boolean>[] = [
  { label: "no wetlands", value: false },
  { label: "wetlands", value: true },
];

export const IMPROVEMENT_OPTIONS = [
  { label: "None", value: null } as Option<string | null>,
].concat(
  TILE_IMPROVEMENTS.map((def) => {
    return { label: def.name, value: def.id };
  }),
);

export const ROAD_OPTIONS: Option<TileRoad | null>[] = [
  { label: "no road", value: null },
  { label: "road", value: TileRoad.road },
];

export const RIVER_OPTIONS: Option<TileDirection>[] = [
  { label: "NW", value: TileDirection.NW },
  { label: "NE", value: TileDirection.NE },
  { label: "E", value: TileDirection.E },
  { label: "SE", value: TileDirection.SE },
  { label: "SW", value: TileDirection.SW },
  { label: "W", value: TileDirection.W },
];

export const RESOURCE_OPTIONS = [
  { label: "None", value: null } as Option<string | null>,
]
  .concat(
    RESOURCES_DEFINITIONS.filter((def) => !!def.depositDef).map((def) => {
      return { label: def.name, value: def.id };
    }),
  )
  .sort((a, b) => {
    if (a.label < b.label) {
      return -1;
    }
    if (a.label > b.label) {
      return 1;
    }
    return 0;
  });
