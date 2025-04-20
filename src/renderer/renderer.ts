import {
  Application,
  Container,
  Filter,
  IRenderLayer,
  MaskFilter,
  RenderLayer,
  UpdateTransformOptions,
} from "pixi.js";

import { Subject } from "rxjs";

import { mapUi } from "@/ui/mapUi";
import { animationsManager } from "./animation";
import { AreasDrawer } from "./areasDrawer";
import { camera } from "./camera";
import { CityFocusDrawer } from "./cityFocusDrawer";
import { ExploredTilesDrawer } from "./exploredTilesDrawer";
import { FogOfWarFilter } from "./filters/fog-of-war-filter";
import { GrayscaleFilter } from "./filters/grayscaleFilter";
import { FogOfWarMaskDrawer } from "./fog-of-war";
import { Layer } from "./layer";
import { OverlaysRenderer } from "./overlays";
import { PathRenderer } from "./path";
import {
  PoliticsAndExploredTilesDrawer,
  PoliticsDrawer,
} from "./politicsDrawer";
import { MapDrawer } from "./terrain";
import { UnitsDrawer } from "./unitsDrawer";
import { SelectedUnitDrawer } from "./selectedUnitDrawer";
import { ResourcesDrawer } from "./resourcesDrawer";

export class GameRenderer {
  app!: Application;

  canvas!: HTMLCanvasElement;

  mapDrawer!: MapDrawer;

  fogOfWarDrawer!: FogOfWarMaskDrawer;
  politicsAndExploredTilesDrawer!: PoliticsAndExploredTilesDrawer;
  visibleTilesDrawer!: ExploredTilesDrawer;
  cityFocusDrawer!: CityFocusDrawer;

  overlays!: OverlaysRenderer;

  path!: PathRenderer;

  mapLayer!: Layer;
  yieldsLayer!: IRenderLayer;

  fogOfWarLayer!: Layer;
  // exploredTilesLayer!: Layer;
  cityFocusLayer!: Layer;

  overlaysContainer = new Container({ label: "overlays" });
  mapContainer = new Container({ label: "map" });
  unitsContainer = new Container({ label: "unitsAndCities" });
  resourcesContainer = new Container({ label: "resources" });
  politicsContainer = new Container({ label: "politics" });
  unitsDrawer = new UnitsDrawer(this.unitsContainer);
  areaDrawer = new AreasDrawer(this.overlaysContainer);
  politicsDrawer = new PoliticsDrawer(this.politicsContainer);
  selectedUnitDrawer = new SelectedUnitDrawer(this.mapContainer);
  resourcesDrawer!: ResourcesDrawer;

  cityFocusFilter!: GrayscaleFilter;

  lastScale = camera.transform.scale;

  private _tick$ = new Subject<void>();
  tick$ = this._tick$.asObservable();

