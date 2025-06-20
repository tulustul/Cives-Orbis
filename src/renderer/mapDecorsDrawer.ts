import * as terrainData from "@/assets/atlas-tiles.json";
import { bridge } from "@/bridge";
import { LandForm, TileChanneled, TileDirection } from "@/shared";
import { mapUi } from "@/ui/mapUi";
import { measureTime } from "@/utils";
import { Container, Graphics, IRenderLayer, Sprite } from "pixi.js";
import { merge } from "rxjs";
import { getAssets } from "./assets";
import { camera } from "./camera";
import { TILE_ROW_OFFSET } from "./constants";
import { MOUNTAIN_BY_CLIMATE } from "./tileTextures";
import { putContainerAtTileCentered } from "./utils";

type TileTextureName = keyof typeof terrainData.frames;

const districtOffsets: Record<TileDirection, { x: number; y: number }> = {
  [TileDirection.NW]: { x: 0, y: -0.35 },
  [TileDirection.NE]: { x: 0.35, y: -0.15 },
  [TileDirection.E]: { x: 0.35, y: 0 },
  [TileDirection.SE]: { x: 0, y: 0.35 },
  [TileDirection.SW]: { x: -0.35, y: 0.15 },
  [TileDirection.W]: { x: -0.35, y: 0 },
  [TileDirection.NONE]: { x: 0, y: 0 },
};

export class MapDecorsDrawer {
  tileDrawers = new Map<number, TileDrawer>();

  yieldsEnabled = mapUi.yieldsEnabled;

  constructor(private container: Container, private yieldsLayer: IRenderLayer) {
    bridge.tiles.updated$.subscribe((tiles) => {
      const t0 = performance.now();
      for (const tile of tiles) {
        this.updateTile(tile);
      }
      this.setYieldsVisible();
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
    setTimeout(() => {
      this.setYieldsVisible();
    }, 100); // TODO no idea why the timeout is needed

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

  private spritesPool: Sprite[] = [];
  private spritesPoolIndex = 0;

  constructor(private tile: TileChanneled, private yieldsLayer: IRenderLayer) {
    this.container.zIndex = tile.y;
  }

  public destroy() {
    this.yieldsLayer.detach(this.yieldsGraphics);
    this.container.destroy({ children: true });
    this.spritesPool = [];
    this.spritesPoolIndex = 0;
  }

  public draw(tile: TileChanneled) {
    this.spritesPoolIndex = 0;
    for (const sprite of this.spritesPool) {
      sprite.visible = false;
    }
    this.tile = tile;
    this.drawDecors();
    this.drawImprovement();
    this.drawDistrict();
    this.drawYields();
  }

  private nextSprite() {
    let sprite = this.spritesPool[this.spritesPoolIndex++];
    if (!sprite) {
      sprite = new Sprite();
      this.spritesPool.push(sprite);
      this.container.addChild(sprite);
    }
    sprite.visible = true;
    return sprite;
  }

  private drawDecors() {
    const offsets = [
      { x: -0.25, y: -0.5, scale: 0.9 },
      { x: 0.25, y: -0.5, scale: 0.9 },
      { x: 0.5, y: 0, scale: 0.9 },
    ];

    if (this.tile.landForm === LandForm.mountains) {
      const textureName = MOUNTAIN_BY_CLIMATE[this.tile.climate];
      this.drawDecor(textureName, { x: 0, y: 0, scale: 1.0 });

      for (let i = 0; i < offsets.length; i++) {
        const isNeigbourMountain =
          (this.tile.landFormNeighbours & (1 << i)) !== 0;

        const isRiver = (this.tile.river & (1 << i)) !== 0;

        if (isRiver) {
          continue;
        }

        if (isNeigbourMountain) {
          this.drawDecor(textureName, offsets[i]);
        }
      }
    }
  }

  private drawDecor(
    textureName: TileTextureName,
    offset: { x: number; y: number; scale: number },
  ) {
    const sprite = this.nextSprite();
    sprite.texture = this.tilesTextures[textureName];
    sprite.anchor.set(0.5, 0.5);
    putContainerAtTileCentered(sprite, this.tile, 1);

    sprite.scale.x *= offset.scale;
    sprite.scale.y *= offset.scale;

    sprite.position.x += offset.x;
    sprite.position.y += offset.y;

    sprite.zIndex = sprite.position.y;
  }

  private drawImprovement() {
    if (this.tile.improvement === null) {
      return;
    }

    const sprite = this.nextSprite();
    sprite.anchor.set(0.5, 0.5);

    const textureName = `${this.tile.improvement}.png`;
    sprite.texture = this.tilesTextures[textureName];
    putContainerAtTileCentered(sprite, this.tile, 0.6);
  }

  private drawYields() {
    this.yieldsGraphics.clear();

    this.yieldsGraphics.position.x =
      this.tile.x + (this.tile.y % 2 ? 0.5 : 0) + 0.025;
    this.yieldsGraphics.position.y = this.tile.y * TILE_ROW_OFFSET - 0.35;

    this.drawYield(0.55, this.tile.yields.food, 0x00ff00);
    this.drawYield(0.65, this.tile.yields.production, 0xffaa00);
    this.drawYield(0.75, this.tile.yields.gold, 0xffe02e);

    this.container.addChild(this.yieldsGraphics);
    this.yieldsLayer.attach(this.yieldsGraphics);
  }

  private drawDistrict() {
    if (!this.tile.district) {
      return;
    }
    const sprite = this.nextSprite();
    sprite.anchor.set(0.5, 0.5);
    const textureName = `${this.tile.district}_${this.tile.districtDirection}.png`;
    sprite.texture = this.tilesTextures[textureName];
    // Move sprite to touch neighboring tile based on direction

    const offset = districtOffsets[this.tile.districtDirection];
    putContainerAtTileCentered(sprite, this.tile);
    sprite.position.x += offset.x;
    sprite.position.y += offset.y;
  }

  private drawYield(y: number, quantity: number, color: number) {
    for (let i = 0; i < quantity; i++) {
      const x = 0.5 - (quantity / 2) * 0.1 + 0.1 * i;
      this.yieldsGraphics.rect(x, y, 0.05, 0.05);
    }
    this.yieldsGraphics.fill({ color });
  }
}
