import * as terrainData from "@/assets/atlas-tiles.json";
import { bridge } from "@/bridge";
import { CityChanneled } from "@/shared";
import { mapUi } from "@/ui/mapUi";
import { Container, Sprite } from "pixi.js";
import { getAssets } from "./assets";
import { putContainerAtTile, putSpriteAtTileCentered } from "./utils";

type TileTextureName = keyof typeof terrainData.frames;

export class CitiesDrawer {
  citiesDrawers = new Map<number, CityDrawer>();

  constructor(private container: Container) {
    bridge.cities.updated$.subscribe((cities) => {
      for (const city of cities) {
        this.updateCity(city);
      }
    });

    bridge.game.start$.subscribe(() => {
      this.build();
    });

    mapUi.destroyed$.subscribe(() => this.clear());
  }

  clear() {
    for (const drawer of this.citiesDrawers.values()) {
      drawer.destroy();
    }
    this.citiesDrawers.clear();
  }

  private async build() {
    this.clear();
    const cities = await bridge.cities.getAll({ fogOfWarEnabled: false });

    for (const city of cities) {
      const drawer = this.buildDrawer(city);
      drawer.draw(city);
    }
  }

  private updateCity(city: CityChanneled) {
    let drawer = this.citiesDrawers.get(city.id);
    if (!drawer) {
      drawer = this.buildDrawer(city);
    }
    drawer.draw(city);
  }

  private buildDrawer(city: CityChanneled) {
    const drawer = new CityDrawer(city);
    this.citiesDrawers.set(city.id, drawer);
    this.container.addChild(drawer.sprite);
    return drawer;
  }
}

class CityDrawer {
  sprite = new Sprite();

  tilesTextures = getAssets().tilesSpritesheet.textures;

  constructor(city: CityChanneled) {
    this.sprite.zIndex = city.tile.y;
    this.sprite.anchor.set(0.5, 0.5);
  }

  public destroy() {
    this.sprite.destroy();
  }

  draw(city: CityChanneled) {
    let textureName: TileTextureName = "city.png";
    if (city.defense.strength > 0) {
      textureName = "city-walls.png";
    }

    this.sprite.texture = this.tilesTextures[textureName];
    putSpriteAtTileCentered(this.sprite, city.tile);
  }
}
