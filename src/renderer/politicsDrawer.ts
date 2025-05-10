import { bridge } from "@/bridge";
import { TileOwnershipChanneled } from "@/shared";
import { mapUi } from "@/ui/mapUi";
import { AttributeOptions, Container, Shader } from "pixi.js";
import { HexDrawer } from "./hexDrawer";
import { hexColorToArray } from "./utils";
import { camera } from "./camera";

const VERTEX_PROGRAM = `#version 300 es

precision mediump float;

in vec2 aVertexPosition;
in vec2 aInstancePosition;
in uint aBorders;
in vec3 aPrimaryColor;
in vec3 aSecondaryColor;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

out vec2 point;
out vec2 uv;
flat out uint borders;
flat out vec3 primaryColor;
flat out vec3 secondaryColor;

void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  point = aVertexPosition - vec2(0.5, 0.5);
  uv = aVertexPosition + aInstancePosition;
  borders = aBorders;
  primaryColor = aPrimaryColor;
  secondaryColor = aSecondaryColor;
  gl_Position = vec4((mvp * vec3(aVertexPosition + aInstancePosition, 1.0)).xy, 0.0, 1.0);
}`;

const FRAGMENT_PROGRAM = `#version 300 es

precision mediump float;

const float SQRT3 = 1.73205080757;
const float HALF_SQRT3 = 0.5 * SQRT3;
const float sharpness = 1.0;

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
flat in uint borders;
flat in vec3 primaryColor;
flat in vec3 secondaryColor;
out vec4 fragColor;

uniform float borderSize;
uniform float shadowSize;
uniform float shadowStrength;
uniform float bgOpacity;

float getFogValue(uint data) {
  vec2 p = point;
  float v = 0.0;
  for (int i = 0; i < 6; ++i) {
    if ((data & (1u << i)) != 0u) {
      v = max(v, -dot(p, N[i]));
    }
  }
  return clamp(1.0 - 2.0 * v, 0.0, 1.0);
}

void main() {
  if (borders == 0u) {
    discard;
  }

  float value = 1.0 - getFogValue(borders >> 1);
  float borderThreshold = 1.0 - borderSize;
  vec3 color = primaryColor;
  if (value > borderThreshold) {
    if (value - borderThreshold > borderSize / 2.0) {
      color = secondaryColor;
    }
    value = 1.0;
  } else {
    value = smoothstep(0.0, borderThreshold, value);
    value = (value - (1.0 - shadowSize)) * shadowStrength;
  }

  value = max(bgOpacity, value);
  fragColor = vec4(color * value, value);
}`;

export class PoliticsDrawer extends HexDrawer<TileOwnershipChanneled> {
  borders = new Uint32Array(0);
  primaryColors = new Float32Array(0);
  secondaryColors = new Float32Array(0);

  isBuilt = false;
  lastScale = camera.transform.scale;

  constructor(container: Container) {
    super(container);

    bridge.player.tracked$.subscribe(() => this.build());

    bridge.game.start$.subscribe(() => {
      this.build();
    });

    bridge.tiles.ownership$.subscribe((tiles) => {
      this.updateTiles(tiles);
    });

    camera.transform$.subscribe(() => {
      if (!this.shader) {
        return;
      }

      const scale = camera.transform.scale;

      const backgroundOpacity = Math.min(0.3, Math.max(0, (70 - scale) / 150));

      const shadowSize = Math.max(0.2, Math.min(1.0, (150 - scale) / 150));
      const borderSize = Math.max(0.08, Math.min(0.5, (140 - scale) / 400));

      const uniforms = this.shader.resources["uniforms"].uniforms;
      uniforms.bgOpacity = backgroundOpacity;
      uniforms.shadowSize = shadowSize;
      uniforms.borderSize = borderSize;
    });

    mapUi.destroyed$.subscribe(() => this.clear());

    mapUi.politicsEnabled$.subscribe((enabled) => {
      this.container.visible = enabled;
    });
  }

  private async build() {
    this.isBuilt = false;
    const tiles = await bridge.tiles.getOwnership();
    this.setTiles(tiles);
    this.isBuilt = true;
  }

  private updateTiles(tiles: TileOwnershipChanneled[]) {
    if (!this.isBuilt) {
      return;
    }
    for (const tile of tiles) {
      const index = this.tilesIndexMap.get(tile.id)!;
      this.setTileAttributes(tile, index);
    }
    this.updateBuffers_();
  }

  override getGeometryAttributes(): AttributeOptions {
    return {
      aBorders: {
        buffer: this.borders,
        format: "uint32",
        instance: true,
      },
      aPrimaryColor: {
        buffer: this.primaryColors,
        format: "float32x3",
        instance: true,
      },
      aSecondaryColor: {
        buffer: this.secondaryColors,
        format: "float32x3",
        instance: true,
      },
    };
  }

  override setTileAttributes(tile: TileOwnershipChanneled, index: number) {
    if (!tile.colors) {
      this.borders[index] = 0;
      return;
    }

    this.borders[index] = 1 + (tile.borders << 1);

    const primary = hexColorToArray(tile.colors.primary);
    const secondary = hexColorToArray(tile.colors.secondary);
    this.primaryColors[3 * index] = primary[0];
    this.primaryColors[3 * index + 1] = primary[1];
    this.primaryColors[3 * index + 2] = primary[2];
    this.secondaryColors[3 * index] = secondary[0];
    this.secondaryColors[3 * index + 1] = secondary[1];
    this.secondaryColors[3 * index + 2] = secondary[2];
  }

  override buildShader(): Shader {
    return Shader.from({
      gl: { fragment: FRAGMENT_PROGRAM, vertex: VERTEX_PROGRAM },
      resources: {
        uniforms: {
          borderSize: { value: 0.08, type: "f32" },
          shadowSize: {
            value: 0.5,
            type: "f32",
          },
          shadowStrength: {
            value: 1,
            type: "f32",
          },
          bgOpacity: {
            value: 0.1,
            type: "f32",
          },
        },
      },
    });
  }

  override updateBuffers(): void {
    super.updateBuffers();
    this.updateBuffers_();
  }

  private updateBuffers_() {
    this.geometry?.getAttribute("aBorders").buffer.update();
    this.geometry?.getAttribute("aPrimaryColor").buffer.update();
    this.geometry?.getAttribute("aSecondaryColor").buffer.update();
  }

  override initializeBuffers(maxInstances: number) {
    super.initializeBuffers(maxInstances);
    this.borders = new Uint32Array(maxInstances);
    this.primaryColors = new Float32Array(maxInstances * 3);
    this.secondaryColors = new Float32Array(maxInstances * 3);
  }
}
