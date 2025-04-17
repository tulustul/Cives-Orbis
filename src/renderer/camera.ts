import { BehaviorSubject } from "rxjs";

import { bridge } from "@/bridge";
import { PlayerViewBoundingBox } from "@/core/player";
import { GameInfo, TileCoords } from "@/core/serialization/channel";
import { Application } from "pixi.js";
import { Animation, Animations } from "./animation";
import { TILE_ROW_OFFSET, TILE_SIZE } from "./constants";
import { getTileCoords } from "./utils";

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

export interface BoundingBox {
  xStart: number;
  yStart: number;
  xEnd: number;
  yEnd: number;
}

export class Camera {
  MAX_ZOOM = TILE_SIZE; // tile graphics width in pixels
  MIN_ZOOM = 2;

  transform = { x: 0, y: 0, scale: 130 };
  private _transform$ = new BehaviorSubject<Transform>(this.transform);
  transform$ = this._transform$.asObservable();
  private transformChanged = false;

  private app!: Application;

  private scaleAnimation: Animation<number> | null = null;

  public tileBoundingBox: BoundingBox = {
    xStart: 0,
    yStart: 0,
    xEnd: 0,
    yEnd: 0,
  };

  gameInfo: GameInfo | null = null;

  playerBbox: PlayerViewBoundingBox = {
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,
  };

  constructor() {
    bridge.game.start$.subscribe((gameStartInfo) => {
      this.gameInfo = gameStartInfo.gameInfo;
    });

    // bridge.tiles.explored$.subscribe((explored) => {
    //   this.playerBbox = explored.viewBoundingBox;
    //   this.update();
    // });

    // bridge.player.tracked$.subscribe(async () => {
    //   if (mapUi.fogOfWarEnabled) {
    //     const explored = await bridge.tiles.getAllExplored();
    //     this.playerBbox = explored.viewBoundingBox;
    //     this.update();
    //   }
    // });

    // mapUi.fogOfWarEnabled$.pipe(skip(1)).subscribe(async (enabled) => {
    //   if (enabled) {
    //     const explored = await bridge.tiles.getAllExplored();
    //     this.playerBbox = explored.viewBoundingBox;
    //     this.update();
    //   } else {
    //     if (this.gameInfo) {
    //       this.playerBbox = {
    //         minX: 0,
    //         maxX: this.gameInfo.mapWidth - 1,
    //         minY: 0,
    //         maxY: this.gameInfo.mapHeight - 1,
    //       };
    //       this.update();
    //     }
    //   }
    // });
  }

  setApp(app: Application) {
    this.app = app;
    app.ticker.add(() => {
      if (this.transformChanged) {
        this._transform$.next(this.transform);
        this.transformChanged = false;
      }
    });
  }

  moveBy(x: number, y: number) {
    this.transform.x -= x / this.transform.scale;
    this.transform.y -= y / this.transform.scale;
    this.update();
  }

  moveTo(x: number, y: number) {
    this.transform.x = x;
    this.transform.y = y;
    this.update();
  }

  private update() {
    // this.clampTransform();
    this.transformChanged = true;
    this.updateBoundingBox();
  }

  // clampTransform() {
  //   if (!this.gameInfo) {
  //     return;
  //   }

  //   // this.clampScale();

  //   const t = this.transform;

  //   const [minX, minY] = this.screenToTileCoords(0, 0);
  //   const [maxX, maxY] = this.screenToTileCoords(
  //     this.app.canvas.width,
  //     this.app.canvas.height
  //   );

  //   const width = Math.floor(this.app.canvas.width / t.scale);
  //   const height = Math.floor(this.app.canvas.height / t.scale) * 0.75;

  //   // const minX = this.playerBbox.minX - 5; //- width / 2;
  //   // const maxX = this.playerBbox.maxX + 5; //- width / 2;
  //   // const minY = this.playerBbox.minY - 5; //- height / 2;
  //   // const maxY = this.playerBbox.maxY + 5; //- height / 2;

  //   // t.x = Math.max(minX, Math.min(maxX, t.x));
  //   // t.y = Math.max(minY / 0.75, Math.min(maxY / 0.75, t.y));
  // }

  clampScale() {
    // const [w, h] = [
    //   this.playerBbox.maxX - this.playerBbox.minX + 1,
    //   this.playerBbox.maxY - this.playerBbox.minY + 1,
    // ];
    // const minScale = Math.max(
    //   this.MIN_ZOOM,
    //   (TILE_SIZE / Math.max(w, h * 0.75)) * 1.5
    // );
    // this.transform.scale = Math.max(
    //   minScale,
    //   Math.min(this.MAX_ZOOM, this.transform.scale)
    // );
  }

