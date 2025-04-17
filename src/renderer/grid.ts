import { bridge } from "@/bridge";
import { TilingSprite } from "pixi.js";
import { getAssets } from "./assets";
import { mapUi } from "@/ui/mapUi";
import { TILE_ROW_OFFSET } from "./constants";

export class Grid {
  public sprite: TilingSprite;

  private texture = getAssets().textures.grid;

  constructor() {
    this.sprite = new TilingSprite(this.texture);
    this.sprite.zIndex = 10;
    this.sprite.tileScale.set(1 / 128, 1 / 126.65);
    this.sprite.alpha = 0.3;
    this.sprite.visible = mapUi.gridEnabled;

    bridge.game.start$.subscribe((startInfo) => {
      this.sprite.width = startInfo.gameInfo.mapWidth;
      this.sprite.height = startInfo.gameInfo.mapHeight * TILE_ROW_OFFSET;
    });

    mapUi.gridEnabled$.subscribe((enabled) => {
      this.sprite.visible = enabled;
    });
  }
}
