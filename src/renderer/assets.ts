import { Assets, Spritesheet, Texture } from "pixi.js";
import atlasTilesData from "@/assets/atlas-tiles.json";
import atlasTilesUrl from "@/assets/atlas-tiles.png";
import atlasUnitsData from "@/assets/atlas-units.json";
import atlasUnitsUrl from "@/assets/atlas-units.png";
import atlasTerrainData from "@/assets/atlas-terrain.json";
import atlasTerrainUrl from "@/assets/atlas-terrain.png";
import atlasResourcesData from "@/assets/atlas-resources.json";
import atlasResourcesUrl from "@/assets/atlas-resources.png";
import gridUrl from "@/assets/grid.png";
import whitenoiseUrl from "@/assets/whitenoise.png";
import noiseUrl from "@/assets/noise.png";

export type Assets = {
  textures: {
    grid: Texture;
    whitenoise: Texture;
    noise: Texture;
  };
  terrainSpritesheet: Spritesheet;
  tilesSpritesheet: Spritesheet;
  unitsSpritesheet: Spritesheet;
  resourcesSpritesheet: Spritesheet;
};

let assets: Assets | null = null;

export async function loadAssets() {
  const grid = await Assets.load(gridUrl);

  const whitenoise = await Assets.load(whitenoiseUrl);
  whitenoise.source.scaleMode = "linear";
  whitenoise._source.addressMode = "repeat";

  const noise = await Assets.load(noiseUrl);
  noise.source.scaleMode = "linear";
  noise._source.addressMode = "repeat";

  const tilesAtlas = await Assets.load(atlasTilesUrl);
  const tilesSpritesheet = new Spritesheet(tilesAtlas, atlasTilesData);
  // tilesSpritesheet.textureSource.autoGenerateMipmaps = true;
  tilesSpritesheet.textureSource.scaleMode = "nearest";
  await tilesSpritesheet.parse();

  const unitsAtlas = await Assets.load(atlasUnitsUrl);
  const unitsSpritesheet = new Spritesheet(unitsAtlas, atlasUnitsData);
  unitsSpritesheet.textureSource.autoGenerateMipmaps = true;
  unitsSpritesheet.textureSource.scaleMode = "linear";
  await unitsSpritesheet.parse();

  const terrainAtlas = await Assets.load(atlasTerrainUrl);
  const terrainSpritesheet = new Spritesheet(terrainAtlas, atlasTerrainData);
  terrainSpritesheet.textureSource.autoGenerateMipmaps = false;
  terrainSpritesheet.textureSource.scaleMode = "nearest";
  terrainAtlas._source.addressMode = "repeat";
  await terrainSpritesheet.parse();

  const resourcesAtlas = await Assets.load(atlasResourcesUrl);
  const resourcesSpritesheet = new Spritesheet(
    resourcesAtlas,
    atlasResourcesData,
  );
  resourcesSpritesheet.textureSource.autoGenerateMipmaps = true;
  resourcesSpritesheet.textureSource.scaleMode = "linear";
  await resourcesSpritesheet.parse();

  assets = {
    textures: {
      grid,
      whitenoise,
      noise,
    },
    terrainSpritesheet,
    tilesSpritesheet,
    unitsSpritesheet,
    resourcesSpritesheet,
  };
}

export function getAssets(): Assets {
  if (!assets) {
    throw new Error("Assets not loaded");
  }
  return assets;
}
