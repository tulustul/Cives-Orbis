import { bridge } from "@/bridge";
import { TileChanneled } from "@/core/serialization/channel";
import { Climate, LandForm } from "@/shared";
import { mapUi } from "@/ui/mapUi";
import { measureTime } from "@/utils";
import { Container, Graphics, IRenderLayer, Sprite } from "pixi.js";
import { merge } from "rxjs";
import { getAssets } from "./assets";
import { camera } from "./camera";
import { TILE_ROW_OFFSET } from "./constants";
import { putContainerAtTile, putContainerAtTileCentered } from "./utils";

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

const mountainTextures = ["mountain-2.png"];

const hillsByClimate: Record<Climate, string[]> = {
  [Climate.tropical]: [
    "hill-tropical-1.png",
    // "hill-2.png",
    // "hill-3.png",
  ],
  [Climate.temperate]: ["hill-grassy-1.png"],
  [Climate.tundra]: ["hill-grassy-1.png"],
  [Climate.arctic]: ["hill-snowy-1.png"],
  [Climate.desert]: [
    "hill-desert-1.png",
    // "hill-desert-2.png",
    // "hill-desert-3.png",
  ],
  [Climate.savanna]: [
    "hill-1.png",
    // "savanna-hill.png",
  ],
};

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
    this.drawRoads();
    this.drawCity();
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
    let landFormTextures: string[] | null = null;

    if (this.tile.landForm === LandForm.mountains) {
      landFormTextures = mountainTextures;
    } else if (this.tile.landForm === LandForm.hills) {
      // landFormTextures = hillsByClimate[this.tile.climate];
    }

    const offsets = [
      { x: -0.25, y: -0.5, scale: 0.9 },
      { x: 0.25, y: -0.5, scale: 0.9 },
      { x: 0.5, y: 0, scale: 0.9 },
    ];

    if (landFormTextures) {
      this.drawDecor(landFormTextures, { x: 0, y: 0, scale: 1.0 });

      for (let i = 0; i < offsets.length; i++) {
        const isNeigbourMountain =
          (this.tile.landFormNeighbours & (1 << i)) !== 0;
        const isNeighbourHill =
          (this.tile.landFormNeighbours & (1 << (i + 6))) !== 0;

        const isRiver = (this.tile.river & (1 << i)) !== 0;
        const isMountain = this.tile.landForm === LandForm.mountains;
        // const isHill = this.tile.landForm === LandForm.hills;

        if (isRiver) {
          continue;
        }

        // if (isNeigbourMountain || (isHill && isNeighbourHill)) {
        if (isNeigbourMountain) {
          this.drawDecor(landFormTextures, offsets[i]);
        }
      }
    }

    if (this.tile.forest) {
      let textureName = "forest.png";
      if (this.tile.climate === Climate.tropical) {
        textureName = "jungle-3.png";
      } else if (this.tile.climate === Climate.temperate) {
        textureName = "forest-temperate-2.png";
      }
      const forestSprite = this.nextSprite();
      forestSprite.texture = this.tilesTextures[textureName];
      forestSprite.anchor.set(0.5, 0.6);
      putContainerAtTileCentered(forestSprite, this.tile, 1.8);
    }
  }

  private drawDecor(
    textures: string[],
    offset: { x: number; y: number; scale: number },
  ) {
    const textureName = textures[Math.floor(Math.random() * textures.length)];
    const sprite = this.nextSprite();
    sprite.texture = this.tilesTextures[textureName];
    sprite.anchor.set(0.5, 0.5);
    putContainerAtTileCentered(sprite, this.tile, 2);

    sprite.scale.x *= offset.scale; // + variance(0.2);
    sprite.scale.y *= offset.scale; // + variance(0.2);

    sprite.position.x += offset.x; // + variance(0.1);
    sprite.position.y += offset.y; // + variance(0.1);

    sprite.zIndex = sprite.position.y;
  }

  private drawImprovement() {
    if (this.tile.improvement === null) {
      return;
      7;
    }

    const sprite = this.nextSprite();
    sprite.anchor.set(0.5, 0.5);

    const textureName = `${this.tile.improvement.id}.png`;
    sprite.texture = this.tilesTextures[textureName];
    putContainerAtTileCentered(sprite, this.tile, 2);
  }

  private drawRoads() {
    if (this.tile.road === null || this.tile.cityId !== null) {
      return;
    }

    const sprite = this.nextSprite();
    sprite.anchor.set(0, 0);
    sprite.zIndex = 10;

    const textureName = `hexRoad-${this.tile.roads}-00.png`;
    sprite.texture = this.tilesTextures[textureName];
    putContainerAtTile(sprite, this.tile);
  }

  private drawCity() {
    if (this.tile.cityId === null) {
      return;
    }

    const sprite = this.nextSprite();
    sprite.anchor.set(0, 0);
    sprite.texture = this.tilesTextures["village.png"];
    putContainerAtTile(sprite, this.tile);
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

function variance(scale: number) {
  return (Math.random() - 0.5) * 2 * scale;
}
