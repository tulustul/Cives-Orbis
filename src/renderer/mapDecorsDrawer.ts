import { bridge } from "@/bridge";
import { TileChanneled } from "@/core/serialization/channel";
import { Climate, LandForm, TileDirection } from "@/shared";
import { mapUi } from "@/ui/mapUi";
import { measureTime } from "@/utils";
import { Container, Graphics, IRenderLayer, Sprite } from "pixi.js";
import { getAssets } from "./assets";
import { TILE_ROW_OFFSET } from "./constants";
import { putContainerAtTile, putContainerAtTileCentered } from "./utils";
import { camera } from "./camera";
import { merge } from "rxjs";

export class MapDecorsDrawer {
  tileDrawers = new Map<number, TileDrawer>();

  yieldsEnabled = mapUi.yieldsEnabled;

  constructor(private container: Container, private yieldsLayer: IRenderLayer) {
    bridge.tiles.updated$.subscribe((tiles) => {
      const t0 = performance.now();
      for (const tile of tiles) {
        this.updateTile(tile);
      }
      const t1 = performance.now();
      console.log("Call to updateTile took " + (t1 - t0) + " milliseconds.");
    });

    bridge.game.start$.subscribe(() => {
      measureTime("map decors build", () => this.build());
    });

    mapUi.destroyed$.subscribe(() => this.clear());

    merge(mapUi.yieldsEnabled$, camera.scale$).subscribe(() =>
      this.setYieldsVisible(),
    );
  }

  setYieldsVisible() {
    if (mapUi.yieldsEnabled && camera.transform.scale > 30) {
      this.container.parent.addChild(this.yieldsLayer);
    } else {
      this.container.parent.removeChild(this.yieldsLayer);
    }
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

    for (const tile of tiles) {
      const drawer = new TileDrawer(tile, this.yieldsLayer);
      this.tileDrawers.set(tile.id, drawer);
      drawer.draw(tile);
      this.container.addChild(drawer.container);
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

  yieldsGraphics = new Graphics();
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
  }

  public destroy() {
    this.yieldsLayer.detach(this.yieldsGraphics);
    this.container.destroy({ children: true });
  }

  public draw(tile: TileChanneled) {
    this.tile = tile;
    this.drawDecors();
    this.drawImprovement();
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
