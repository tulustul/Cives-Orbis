import { TileCoords } from "@/core/serialization/channel";
import {
  AttributeOptions,
  Container,
  Geometry,
  Mesh,
  Shader,
  Sprite,
} from "pixi.js";
import { getAssets } from "./assets";
import { drawTileSprite } from "./utils";
import { HEX } from "./hexGeometry";
import { TILE_ROW_OFFSET } from "./constants";

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

export class HexDrawer {
  private renderedTiles = new Map<number, Sprite>();

  private texture = getAssets().tilesSpritesheet.textures["hexMask.png"];

  constructor(private container: Container) {}

  clear() {
    for (const sprite of this.renderedTiles.values()) {
      sprite.destroy();
    }
    this.renderedTiles.clear();
  }

  public async setTiles(tiles: TileCoords[]) {
    const tilesSet = new Set(tiles.map((t) => t.id));

    for (const tileId of this.renderedTiles.keys()) {
      if (!tilesSet.has(tileId)) {
        this.destroyTile(tileId);
      }
    }
    for (const tile of tiles) {
      if (!this.renderedTiles.has(tile.id)) {
        this.renderTile(tile);
      }
    }
  }

  public addTiles(tiles: TileCoords[]) {
    for (const tile of tiles) {
      if (!this.renderedTiles.has(tile.id)) {
        this.renderTile(tile);
      }
    }
  }

  public renderTile(tile: TileCoords) {
    const sprite = drawTileSprite(tile, this.texture);
    this.container.addChild(sprite);
    this.renderedTiles.set(tile.id, sprite);
  }

  public destroyTile(tileId: number) {
    const sprite = this.renderedTiles.get(tileId);
    this.renderedTiles.delete(tileId);
    if (sprite) {
      sprite.destroy();
    }
  }
}

export class HexDrawerNew<T extends TileCoords> {
  instancePositions: Float32Array;

  tilesMap = new Map<number, T>();
  tilesIndexMap = new Map<number, number>();

  geometry: Geometry | null = null;
  mesh: Mesh<Geometry, Shader> | null = null;

  public shader = this.buildShader();

  constructor(public container: Container, public maxInstances: number) {
    this.instancePositions = new Float32Array(maxInstances * 2);
  }

  buildMeshIfNeeded() {
    if (this.geometry) {
      return;
    }
    this.geometry = this.buildGeometry();
    this.mesh = new Mesh({ geometry: this.geometry, shader: this.shader });
    this.container.addChild(this.mesh);
  }

  clear() {
    this.tilesMap.clear();
    this.tilesIndexMap.clear();
  }

  setTiles(tiles: T[]) {
    this.clear();
    this.addTiles(tiles);
  }

  addTiles(tiles: T[]) {
    this.buildMeshIfNeeded();
    if (!this.geometry) {
      throw new Error("Geometry is not built");
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

  setTileAttributes(tile: T, index: number): void {}

  getGeometryAttributes(): AttributeOptions {
    return {};
  }

  updateBuffers() {
    if (!this.geometry) {
      throw new Error("Geometry is not built");
    }
    this.geometry.attributes.aInstancePosition.buffer.update();
  }
}
