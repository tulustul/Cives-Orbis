import { ResourceWithTileChanneled } from "@/shared";
import { bridge } from "@/bridge";
import { mapUi } from "@/ui/mapUi";
import { Container, Sprite } from "pixi.js";
import { getAssets } from "./assets";
import { camera } from "./camera";
import { TILE_SIZE } from "./constants";
import { putContainerAtTileCentered } from "./utils";
import { skip } from "rxjs";

export class ResourcesDrawer {
  resourceDrawers = new Map<number, ResourceDrawer>();
  resources = new Map<number, string>();

  constructor(private container: Container) {
    bridge.resources.discovered$.subscribe((resource) => {
      this.addResource(resource);
    });
    bridge.resources.depleted$.subscribe((resource) => {
      this.removeResource(resource);
    });

    bridge.game.start$.subscribe(() => this.bindToTrackedPlayer());

    bridge.player.tracked$.subscribe(() => this.bindToTrackedPlayer());

    mapUi.destroyed$.subscribe(() => this.clear());

    mapUi.resourcesEnabled$.subscribe((enabled) => {
      this.container.visible = enabled;
    });

    mapUi.fogOfWarEnabled$
      .pipe(skip(1))
      .subscribe(() => this.bindToTrackedPlayer());

    camera.scale$.subscribe((scale) => {
      this.setScale(scale);
    });
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
      drawer.container.scale.set(resourceScale);
    }
  }

  private async bindToTrackedPlayer() {
    this.clear();
    const resources = await bridge.resources.getAll({
      fogOfWarEnabled: mapUi.fogOfWarEnabled,
    });

    for (const resource of resources) {
      this.addResource(resource);
    }
  }

  private addResource(resource: ResourceWithTileChanneled) {
    let drawer = this.resourceDrawers.get(resource.tile.id);
    if (!drawer) {
      drawer = new ResourceDrawer();
      this.resourceDrawers.set(resource.tile.id, drawer);
      this.resources.set(resource.tile.id, resource.id);
      this.container.addChild(drawer.container);
    }
    drawer.draw(resource);
  }

  private removeResource(resource: ResourceWithTileChanneled) {
    const drawer = this.resourceDrawers.get(resource.tile.id);
    if (!drawer) {
      return;
    }
    drawer.destroy();
    this.resourceDrawers.delete(resource.tile.id);
    this.resources.delete(resource.tile.id);
  }
}

function getScale(scale: number) {
  return Math.pow(0.3 / TILE_SIZE / scale, 0.5);
}

class ResourceDrawer {
  container = new Container();

  resourcesTextures = getAssets().resourcesSpritesheet.textures;

  resourceSprite = new Sprite();
  bgSprite = new Sprite({ texture: this.resourcesTextures["resource-bg.png"] });

  constructor() {
    this.bgSprite.scale.set(1.15);
    this.bgSprite.anchor.set(0.5, 0.5);
    this.resourceSprite.anchor.set(0.5, 0.5);
    this.container.addChild(this.bgSprite);
    this.container.addChild(this.resourceSprite);
  }

  public destroy() {
    this.container.destroy({ children: true });
  }

  public draw(resource: ResourceWithTileChanneled) {
    const textureName = `${resource.id}.png`;
    this.resourceSprite.texture =
      this.resourcesTextures[textureName] ??
      this.resourcesTextures["resource-unknown.png"];

    putContainerAtTileCentered(this.container, resource.tile);
    this.container.y += 0.2;

    const scale = getScale(camera.transform.scale);
    this.container.scale.set(scale);
  }
}
