import { bridge } from "@/bridge";
import { TileChanneled } from "@/core/serialization/channel";
import { Climate, LandForm, SeaLevel, TileDirection } from "@/shared";
import { mapUi } from "@/ui/mapUi";
import { measureTime } from "@/utils";
import { Container, Graphics, IRenderLayer, Sprite } from "pixi.js";
import { getAssets } from "./assets";
import { putContainerAtTile, putContainerAtTileCentered } from "./utils";
import { TerrainDrawer } from "./newTerrain/terrain";
import { TILE_ROW_OFFSET } from "./constants";

const SEA_TEXTURES: Record<SeaLevel, string> = {
  [SeaLevel.deep]: "hexWaterDeep.png",
  [SeaLevel.shallow]: "hexWaterShallow.png",
  [SeaLevel.none]: "",
};

const CLIMATE_TEXTURES: Record<Climate, Record<LandForm, string>> = {
  [Climate.temperate]: {
    [LandForm.plains]: "hexTemperatePlains.png",
    [LandForm.hills]: "hexTemperateHills.png",
    [LandForm.mountains]: "hexMountain.png",
  },
  [Climate.desert]: {
    [LandForm.plains]: "hexDesertPlains.png",
    [LandForm.hills]: "hexDesertHills.png",
    [LandForm.mountains]: "hexDesertMountain.png",
  },
  [Climate.savanna]: {
    [LandForm.plains]: "hexSavannaPlains.png",
    [LandForm.hills]: "hexSavannaHills.png",
    [LandForm.mountains]: "hexDesertMountain.png",
  },
  [Climate.tropical]: {
    [LandForm.plains]: "hexTropicalPlains.png",
    [LandForm.hills]: "hexTropicalHills.png",
    [LandForm.mountains]: "hexMountain.png",
  },
  [Climate.tundra]: {
    [LandForm.plains]: "hexTundraPlains.png",
    [LandForm.hills]: "hexTundraHills.png",
    [LandForm.mountains]: "hexArcticMountain.png",
  },
  [Climate.arctic]: {
    [LandForm.plains]: "hexArcticPlains.png",
    [LandForm.hills]: "hexArcticHills.png",
    [LandForm.mountains]: "hexArcticMountain.png",
  },
};

const FOREST_TEXTURES: Record<Climate, string> = {
  [Climate.temperate]: "hexTemperateForest.png",
  [Climate.tropical]: "hexTropicalForest.png",
  [Climate.tundra]: "hexTundraForest.png",
  [Climate.savanna]: "",
  [Climate.desert]: "",
  [Climate.arctic]: "",
};

export class MapDrawer {
  terrainContainer = new Container({ label: "terrain" });

  tileDrawers = new Map<number, TileDrawer>();

  terrainDrawer: TerrainDrawer | null = null;

  constructor(container: Container, private yieldsLayer: IRenderLayer) {
    container.addChild(this.terrainContainer);

    bridge.tiles.updated$.subscribe((tiles) => {
      const t0 = performance.now();
      for (const tile of tiles) {
        this.updateTile(tile);
      }
      const t1 = performance.now();
      console.log("Call to updateTile took " + (t1 - t0) + " milliseconds.");
    });

    bridge.game.start$.subscribe(() => {
      measureTime("build map", () => this.build());
    });

    mapUi.destroyed$.subscribe(() => this.clear());
  }

  clear() {
    for (const drawer of this.tileDrawers.values()) {
      drawer.destroy();
    }
    this.tileDrawers.clear();
  }

  private async build() {
    this.clear();
    const tiles = await bridge.tiles.getAll();

    this.terrainDrawer = new TerrainDrawer(this.terrainContainer, tiles.length);

    this.terrainDrawer.addTiles(tiles);

    for (const tile of tiles) {
      const drawer = new TileDrawer(tile, this.yieldsLayer);
      this.tileDrawers.set(tile.id, drawer);
      this.terrainContainer.addChild(drawer.container);
      drawer.draw(tile);
    }
  }

  private updateTile(tile: TileChanneled) {
    const drawer = this.tileDrawers.get(tile.id);
    if (drawer) {
      drawer.draw(tile);
    }
  }
}

class TileDrawer {
  container = new Container();

  tilesTextures = getAssets().tilesSpritesheet.textures;
  resourcesTextures = getAssets().resourcesSpritesheet.textures;

