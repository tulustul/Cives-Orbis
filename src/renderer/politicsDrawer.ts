import { bridge } from "@/bridge";
import { TileCoords, TileFogOfWar } from "@/core/serialization/channel";
import { mapUi } from "@/ui/mapUi";
import { AttributeOptions, Container, Shader } from "pixi.js";
import { Area } from "./area";
import { getAssets } from "./assets";
import { HexDrawerNew } from "./hexDrawer";
import { hexColorToNumber } from "./utils";

const VERTEX_PROGRAM = `#version 300 es

precision mediump float;

in vec2 aVertexPosition;
in vec2 aDistanceToCenter;
in vec2 aInstancePosition;
in uint aIsExplored;
in uint aExploredBorders;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

out vec2 vDistanceToCenter;
out vec2 uv;
flat out uint vIsExplored;
flat out uint vExploredBorders;

void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  vDistanceToCenter = aDistanceToCenter;
  uv = aVertexPosition;
  vIsExplored = aIsExplored;
  vExploredBorders = aExploredBorders;
  gl_Position = vec4((mvp * vec3(aVertexPosition + aInstancePosition, 1.0)).xy, 0.0, 1.0);
}`;

const FRAGMENT_PROGRAM = `#version 300 es

precision mediump float;

const float SQRT3 = 1.73205080757;
const float HALF_SQRT3 = 0.5 * SQRT3;
const float sharpness = 2.0;

const vec2 N[6] = vec2[6](
  vec2(  0.5,  HALF_SQRT3 ),
  vec2( -0.5,  HALF_SQRT3 ),
  vec2( -1.0,          0.0 ),
  vec2( -0.5, -HALF_SQRT3 ),
  vec2(  0.5, -HALF_SQRT3 ),
  vec2(  1.0,          0.0 )
);

in vec2 uv;
flat in uint vIsExplored;
flat in uint vExploredBorders;
out vec4 fragColor;

uniform sampler2D noise;

float sampleNoise(vec2 uv, float scale) {
  return texture( noise, uv * scale).x;
}

void main() {
  if (vIsExplored == 0u) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  vec2 p = uv - 0.5;
  float v = 0.0;
  for (int i = 0; i < 6; ++i) {
    if ((vExploredBorders & (1u << i)) != 0u) {
      v = max(v, -dot(p, N[i]));
    }
  }

  float noise = sampleNoise(uv, 0.02) - 0.5;
  // v = noise * 1.5;

  float alpha = clamp(sharpness - sharpness * 2.0 * v, 0.0, 1.0);

  fragColor = vec4(0.0, 0.0, 0.0, 1.0 - alpha);
  // fragColor = vec4(noise, 0.0, 0.0,noise);
}`;

export class PoliticsDrawer {
  areas = new Map<number, Area>();

  constructor(private container: Container) {
    bridge.areas.tilesAdded$.subscribe((bridgeArea) => {
      const area = this.areas.get(bridgeArea.id);
      if (area) {
        area.addTiles(bridgeArea.tiles);
      }
    });

    bridge.areas.tilesRemoved$.subscribe((bridgeArea) => {
      const area = this.areas.get(bridgeArea.id);
      if (area) {
        // area.removeTiles(bridgeArea.tiles);
      }
    });

    bridge.game.start$.subscribe(() => this.build());

    mapUi.destroyed$.subscribe(() => this.clear());
  }

  async build() {
    this.clear();

    const areas = await bridge.areas.getAll();

    for (const bridgeArea of areas) {
      const area = new Area(
        {
          color: hexColorToNumber(bridgeArea.primaryColor),
          container: this.container,
          backgroundOpacity: 0.1,
          shadowSize: 0.2,
          borderSize: 0.04,
          shadowStrength: 1,
          visibleOnWater: false,
        },
        600,
      );

      this.areas.set(bridgeArea.id, area);
      area.setTiles(bridgeArea.tiles);
    }
  }

  clear() {
    for (const area of this.areas.values()) {
      area.clear();
    }
    this.areas.clear();
  }
}

export class PoliticsAndExploredTilesDrawer extends HexDrawerNew<TileCoords> {
  exploredBorders = new Uint32Array(this.maxInstances);
  isExplored = new Uint32Array(this.maxInstances);

  constructor(container: Container, maxInstances: number) {
    super(container, maxInstances);

    // bridge.tiles.showedAdded$.subscribe((tiles) => this.reveal(tiles));

    bridge.player.tracked$.subscribe(() => this.bindToTrackedPlayer());

    bridge.game.start$.subscribe(() => {
      this.build();
      this.bindToTrackedPlayer();
    });

    mapUi.destroyed$.subscribe(() => this.clear());
  }

  private async build() {
    const tiles = await bridge.tiles.getAll();
    this.setTiles(tiles);
    this.bindToTrackedPlayer();
  }

  private reveal(tiles: TileFogOfWar[]) {
    for (const tile of tiles) {
      const index = this.tilesIndexMap.get(tile.id)!;
      this.isExplored[index] = 1;
      // this.exploredBorders[index] = tile.border;
    }
    this.geometry!.attributes.aIsExplored.buffer.update();
    this.geometry!.attributes.aExploredBorders.buffer.update();
  }

  private async bindToTrackedPlayer() {
    const exploredTiles = await bridge.tiles.getFogOfWar();
    this.reveal(exploredTiles.tiles);
    this.geometry!.instanceCount = this.maxInstances;
  }

  override getGeometryAttributes(): AttributeOptions {
    return {
      aIsExplored: {
        buffer: this.isExplored,
        format: "uint32",
        instance: true,
      },
      aExploredBorders: {
        buffer: this.exploredBorders,
        format: "uint32",
        instance: true,
      },
    };
  }

  override buildShader(): Shader {
    return Shader.from({
      gl: { fragment: FRAGMENT_PROGRAM, vertex: VERTEX_PROGRAM },
      resources: {
        noise: getAssets().textures.noise.source,
      },
    });
  }

  override updateBuffers(): void {
    super.updateBuffers();
    this.geometry!.attributes.aIsExplored.buffer.update();
    this.geometry!.attributes.aExploredBorders.buffer.update();
  }
}