  constructor() {
    mapUi.fogOfWarEnabled$.subscribe(() => {
      this.updateMapFilters();
    });

    mapUi.selectedCity$.subscribe(() => {
      this.updateMapFilters();
    });

    mapUi.yieldsEnabled$.subscribe((enabled) => {
      if (!this.mapLayer) {
        return;
      }
      if (enabled) {
        this.mapLayer.stage.addChild(this.yieldsLayer);
      } else {
        this.mapLayer.stage.removeChild(this.yieldsLayer);
      }
    });

    mapUi.resourcesEnabled$.subscribe((enabled) => {
      this.resourcesContainer.visible = enabled;
    });

    mapUi.politicsEnabled$.subscribe((enabled) => {
      this.politicsContainer.visible = enabled;
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

    camera.setApp(this.app);
    this.canvas = canvas;

    this.mapLayer = new Layer(this.app, "mapLayer");
    this.fogOfWarLayer = new Layer(this.app, "fogOfWarLayer");
    // this.exploredTilesLayer = new Layer(this.app, "visibleTilesLayer");
    this.cityFocusLayer = new Layer(this.app, "cityFocusLayer");
    this.yieldsLayer = new RenderLayer();

    this.mapDrawer = new MapDrawer(this.mapLayer.stage, this.yieldsLayer);

    this.fogOfWarDrawer = new FogOfWarMaskDrawer(this.fogOfWarLayer.stage, 600);
    // this.politicsAndExploredTilesDrawer = new PoliticsAndExploredTilesDrawer(
    //   this.mapContainer,
    //   600,
    // );
    // this.visibleTilesDrawer = new ExploredTilesDrawer(
    //   this.exploredTilesLayer.stage,
    // );
    this.cityFocusFilter = new GrayscaleFilter({
      sprite: this.cityFocusLayer.sprite,
    });
    this.cityFocusFilter.enabled = false;
    this.cityFocusDrawer = new CityFocusDrawer(this.cityFocusLayer.stage);

    this.overlays = new OverlaysRenderer(this.overlaysContainer);

    this.path = new PathRenderer(this.overlaysContainer);

    this.resourcesDrawer = new ResourcesDrawer(this.resourcesContainer);

    this.overlaysContainer.interactiveChildren = false;

    this.app.stage.addChild(this.mapLayer.sprite);
    this.app.stage.addChild(this.overlaysContainer);
    this.app.stage.addChild(this.politicsContainer);
    // this.app.stage.addChild(this.exploredTilesLayer.sprite);
    this.app.stage.addChild(this.mapContainer);
    this.mapContainer.addChild(this.resourcesContainer);
    this.mapContainer.addChild(this.unitsContainer);
    this.unitsContainer.zIndex = 1000;
    this.politicsContainer.zIndex = 2000;
    this.overlaysContainer.zIndex = 3000;

    this.mapLayer.stage.addChild(this.yieldsLayer);

    camera.transform$.subscribe((t) => {
      const x = (-t.x + this.canvas.width / 2 / t.scale) * t.scale;
      const y = (-t.y + this.canvas.height / 2 / t.scale) * t.scale;

      const transform: Partial<UpdateTransformOptions> = {
        x,
        y,
        scaleX: t.scale,
        scaleY: t.scale,
      };

      // this.mapDrawer.unitsDrawer.container.setTransform(x, y, t.scale, t.scale);
      this.mapLayer.stage.updateTransform(transform);
      this.mapContainer.updateTransform(transform);
      this.overlaysContainer.updateTransform(transform);
      this.politicsContainer.updateTransform(transform);
      this.fogOfWarLayer.stage.updateTransform(transform);
      this.cityFocusLayer.stage.updateTransform(transform);
      // this.exploredTilesLayer.stage.updateTransform(transform);

      this.updateMapFilters();
    });

    this.app.ticker.add(() => {
      animationsManager.update(this.app.ticker.deltaMS);
      this.selectedUnitDrawer.tick(this.app.ticker.deltaMS);
      this._tick$.next();

      const scale = camera.transform.scale;

      if (scale != this.lastScale) {
        this.lastScale = scale;
        this.unitsDrawer.setScale(scale);
        this.resourcesDrawer.setScale(scale);
      }

      if (this.politicsDrawer) {
        const backgroundOpacity = Math.min(
          0.2,
          Math.max(0, (70 - scale) / 150),
        );

        const shadowSize = Math.max(0.2, Math.min(0.7, (150 - scale) / 200));

        for (const area of this.politicsDrawer.areas.values()) {
          if (area.shader) {
            area.shader.resources["uniforms"].uniforms.bgOpacity =
              backgroundOpacity;
            area.shader!.resources["uniforms"].uniforms.shadowSize = shadowSize;
          }
        }
      }

      this.mapLayer.renderToTarget();
      this.fogOfWarLayer.renderToTarget();
      // this.exploredTilesLayer.renderToTarget();
      this.cityFocusLayer.renderToTarget();
    });
  }

  resize(width: number, height: number) {
    this.app.renderer.resize(width, height);
    this.mapLayer.resize(width, height);
    this.fogOfWarLayer.resize(width, height);
    // this.exploredTilesLayer.resize(width, height);
  }

  updateMapFilters() {
    if (!this.mapLayer) {
      return;
    }

    const mapFilters: Filter[] = [];
    // const unitsFilters: Filter[] = [];
    // const resourcesFilters: Filter[] = [];
    const politicsFilters: Filter[] = [];

    this.unitsContainer.mask = null;

    if (mapUi.fogOfWarEnabled) {
      this.unitsContainer.mask = this.fogOfWarLayer.sprite;

      // unitsFilters.push(
      //   new MaskFilter({
      //     sprite: this.fogOfWarLayer.sprite,
      //   }),
      // );

      mapFilters.push(
        // new MaskFilter({
        //   sprite: this.exploredTilesLayer.sprite,
        // }),
        new FogOfWarFilter({ sprite: this.fogOfWarLayer.sprite }),
      );

      // politicsFilters.push(
      //   new MaskFilter({
      //     sprite: this.exploredTilesLayer.sprite,
      //   }),
      // );

      // resourcesFilters.push(
      //   new MaskFilter({
      //     sprite: this.exploredTilesLayer.sprite,
      //   }),
      // );
    }

    if (mapUi.selectedCity) {
      mapFilters.push(this.cityFocusFilter);
    }

    this.mapLayer.sprite.filters = mapFilters;
    // this.mapLayer.sprite.mask = this.fogOfWarLayer.sprite;
    // this.unitsContainer.filters = unitsFilters;
    this.politicsContainer.filters = politicsFilters;
    // this.resourcesContainer.mask = this.fogOfWarLayer.sprite;
  }
}

export const renderer = new GameRenderer();