  yieldsGraphics = new Graphics();
  // terrainSprite = new Sprite(this.tilesTextures["hexTropicalPlains.png"]);
  resourceSprite: Sprite | null = null;
  improvementSprite: Sprite | null = null;
  roadSprite: Sprite | null = null;
  citySprite: Sprite | null = null;
  riverGraphics: Graphics | null = null;
  hillSprite: Sprite | null = null;
  forestSprite: Sprite | null = null;
  coastsSprite: Sprite | null = null;

  constructor(private tile: TileChanneled, private yieldsLayer: IRenderLayer) {
    this.container.zIndex = tile.y;

    // putContainerAtTile(this.terrainSprite, tile);
    // this.container.addChild(this.terrainSprite);
  }

  public destroy() {
    this.yieldsLayer.detach(this.yieldsGraphics);
    this.container.destroy({ children: true });
  }

  public draw(tile: TileChanneled) {
    this.tile = tile;
    // this.drawTerrain();
    this.drawRiver();
    this.drawDecors();
    this.drawImprovement();
    // this.drawResource();
    this.drawRoads();
    this.drawCity();
    this.drawYields();
  }

  private drawDecors() {
    if (this.tile.landForm === LandForm.mountains) {
      this.hillSprite = new Sprite(this.tilesTextures["mountain.png"]);
      this.hillSprite.anchor.set(0.5, 0.7);
      this.container.addChild(this.hillSprite);
      putContainerAtTileCentered(this.hillSprite, this.tile, 2);
    }

    if (this.tile.forest) {
      let textureName = "forest.png";
      if (this.tile.climate === Climate.tropical) {
        textureName = "jungle.png";
      } else if (this.tile.climate === Climate.temperate) {
        textureName = "forest-temperate.png";
      }
      this.forestSprite = new Sprite(this.tilesTextures[textureName]);
      this.forestSprite.anchor.set(0.5, 0.6);
      this.container.addChild(this.forestSprite);
      putContainerAtTileCentered(this.forestSprite, this.tile, 2.0);
    }

    // if (this.tile.coasts) {
    //   const textureName = `hexCoast${this.tile.coasts}-00.png`;
    //   this.coastsSprite = new Sprite(this.tilesTextures[textureName]);
    //   this.coastsSprite.anchor.set(0.5, 0.67);
    //   this.container.addChild(this.coastsSprite);
    //   putContainerAtTileCentered(this.coastsSprite, this.tile, 3.1);
    // }
  }

  private drawTerrain() {
    let textureName: string;

    if (this.tile.wetlands) {
      if (this.tile.forest) {
        textureName = "hexMarshForest.png";
      } else {
        textureName = "hexMarsh.png";
      }
    } else if (this.tile.forest) {
      textureName = FOREST_TEXTURES[this.tile.climate];
    } else if (this.tile.seaLevel === SeaLevel.none) {
      if (
        this.tile.climate === Climate.desert &&
        this.tile.landForm === LandForm.plains &&
        this.tile.riverParts.length
      ) {
        textureName = "hexDesertFlooded.png";
      } else {
        textureName = CLIMATE_TEXTURES[this.tile.climate][this.tile.landForm];
      }
    } else {
      textureName = SEA_TEXTURES[this.tile.seaLevel];
    }

    // this.terrainSprite.texture = this.tilesTextures[textureName];
  }

  private drawImprovement() {
    if (this.tile.improvement === null) {
      if (this.improvementSprite) {
        this.improvementSprite.visible = false;
      }
      return;
    }

    if (!this.improvementSprite) {
      this.improvementSprite = new Sprite();
      this.improvementSprite.anchor.set(0.5, 0.5);
      this.container.addChild(this.improvementSprite);
    }

    this.improvementSprite.visible = true;

    const textureName = `${this.tile.improvement.id}.png`;
    this.improvementSprite.texture = this.tilesTextures[textureName];
    putContainerAtTileCentered(this.improvementSprite, this.tile, 2);
    // putSpriteAtTileCentered(this.improvementSprite, this.tile);
  }

