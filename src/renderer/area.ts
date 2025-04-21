import {
  AttributeOptions,
  Container,
  Shader,
  ShaderFromResources,
} from "pixi.js";

import { TilesCoordsWithNeighbours } from "@/core/serialization/channel";
import { HexDrawer } from "./hexDrawer";
import { hexColorToArray } from "./utils";

export interface AreaPrograms {
  background: ShaderFromResources;
  border: ShaderFromResources;
}

export interface AreaOptions {
  color: string;
  borderSize: number;
  shadowSize: number;
  shadowStrength: number;
  backgroundOpacity: number;
  visibleOnWater: boolean;
  container: Container;
  programs?: AreaPrograms;
}

const VERTEX_PROGRAM = `#version 300 es

precision mediump float;

in vec2 aVertexPosition;
in vec2 aInstancePosition;
in uint aBorders;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

out vec2 point;
out vec2 uv;
flat out uint borders;

void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  point = aVertexPosition - vec2(0.5, 0.5);
  uv = aVertexPosition + aInstancePosition;
  borders = aBorders;
  gl_Position = vec4((mvp * vec3(aVertexPosition + aInstancePosition, 1.0)).xy, 0.0, 1.0);
}`;

const FRAGMENT_PROGRAM = `#version 300 es

precision mediump float;

const float SQRT3 = 1.73205080757;
const float HALF_SQRT3 = 0.5 * SQRT3;

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
out vec4 fragColor;

uniform vec4 color;
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
  float value = 1.0 - getFogValue(borders);
  float borderThreshold = 1.0 - borderSize;
  if (value > borderThreshold) {
    value = 1.0;
  } else {
    value = smoothstep(0.0, borderThreshold, value);
    value = (value - (1.0 - shadowSize)) * shadowStrength;
  }

  fragColor = color * max(bgOpacity, value);
}`;

export class Area extends HexDrawer<TilesCoordsWithNeighbours> {
  borders = new Uint32Array(0);

  vec4Color: ReturnType<typeof hexColorToArray>;

  constructor(public options: AreaOptions) {
    super(options.container);

    this.vec4Color = hexColorToArray(options.color);
  }

  override getGeometryAttributes(): AttributeOptions {
    return {
      aBorders: {
        buffer: this.borders,
        format: "uint32",
        instance: true,
      },
    };
  }

  override setTileAttributes(tile: TilesCoordsWithNeighbours, index: number) {
    this.borders[index] = tile.fullNeighbours.reduce<number>((acc, n, i) => {
      if (n == null || !this.tilesMap.has(n)) {
        return acc | (1 << i);
      }
      return acc;
    }, 0);
  }

  override buildShader(): Shader {
    return Shader.from({
      gl: { fragment: FRAGMENT_PROGRAM, vertex: VERTEX_PROGRAM },
      resources: {
        uniforms: {
          color: { value: this.vec4Color, type: "vec4<f32>" },
          borderSize: { value: this.options.borderSize, type: "f32" },
          shadowSize: {
            value: this.options.shadowSize,
            type: "f32",
          },
          shadowStrength: {
            value: this.options.shadowStrength,
            type: "f32",
          },
          bgOpacity: {
            value: this.options.backgroundOpacity,
            type: "f32",
          },
        },
      },
    });
  }

  override initializeBuffers(maxInstances: number) {
    super.initializeBuffers(maxInstances);
    this.borders = new Uint32Array(maxInstances);
  }

  override updateBuffers(): void {
    super.updateBuffers();
    this.geometry?.getAttribute("aBorders").buffer.update();
  }
}
