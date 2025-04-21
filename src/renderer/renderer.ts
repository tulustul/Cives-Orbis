import {
  Application,
  Container,
  Filter,
  RenderLayer,
  UpdateTransformOptions,
  ContainerOptions,
} from "pixi.js";

import { mapUi } from "@/ui/mapUi";
import { animationsManager } from "./animation";
import { AreasDrawer } from "./areasDrawer";
import { camera, Transform } from "./camera";
import { CityFocusDrawer } from "./cityFocusDrawer";
import { FogOfWarFilter } from "./filters/fog-of-war-filter";
import { GrayscaleFilter } from "./filters/grayscaleFilter";
import { FogOfWarMaskDrawer } from "./fog-of-war";
import { Layer } from "./layer";
import { OverlaysDrawer } from "./overlaysDrawer";
import { PathDrawer } from "./pathDrawer";
import { PoliticsDrawer } from "./politicsDrawer";
import { ResourcesDrawer } from "./resourcesDrawer";
import { SelectedUnitDrawer } from "./selectedUnitDrawer";
import { MapDecorsDrawer } from "./mapDecorsDrawer";
import { UnitsDrawer } from "./unitsDrawer";
import { TerrainDrawer } from "./terrainDrawer";
import { merge } from "rxjs";
import { bridge } from "@/bridge";
import { awaitingExecutors } from "@/bridge/worker";
import { useUiState } from "@/ui/uiState";
import { TerrainDrawerSimple } from "./terrainDrawerSimple";

function makeContainer(label: string, options: ContainerOptions = {}) {
  return new Container({
    label,
    interactive: false,
    interactiveChildren: false,
    sortableChildren: false,
    cullableChildren: false,
    ...options,
  });
}

export class GameRenderer {
  app!: Application;

  canvas!: HTMLCanvasElement;

  yieldsLayer = new RenderLayer();

  mapLayer = new Layer("mapLayer");
  fogOfWarLayer = new Layer("fogOfWarLayer");
  cityFocusLayer = new Layer("cityFocusLayer");

  terrainContainer = makeContainer("terrain", { parent: this.mapLayer.stage });
  unitsContainer = makeContainer("units", { interactiveChildren: true });
  resourcesContainer = makeContainer("resources");
  politicsContainer = makeContainer("politics");
  overlaysContainer = makeContainer("overlays");

  terrainDrawer = new TerrainDrawer(this.terrainContainer);
  mapDecorsDrawer = new MapDecorsDrawer(
    this.terrainContainer,
    this.yieldsLayer,
  );
  unitsDrawer = new UnitsDrawer(this.unitsContainer);
  areaDrawer = new AreasDrawer(this.overlaysContainer);
  selectedUnitDrawer = new SelectedUnitDrawer(this.terrainContainer);
  overlays = new OverlaysDrawer(this.overlaysContainer);
  path = new PathDrawer(this.overlaysContainer);
  politicsDrawer = new PoliticsDrawer(this.politicsContainer);
  resourcesDrawer = new ResourcesDrawer(this.resourcesContainer);
  fogOfWarDrawer = new FogOfWarMaskDrawer(this.fogOfWarLayer.stage);
  cityFocusDrawer = new CityFocusDrawer(this.cityFocusLayer.stage);

  constructor() {
    bridge.game.start$.subscribe(() => {
      this.waitForAppReady();
    });

    merge(mapUi.fogOfWarEnabled$, mapUi.selectedCity$).subscribe(() => {
      this.updateMapFilters();
    });
  }

  async setCanvas(canvas: HTMLCanvasElement) {
    if (this.app) {
      console.warn("Canvas already set");
      return;
    }

    const [width, height] = [window.innerWidth, window.innerHeight];

    this.app = new Application();
    (globalThis as any).__PIXI_APP__ = this.app;

    await this.app.init({
      canvas,
      width,
      height,
      preference: "webgl",
      antialias: true,
      bezierSmoothness: 1,
    });
    this.app.ticker.stop();

    camera.setApp(this.app);
    this.canvas = canvas;

    this.mapLayer.bindToApp(this.app);
    this.fogOfWarLayer.bindToApp(this.app);
    this.cityFocusLayer.bindToApp(this.app);

    this.app.stage.addChild(this.mapLayer.sprite);
    this.app.stage.addChild(this.overlaysContainer);
    this.app.stage.addChild(this.politicsContainer);
    this.app.stage.addChild(this.resourcesContainer);
    this.app.stage.addChild(this.unitsContainer);

    camera.transform$.subscribe((t) => this.onCameraChange(t));

    this.app.ticker.add(() => this.onTick());

    this.updateMapFilters();
  }

  waitForAppReady() {
    setTimeout(() => {
      this.app.ticker.stop();
      if (awaitingExecutors.length) {
        this.waitForAppReady();
      } else {
        this.app.ticker.start();
        setTimeout(() => useUiState.getState().setMode("map"));
      }
    }, 10);
  }

  resize(width: number, height: number) {
    this.app.renderer.resize(width, height);
    this.mapLayer.resize(width, height);
    this.fogOfWarLayer.resize(width, height);
    this.cityFocusLayer.resize(width, height);
    this.updateMapFilters();
  }

  onTick() {
    animationsManager.update(this.app.ticker.deltaMS);
    this.selectedUnitDrawer.tick(this.app.ticker.deltaMS);
    this.terrainDrawer.tick(this.app.ticker.lastTime);

    this.mapLayer.renderToTarget();
    this.fogOfWarLayer.renderToTarget();
    this.cityFocusLayer.renderToTarget();
  }

  onCameraChange(t: Transform) {
    const x = (-t.x + this.canvas.width / 2 / t.scale) * t.scale;
    const y = (-t.y + this.canvas.height / 2 / t.scale) * t.scale;

    const transform: Partial<UpdateTransformOptions> = {
      x,
      y,
      scaleX: t.scale,
      scaleY: t.scale,
    };

    this.mapLayer.stage.updateTransform(transform);
    this.overlaysContainer.updateTransform(transform);
    this.politicsContainer.updateTransform(transform);
    this.unitsContainer.updateTransform(transform);
    this.resourcesContainer.updateTransform(transform);
    this.fogOfWarLayer.stage.updateTransform(transform);
    this.cityFocusLayer.stage.updateTransform(transform);
  }

  updateMapFilters() {
    const terrainFilters: Filter[] = [];
    this.unitsContainer.mask = null;

    if (mapUi.fogOfWarEnabled) {
      this.unitsContainer.mask = this.fogOfWarLayer.sprite;
      terrainFilters.push(
        new FogOfWarFilter({ sprite: this.fogOfWarLayer.sprite }),
      );
    }

    if (mapUi.selectedCity) {
      terrainFilters.push(
        new GrayscaleFilter({
          sprite: this.cityFocusLayer.sprite,
        }),
      );
    }

    this.mapLayer.sprite.filters = terrainFilters;
  }
}

export const renderer = new GameRenderer();
