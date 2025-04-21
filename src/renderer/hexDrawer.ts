import { TileCoords } from "@/core/serialization/channel";
import { AttributeOptions, Container, Geometry, Mesh, Shader } from "pixi.js";
import { TILE_ROW_OFFSET } from "./constants";
import { HEX } from "./hexGeometry";
import { bridge } from "@/bridge";

const VERTEX_PROGRAM = `#version 300 es

precision mediump float;

in vec2 aVertexPosition;
in vec2 aDistanceToCenter;
in vec2 aInstancePosition;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

out vec2 vDistanceToCenter;

void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  vDistanceToCenter = aDistanceToCenter;
  gl_Position = vec4((mvp * vec3(aVertexPosition + aInstancePosition, 1.0)).xy, 0.0, 1.0);
}`;

const FRAGMENT_PROGRAM = `#version 300 es

precision mediump float;

in vec2 vDistanceToCenter;

out vec4 fragColor;

void main() {
  fragColor = vec4(1.0, 1.0, 1.0, 1.0);
}`;

export class HexDrawer<T extends TileCoords> {
  instancePositions: Float32Array;

  tilesMap = new Map<number, T>();
  tilesIndexMap = new Map<number, number>();

  geometry: Geometry | null = null;
  mesh: Mesh<Geometry, Shader> | null = null;
  shader: Shader | null = null;

  constructor(public container: Container) {
    this.instancePositions = new Float32Array(0);

    bridge.game.start$.subscribe((gameStartInfo) => {
      this.clear();
      this.buildMesh(
        gameStartInfo.gameInfo.mapHeight * gameStartInfo.gameInfo.mapWidth,
      );
    });
  }

  buildMesh(maxInstances: number) {
    this.mesh?.destroy();
    this.geometry?.destroy();

    this.initializeBuffers(maxInstances);

    if (!this.shader) {
      this.shader = this.buildShader();
    }

    this.geometry = this.buildGeometry();
    this.mesh = new Mesh({ geometry: this.geometry, shader: this.shader });
    this.container.addChild(this.mesh);
  }

  clear() {
    this.tilesMap.clear();
    this.tilesIndexMap.clear();
    if (this.geometry && this.mesh) {
      this.mesh.visible = false;
      this.geometry.instanceCount = 0;
    }
  }

  setTiles(tiles: T[]) {
    this.clear();
    this.addTiles(tiles);
  }

  addTiles(tiles: T[]) {
    if (!this.geometry) {
      return;
    }

    let index = this.tilesMap.size;

    for (const tile of tiles) {
      this.tilesMap.set(tile.id, tile);
    }

    for (const tile of tiles) {
      this.tilesIndexMap.set(tile.id, index);
      const x = tile.x + (tile.y % 2 ? 0.5 : 0);
      const y = tile.y * TILE_ROW_OFFSET;
      this.instancePositions[index * 2] = x;
      this.instancePositions[index * 2 + 1] = y;
      this.setTileAttributes(tile, index);
      index++;
    }

    this.updateBuffers();
    this.geometry.instanceCount = this.tilesMap.size;
    this.mesh!.visible = this.geometry.instanceCount > 0;
  }

  buildGeometry() {
    return new Geometry({
      attributes: {
        aVertexPosition: { buffer: HEX.vertices, format: "float32x2" },
        aDistanceToCenter: { buffer: HEX.centerDistance, format: "float32x2" },
        aInstancePosition: {
          buffer: this.instancePositions,
          format: "float32x2",
          instance: true,
        },
        ...this.getGeometryAttributes(),
      },
      instanceCount: 0,
      indexBuffer: HEX.indexes,
    });
  }

  buildShader(): Shader {
    return Shader.from({
      gl: { fragment: FRAGMENT_PROGRAM, vertex: VERTEX_PROGRAM },
    });
  }

  setTileAttributes(_: T, __: number): void {}

  getGeometryAttributes(): AttributeOptions {
    return {};
  }

  updateBuffers() {
    this.geometry?.getAttribute("aInstancePosition").buffer.update();
  }

  initializeBuffers(maxInstances: number) {
    this.instancePositions = new Float32Array(maxInstances * 2);
  }
}