  private drawResource() {
    // if (this.tile.resource === null) {
    //   if (this.resourceSprite) {
    //     this.resourceSprite.visible = false;
    //   }
    //   return;
    // }
    // if (!this.resourceSprite) {
    //   this.resourceSprite = new Sprite();
    //   // this.resourceSprite.zIndex = 20;
    //   this.container.addChild(this.resourceSprite);
    //   this.resourcesLayer.attach(this.resourceSprite);
    // }
    // this.resourceSprite.visible = true;
    // const textureName = `${this.tile.resource.id}.png`;
    // const texture = this.tilesTextures[`tile-${this.tile.resource.id}.png`];
    // if (texture) {
    //   this.resourceSprite.texture = texture;
    //   putSpriteAtTileCentered(this.resourceSprite, this.tile, 1);
    // } else {
    // }
  }

  private drawRoads() {
    if (this.tile.road === null || this.tile.cityId !== null) {
      if (this.roadSprite) {
        this.roadSprite.visible = false;
      }
      return;
    }

    if (!this.roadSprite) {
      this.roadSprite = new Sprite();
      this.roadSprite.zIndex = 10;
      this.container.addChild(this.roadSprite);
    }

    this.roadSprite.visible = true;

    const textureName = `hexRoad-${this.tile.roads}-00.png`;
    this.roadSprite.texture = this.tilesTextures[textureName];
    putContainerAtTile(this.roadSprite, this.tile);
  }

  private drawCity() {
    if (this.tile.cityId === null) {
      if (this.citySprite) {
        this.citySprite.visible = false;
      }
      return;
    }

    if (!this.citySprite) {
      this.citySprite = new Sprite();
      this.citySprite.texture = this.tilesTextures["village.png"];
      this.container.addChild(this.citySprite);
      putContainerAtTile(this.citySprite, this.tile);
    }

    this.citySprite.visible = true;
  }

  private drawRiver() {
    if (!this.tile.riverParts.length) {
      if (this.riverGraphics) {
        this.riverGraphics.clear();
        this.riverGraphics.visible = false;
      }
      return;
    }

    if (!this.riverGraphics) {
      this.riverGraphics = new Graphics();
      this.container.addChild(this.riverGraphics);
    }

    this.riverGraphics.visible = true;

    this.riverGraphics.position.x = this.tile.x + (this.tile.y % 2 ? 0.5 : 0);
    this.riverGraphics.position.y = this.tile.y * TILE_ROW_OFFSET;
    this.container.addChild(this.riverGraphics);

    for (const river of this.tile.riverParts) {
      if (river === TileDirection.NW) {
        this.riverGraphics.moveTo(0, 0.25);
        this.riverGraphics.lineTo(0.5, 0);
      }

      if (river === TileDirection.NE) {
        this.riverGraphics.moveTo(0.5, 0);
        this.riverGraphics.lineTo(1, 0.25);
      }

      if (river === TileDirection.E) {
        this.riverGraphics.moveTo(1, 0.25);
        this.riverGraphics.lineTo(1, 0.75);
      }

      if (river === TileDirection.SE) {
        this.riverGraphics.moveTo(1, 0.75);
        this.riverGraphics.lineTo(0.5, 1);
      }

      if (river === TileDirection.SW) {
        this.riverGraphics.moveTo(0.5, 1);
        this.riverGraphics.lineTo(0, 0.75);
      }

      if (river === TileDirection.W) {
        this.riverGraphics.moveTo(0, 0.75);
        this.riverGraphics.lineTo(0, 0.25);
      }
    }
    this.riverGraphics.stroke({ width: 0.07, color: 0x4169e1 });
  }

  private drawYields() {
    this.yieldsGraphics.clear();

    this.yieldsGraphics.position.x =
      this.tile.x + (this.tile.y % 2 ? 0.5 : 0) + 0.025;
    this.yieldsGraphics.position.y = this.tile.y * TILE_ROW_OFFSET - 0.35;

    this.drawYield(0.55, this.tile.yields.food, 0x00ff00);
    this.drawYield(0.65, this.tile.yields.production, 0xffaa00);

    this.container.addChild(this.yieldsGraphics);
    this.yieldsLayer.attach(this.yieldsGraphics);
  }

  private drawYield(y: number, quantity: number, color: number) {
    for (let i = 0; i < quantity; i++) {
      const x = 0.5 - (quantity / 2) * 0.1 + 0.1 * i;
      this.yieldsGraphics.rect(x, y, 0.05, 0.05);
    }
    this.yieldsGraphics.fill({ color });
  }
}
