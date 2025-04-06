import { bridge } from "@/bridge";
import { TileChanneled } from "@/core/serialization/channel";
import { mapUi } from "@/ui/mapUi";
import { Container, Sprite } from "pixi.js";
import { getAssets } from "./assets";
import { TILE_SIZE } from "./constants";
import { putSpriteAtTileCentered } from "./utils";
import { camera } from "./camera";

export class ResourcesDrawer {
  resourceDrawers = new Map<number, ResourceDrawer>();
  resources = new Map<number, string>();

  constructor(private container: Container) {
    bridge.tiles.updated$.subscribe((tiles) => {
      for (const tile of tiles) {
        this.updateTile(tile);
      }
    });

    bridge.game.start$.subscribe(() => this.build());

    mapUi.destroyed$.subscribe(() => this.clear());
  }

  clear() {
    for (const drawer of this.resourceDrawers.values()) {
      drawer.destroy();
    }
    this.resourceDrawers.clear();
    this.resources.clear();
  }

  public setScale(scale: number) {
    const resourceScale = getScale(scale);
    for (const drawer of this.resourceDrawers.values()) {
      drawer.resourceSprite?.scale.set(resourceScale);
    }
  }

  private async build() {
    this.clear();
    const tiles = await bridge.tiles.getAll();

    for (const tile of tiles) {
      if (!tile.resource) {
        continue;
      }
      let drawer = this.resourceDrawers.get(tile.id);
      if (!drawer) {
        drawer = new ResourceDrawer();
        this.resourceDrawers.set(tile.id, drawer);
        this.resources.set(tile.id, tile.resource.id);
        this.container.addChild(drawer.container);
      }
      drawer.draw(tile);
    }
  }

  private updateTile(tile: TileChanneled) {
    let drawer = this.resourceDrawers.get(tile.id);
    if (!tile.resource) {
      if (drawer) {
        drawer.destroy();
        this.resourceDrawers.delete(tile.id);
        this.resources.delete(tile.id);
      }
      return;
    }

    if (this.resources.get(tile.id) === tile.resource.id) {
      return;
    }

    if (!drawer) {
      drawer = new ResourceDrawer();
      this.resourceDrawers.set(tile.id, drawer);
      this.container.addChild(drawer.container);
    }

    this.resources.set(tile.id, tile.resource.id);
    drawer.draw(tile);
  }
}

function getScale(scale: number) {
  return Math.pow(0.3 / TILE_SIZE / scale, 0.5);
}

class ResourceDrawer {
  container = new Container();

  resourcesTextures = getAssets().resourcesSpritesheet.textures;

  resourceSprite: Sprite | null = null;

  public destroy() {
    this.container.destroy({ children: true });
  }

  public draw(tile: TileChanneled) {
    if (!tile.resource) {
      return;
    }

    if (!this.resourceSprite) {
      this.resourceSprite = new Sprite();
      this.resourceSprite.anchor.set(0.5, 0.5);
      this.container.addChild(this.resourceSprite);
    }

    const textureName = `${tile.resource.id}.png`;
    this.resourceSprite.texture =
      this.resourcesTextures[textureName] ??
      this.resourcesTextures["resource-unknown.png"];

    putSpriteAtTileCentered(this.resourceSprite, tile);
    this.resourceSprite.y += 0.1;

    const scale = getScale(camera.transform.scale);
    this.resourceSprite.scale.set(scale);
  }
}