  refresh() {
    this.moveTo(this.transform.x, this.transform.y);
  }

  moveToTileWithEasing(tile: TileCoords) {
    const t = this.transform;
    const [x, y] = getTileCoords(tile);

    Animations.run({
      from: [t.x, t.y],
      to: [x, y],
      duration: 600,
      easing: Animations.easing.easeOutCubic,
      fn: (pos) => this.moveTo(pos[0], pos[1]),
    });
  }

  scaleToWithEasing(
    newScale: number,
    screenPivotX: number,
    screenPivotY: number,
    duration = 600,
  ) {
    const t = this.transform;

    if (this.scaleAnimation) {
      Animations.cancel(this.scaleAnimation);
    }

    this.scaleAnimation = Animations.run({
      from: t.scale,
      to: newScale,
      duration,
      easing: Animations.easing.easeOutCubic,
      fn: (scale) => this.scaleTo(scale, screenPivotX, screenPivotY),
      onComplete: () => (this.scaleAnimation = null),
    });
  }

  scaleByWithEasing(
    scaleFactor: number,
    screenPivotX: number,
    screenPivotY: number,
    duration = 600,
  ) {
    const t = this.transform;
    const currentScale = this.scaleAnimation?.options.to || t.scale;
    const newScale = currentScale * scaleFactor;
    this.scaleToWithEasing(newScale, screenPivotX, screenPivotY, duration);
  }

  scaleTo(scale: number, screenPivotX: number, screenPivotY: number) {
    const t = this.transform;
    const [x1, y1] = this.screenToCanvas(screenPivotX, screenPivotY);

    t.scale = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, scale));
    this.clampScale();

    const [x2, y2] = this.screenToCanvas(screenPivotX, screenPivotY);

    t.x += x1 - x2;
    t.y += y1 - y2;

    this.update();
  }

  moveToTile(tile: TileCoords) {
    const [x, y] = getTileCoords(tile);
    this.moveTo(x, y);
  }

  screenToCanvas(screenX: number, screenY: number): [number, number] {
    const t = this.transform;
    return [
      (screenX - this.app.canvas.width / 2) / t.scale + t.x,
      (screenY - this.app.canvas.height / 2) / t.scale + t.y,
    ];
  }

  screenToTileCoords(screenX: number, screenY: number): [number, number] {
    const t = Math.tan(Math.PI / 6);
    let [x, y] = this.screenToCanvas(screenX, screenY);
    y /= TILE_ROW_OFFSET;
    let yi = Math.floor(y);
    x = x - (yi % 2 ? 0.5 : 0);
    let xi = Math.floor(x);

    const y1 = 0.25 - (y - yi) * TILE_ROW_OFFSET;
    if (y1 > 0) {
      const x1 = x - xi;
      if (x1 < 0.5) {
        const y2 = t * x1;
        if (y1 > y2) {
          xi += yi % 2 ? 0 : -1;
          yi -= 1;
        }
      } else {
        const y2 = t * (1 - x1);
        if (y1 > y2) {
          xi += yi % 2 ? 1 : 0;
          yi -= 1;
        }
      }
    }
    return [xi, yi];
  }

  canvasToScreen(canvasX: number, canvasY: number): [number, number] {
    const t = this.transform;
    return [
      t.scale * (canvasX - t.x) + this.app.canvas.width / 2,
      t.scale * (canvasY - t.y) + this.app.canvas.height / 2,
    ];
  }

  gameToScreen(gameX: number, gameY: number): [number, number] {
    if (Math.floor(gameY) % 2) {
      gameX += 0.5;
    }
    return this.canvasToScreen(gameX, gameY * 0.75);
  }

  updateBoundingBox() {
    if (!this.gameInfo) {
      return;
    }

    const t = this.transform;
    const width = Math.floor(this.app.canvas.width / t.scale);
    const height = Math.floor(this.app.canvas.height / t.scale);

    const w = this.gameInfo.mapWidth;
    const h = this.gameInfo.mapHeight;

    const xStart = Math.floor(t.x - width / 2 - 1);
    const yStart = Math.floor(t.y - height / 2);

    this.tileBoundingBox.xStart = Math.max(0, Math.min(w, xStart));
    this.tileBoundingBox.yStart = Math.max(0, Math.min(h, yStart));
    this.tileBoundingBox.xEnd = Math.min(w, xStart + width + 3);
    this.tileBoundingBox.yEnd = Math.min(h, (yStart + height + 2) / 0.75);
  }
}

export const camera = new Camera();
