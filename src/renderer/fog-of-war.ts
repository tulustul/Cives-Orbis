import { TileFogOfWar } from "@/shared";
import { bridge } from "@/bridge";
import { mapUi } from "@/ui/mapUi";
import { AttributeOptions, Container, Shader } from "pixi.js";
import { HexDrawer } from "./hexDrawer";
import { getAssets } from "./assets";

const VERTEX_PROGRAM = `#version 300 es

precision mediump float;

in vec2 aVertexPosition;
in vec2 aInstancePosition;
in uint aTileData;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

out vec2 point;
out vec2 uv;
flat out uint tileData;

void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  point = aVertexPosition - vec2(0.5, 0.5);
  uv = aVertexPosition + aInstancePosition;
  tileData = aTileData;
  gl_Position = vec4((mvp * vec3(aVertexPosition + aInstancePosition, 1.0)).xy, 0.0, 1.0);
}`;

const FRAGMENT_PROGRAM = `#version 300 es

precision mediump float;

const float SQRT3 = 1.73205080757;
const float HALF_SQRT3 = 0.5 * SQRT3;
const float sharpness = 1.9;

const vec2 N[6] = vec2[6](
  vec2(  0.5,  HALF_SQRT3 ),
  vec2( -0.5,  HALF_SQRT3 ),
  vec2( -1.0,          0.0 ),
  vec2( -0.5, -HALF_SQRT3 ),
  vec2(  0.5, -HALF_SQRT3 ),
  vec2(  1.0,          0.0 )
);

in vec2 uv;
in vec2 point;
flat in uint tileData;
out vec4 fragColor;

uniform sampler2D noise;

float sampleNoise(float scale) {
  return texture( noise, uv * scale).x;
}

float getFogValue(uint data, float noise) {
  vec2 p = point * (0.99 + noise);
  // vec2 p = point;
  float v = 0.0;
  for (int i = 0; i < 6; ++i) {
    if ((data & (1u << i)) != 0u) {
      v = max(v, -dot(p, N[i]));
    }
  }
  return clamp(sharpness - sharpness * 2.0 * v, 0.0, 1.0);
}

void main() {
  if (tileData == 0u) {
    discard;
  }

  float noise1 = sampleNoise(0.4) * 0.1;
  float noise2 = sampleNoise(0.1) * 0.1;
  float noise = min(1.0, noise1 + noise2);

  float explored = getFogValue(tileData >> 2, noise);
  float visible = 0.0;

  if ((tileData & 2u) != 0u) {
    visible = getFogValue(tileData >> 8, noise);
  }

  fragColor = vec4(explored, 0.0, 0.0, visible);
}`;

export class FogOfWarMaskDrawer extends HexDrawer<TileFogOfWar> {
  tileData = new Uint32Array(0);

  constructor(container: Container) {
    super(container);

    bridge.tiles.fogOfWar$.subscribe((fogOfWar) =>
      this.updateTiles(fogOfWar.tiles),
    );

    bridge.player.tracked$.subscribe(() => this.bindToTrackedPlayer());

    bridge.game.start$.subscribe(() => this.bindToTrackedPlayer());

    mapUi.destroyed$.subscribe(() => this.clear());
  }

  private async bindToTrackedPlayer() {
    const fogOfWar = await bridge.tiles.getFogOfWar();
    if (this.tilesMap.size === 0) {
      this.addTiles(fogOfWar.tiles);
    } else {
      this.updateTiles(fogOfWar.tiles);
    }
  }

  updateTiles(tiles: TileFogOfWar[]) {
    for (const tile of tiles) {
      this.setTileAttributes(tile, this.tilesIndexMap.get(tile.id)!);
    }
    this.updateBuffers_();
  }

  override getGeometryAttributes(): AttributeOptions {
    return {
      aTileData: {
        buffer: this.tileData,
        format: "uint32",
        instance: true,
      },
    };
  }

  override setTileAttributes(tile: TileFogOfWar, index: number) {
    this.tileData[index] =
      tile.status + (tile.exploredBorder << 2) + (tile.visibleBorder << 8);
  }

  override buildShader(): Shader {
    return Shader.from({
      gl: { fragment: FRAGMENT_PROGRAM, vertex: VERTEX_PROGRAM },

      resources: {
        noise: getAssets().textures.whitenoise.source,
      },
    });
  }

  override initializeBuffers(maxInstances: number) {
    super.initializeBuffers(maxInstances);
    this.tileData = new Uint32Array(maxInstances);
  }

  override updateBuffers(): void {
    super.updateBuffers();
  }

  private updateBuffers_() {
    this.geometry?.getAttribute("aTileData").buffer.update();
  }
}
