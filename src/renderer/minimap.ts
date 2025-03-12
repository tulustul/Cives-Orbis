import {
  Application,
  Container,
  Graphics,
  RenderTexture,
  Sprite,
} from "pixi.js";

import { bridge } from "@/bridge";
import { TileChanneled, TileCoords } from "@/core/serialization/channel";
import { Climate, LandForm, SeaLevel, TileDirection } from "@/shared";
import { camera, Transform } from "./camera";
import { renderer } from "./renderer";
import { drawHex } from "./utils";
import { skip } from "rxjs";
import { PlayerViewBoundingBox } from "@/core/player";
import { mapUi } from "@/ui/mapUi";

const SEA_COLORS: Record<SeaLevel, number> = {
  [SeaLevel.deep]: 0x25619a,
  [SeaLevel.shallow]: 0x4383b5,
  [SeaLevel.none]: 0x000000,
};

const CLIMATE_COLORS: Record<Climate, number> = {
  [Climate.temperate]: 0x516733,
  [Climate.desert]: 0xc7bd93,
  [Climate.savanna]: 0xb4a73f,
  [Climate.tropical]: 0x6c9b2b,
  [Climate.tundra]: 0x9cb3b6,
  [Climate.arctic]: 0xe5e5e5,
};

const MOUNTAIN_COLOR = 0x666666;

const maxSize = 300;

type Size = { width: number; height: number };

export class MinimapRenderer {
  canvasSize: Size = { width: 0, height: 0 };
  mapSize: Size = { width: 0, height: 0 };

  public container = new Container();

  private mapScene = new Container();

  private cameraGraphics = new Graphics();

  public transform: Transform = { x: 0, y: 0, scale: 1 };

  private mapSprite = new Sprite();

  private mapTexture!: RenderTexture;

  private tilesMap = new Map<number, Graphics>();

  public app!: Application;

  constructor() {
    bridge.game.start$.pipe(skip(1)).subscribe(() => {
      this.clear();
      this.build();
    });

    bridge.tiles.explored$.subscribe((explored) => {
      this.reveal(explored.tiles);
      if (mapUi.fogOfWarEnabled) {
        this.updateTransform(explored.viewBoundingBox);
      }
      this.updateMap();
    });

    bridge.player.tracked$.subscribe(async () => {
      if (mapUi.fogOfWarEnabled) {
        this.setAllTilesVisibility(false);
        const explored = await bridge.tiles.getAllExplored();
        this.reveal(explored.tiles);
        this.updateTransform(explored.viewBoundingBox);
        this.updateMap();
      }
    });

    bridge.tiles.updated$.subscribe((tiles) => {
      this.drawTiles(tiles);
      this.updateMap();
    });

    mapUi.fogOfWarEnabled$.pipe(skip(1)).subscribe(async (enabled) => {
      if (enabled) {
        this.setAllTilesVisibility(false);
        const explored = await bridge.tiles.getAllExplored();
        this.reveal(explored.tiles);
        this.updateTransform(explored.viewBoundingBox);
      } else {
        this.setAllTilesVisibility(true);
        this.updateTransform({
          minX: 0,
          maxX: this.mapSize.width - 1,
          minY: 0,
          maxY: this.mapSize.height - 1,
        });
      }
      this.updateMap();
    });

    this.container.addChild(this.mapSprite);
    this.container.addChild(this.cameraGraphics);
  }

  async calculateSize() {
    const startInfo = await bridge.game.getInfo();

    const w = startInfo.gameInfo.mapWidth;
    const h = startInfo.gameInfo.mapHeight;

    this.mapSize.width = w;
    this.mapSize.height = h;

    if (w > h) {
      this.canvasSize.width = maxSize;
      this.canvasSize.height = maxSize / (w / h);
    } else {
      this.canvasSize.width = maxSize / (h / w);
      this.canvasSize.height = maxSize;
    }
    this.canvasSize.height *= 0.75;
  }

  async create(app: Application) {
    if (this.app) {
      return;
    }
    this.app = app;

    this.mapTexture = RenderTexture.create({
      width: this.canvasSize.width,
      height: this.canvasSize.height,
    });
    this.mapSprite.texture = this.mapTexture;

    this.app.stage.addChild(this.container);

    camera.transform$.subscribe(() => {
      this.updateCamera();
    });

    await this.build();
  }

  async build() {
    const allTiles = await bridge.tiles.getAll();
    this.drawTiles(allTiles);

    this.setAllTilesVisibility(false);
    const explored = await bridge.tiles.getAllExplored();
    this.reveal(explored.tiles);
    this.updateTransform(explored.viewBoundingBox);

    this.updateMap();
  }

  clear() {
    for (const g of this.tilesMap.values()) {
      g.destroy();
    }
    this.tilesMap.clear();
  }

  destroy() {
    if (!this.app) {
      return;
    }
    this.clear();
    this.mapTexture.destroy();
    this.mapSprite.destroy();
  }

