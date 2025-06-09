import { TileCoords } from "@/shared";
import { AttributeOptions, Shader } from "pixi.js";
import { HexDrawer } from "./hexDrawer";

const VERTEX_PROGRAM = `#version 300 es

precision mediump float;

in vec2 aVertexPosition;
in vec2 aInstancePosition;
in vec3 aColor;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

out vec2 point;
flat out vec3 color;

void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  point = aVertexPosition - vec2(0.5, 0.5);
  color = aColor;
  gl_Position = vec4((mvp * vec3(aVertexPosition + aInstancePosition, 1.0)).xy, 0.0, 1.0);
}`;

const FRAGMENT_PROGRAM = `#version 300 es

precision mediump float;

flat in vec3 color;
in vec2 point;
out vec4 fragColor;

void main() {
  if (length(point) < 0.35) {
    discard;
  }
  fragColor = vec4(color, color.r);
}`;

export type HeatMapTileData = TileCoords & {
  valueR: number;
  valueG?: number;
  valueB?: number;
};

export class HeatMapDrawer extends HexDrawer<HeatMapTileData> {
  color = new Float32Array(0);

  maxValue = 1;

  override setTiles(tiles: HeatMapTileData[]): void {
    this.maxValue = 1;
    for (const tile of tiles) {
      if (tile.valueR > this.maxValue) {
        this.maxValue = tile.valueR;
      }
      if (tile.valueG && tile.valueG > this.maxValue) {
        this.maxValue = tile.valueG;
      }
      if (tile.valueB && tile.valueB > this.maxValue) {
        this.maxValue = tile.valueB;
      }
    }
    super.setTiles(tiles);
  }

  override getGeometryAttributes(): AttributeOptions {
    return {
      aColor: {
        buffer: this.color,
        format: "float32x3",
        instance: true,
      },
    };
  }

  override setTileAttributes(tile: HeatMapTileData, index: number) {
    this.color[3 * index] = getValue(tile.valueR, this.maxValue);
    this.color[3 * index + 1] = getValue(tile.valueG, this.maxValue);
    this.color[3 * index + 2] = getValue(tile.valueB, this.maxValue);
  }

  override buildShader(): Shader {
    return Shader.from({
      gl: { fragment: FRAGMENT_PROGRAM, vertex: VERTEX_PROGRAM },
    });
  }

  override updateBuffers(): void {
    super.updateBuffers();
    this.geometry?.getAttribute("aColor").buffer.update();
  }

  override initializeBuffers(maxInstances: number) {
    super.initializeBuffers(maxInstances);
    this.color = new Float32Array(maxInstances * 3);
  }
}

function getValue(v: number | undefined | null, maxV: number): number {
  return (v || 0) / maxV;
}