  private setAllTilesVisibility(visible: boolean) {
    for (const g of this.tilesMap.values()) {
      g.visible = visible;
    }
  }

  private reveal(tiles: TileCoords[]) {
    for (const tile of tiles) {
      const g = this.tilesMap.get(tile.id);
      if (g) {
        g.visible = true;
      }
    }
  }

  private updateTransform(bbox: PlayerViewBoundingBox) {
    const [wq, hq] = [bbox.maxX - bbox.minX + 1, bbox.maxY - bbox.minY + 1];
    const [w, h] = [
      Math.max(15, wq),
      Math.max(
        Math.floor(15 / (this.canvasSize.width / this.canvasSize.height)),
        hq
      ),
    ];

    if (w / h >= this.canvasSize.width / (this.canvasSize.height / 0.75)) {
      this.transform.scale = this.canvasSize.width / w;
    } else {
      this.transform.scale = this.canvasSize.height / h / 0.75;
    }

    const maxW = Math.floor(this.canvasSize.width / this.transform.scale);
    const maxH = Math.floor(
      this.canvasSize.height / this.transform.scale / 0.75
    );
    const offsetX = Math.min(bbox.minX, wq < maxW ? (maxW - wq) / 2 : 0);
    const offsetY = Math.min(bbox.minY, hq < maxH ? (maxH - hq) / 2 : 0);

    const minOffsetX = maxW - this.mapSize.width;
    const minOffsetY = maxH - this.mapSize.height;

    const x = Math.max(minOffsetX, -bbox.minX + offsetX) - 0.25;
    const y = Math.max(minOffsetY, -bbox.minY + offsetY) - 0.25;

    this.transform.x = x * this.transform.scale;
    this.transform.y = y * this.transform.scale * 0.75;

    this.mapScene.position.set(this.transform.x, this.transform.y);
    this.mapScene.scale.set(this.transform.scale);

    this.updateCamera();
  }

  private updateCamera() {
    const t = camera.transform;
    const width = renderer.canvas.width / t.scale;
    const height = renderer.canvas.height / t.scale;

    const xStart = (t.x - width / 2) * this.transform.scale + this.transform.x;
    const yStart = (t.y - height / 2) * this.transform.scale + this.transform.y;

    this.cameraGraphics.clear();

    this.cameraGraphics.setStrokeStyle({ width: 1, color: 0xffffff });
    this.cameraGraphics
      .rect(
        xStart,
        yStart,
        width * this.transform.scale,
        height * this.transform.scale
      )
      .stroke();

    if (this.app) {
      this.app.render();
    }
  }

  private updateMap() {
    this.app.renderer.render({
      container: this.mapScene,
      target: this.mapTexture,
    });
    this.app.render();
  }

  private drawTiles(tiles: TileChanneled[]) {
    for (const tile of tiles) {
      this.drawTile(tile);
    }
  }

  private drawTile(tile: TileChanneled) {
    let g = this.tilesMap.get(tile.id);
    if (g) {
      g.clear();
    } else {
      g = new Graphics();
      this.mapScene.addChild(g);
      this.tilesMap.set(tile.id, g);
    }

    let color: number;

    if (tile.seaLevel !== SeaLevel.none) {
      color = SEA_COLORS[tile.seaLevel];
    } else if (tile.playerColor) {
      color = tile.playerColor;
    } else if (tile.landForm === LandForm.mountains) {
      color = MOUNTAIN_COLOR;
    } else {
      color = CLIMATE_COLORS[tile.climate];
    }

    g.clear();

    drawHex(g, tile.x, tile.y);
    g.fill({ color });

    this.renderRivers(tile, g);
  }

  private renderRivers(tile: TileChanneled, graphics: Graphics) {
    if (!tile.riverParts.length) {
      return;
    }
    const x = tile.x + (tile.y % 2 ? 0.5 : 0);
    const y = tile.y * 0.75;

    for (const river of tile.riverParts) {
      if (river === TileDirection.NW) {
        graphics.moveTo(x, y + 0.25);
        graphics.lineTo(x + 0.5, y);
      }

      if (river === TileDirection.NE) {
        graphics.moveTo(x + 0.5, y);
        graphics.lineTo(x + 1, y + 0.25);
      }

      if (river === TileDirection.E) {
        graphics.moveTo(x + 1, y + 0.25);
        graphics.lineTo(x + 1, y + 0.75);
      }

      if (river === TileDirection.SE) {
        graphics.moveTo(x + 1, y + 0.75);
        graphics.lineTo(x + 0.5, y + 1);
      }

      if (river === TileDirection.SW) {
        graphics.moveTo(x + 0.5, y + 1);
        graphics.lineTo(x + 0, y + 0.75);
      }

      if (river === TileDirection.W) {
        graphics.moveTo(x + 0, y + 0.75);
        graphics.lineTo(x + 0, y + 0.25);
      }
    }

    graphics.stroke({ width: 0.2, color: SEA_COLORS[SeaLevel.deep] });
  }
}
