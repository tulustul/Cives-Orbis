import * as terrainData from "@/assets/atlas-tiles.json";
import { bridge } from "@/bridge";
import { TileChanneled } from "@/core/serialization/channel";
import { LandForm, SeaLevel } from "@/shared";
import { mapUi } from "@/ui/mapUi";
import { measureTime } from "@/utils";
import { AttributeOptions, Container, Shader } from "pixi.js";
import { getAssets } from "./assets";
import { HexDrawer } from "./hexDrawer";
import { HEX } from "./hexGeometry";
import {
  HILL_BY_CLIMATE,
  TILE_BY_CLIMATE,
  TILE_BY_SEA_LEVEL,
  TileTextureName,
} from "./tileTextures";

const terrainKeys = Object.keys(terrainData.frames) as TileTextureName[];

const tileNameToId: Record<TileTextureName | "", number> = { "": null } as any;
for (let i = 0; i < terrainKeys.length; i++) {
  tileNameToId[terrainKeys[i]] = i;
}

function buildUvOffsets() {
  const offsets = [];
  for (const key of terrainKeys) {
    const frame = terrainData.frames[key].frame;
    const x = frame.x / terrainData.meta.size.w;
    const y = frame.y / terrainData.meta.size.h;
    const w = frame.w / terrainData.meta.size.w;
    const h = frame.h / terrainData.meta.size.h;
    offsets.push(`vec4(${x}, ${y}, ${w}, ${h}),`);
  }
  const result = offsets.join("\n");
  return result.substring(0, result.length - 1);
}

const VERTEX_PROGRAM = `#version 300 es

precision mediump float;

in vec2 aVertexPosition;
in vec2 aCenterDistance;
in vec2 aInstancePosition;
in uint aInstanceTexture;
in uint aInstanceAdjancentTextures;
in uint aInstanceDecorTex;
in uint aCoast;
in uint aForest;
in uint aRoad;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

out vec2 uv;
out vec2 point;
out vec2 centerDistance;
flat out uint texId;
flat out uint adjacentTexId;
flat out uint decorTex;
flat out uint coast;
flat out uint forest;
flat out uint road;
flat out vec2 coords;

void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  uv = aVertexPosition + aInstancePosition;
  point = aVertexPosition - vec2(0.5, 0.5);
  texId = aInstanceTexture;
  decorTex = aInstanceDecorTex;
  centerDistance = aCenterDistance;
  coast = aCoast;
  forest = aForest;
  road = aRoad;
  adjacentTexId = aInstanceAdjancentTextures;
  coords = aInstancePosition;
  gl_Position = vec4((mvp * vec3(aVertexPosition + aInstancePosition, 1.0)).xy, 0.0, 1.0);
}`;

const FRAGMENT_PROGRAM = `#version 300 es
precision mediump float;

#define HASHSCALE1 443.8975

const float PI = 3.14159265359;
const float SQRT3 = 1.73205080757;
const float HALF_SQRT3 = 0.5 * SQRT3;
const float ROW_STEP = 0.75 * (2.0 / SQRT3);
const float COL_SHIFT = 0.5;
const float HALF_TILE_HEIGHT = 1.0 / sqrt(3.0);

in vec2 uv;
in vec2 point;
in vec2 centerDistance;
flat in uint texId;
flat in uint adjacentTexId;
flat in uint coast;
flat in uint decorTex;
flat in uint forest;
flat in uint road;
flat in vec2 coords;

out vec4 fragColor;

uniform sampler2D atlas;
uniform sampler2D whitenoise;
uniform sampler2D noise;

uniform float time;
uniform bool gridEnabled;

const vec2 N[6] = vec2[6](
  vec2(  0.5,  HALF_SQRT3 ),
  vec2( -0.5,  HALF_SQRT3 ),
  vec2( -1.0,          0.0 ),
  vec2( -0.5, -HALF_SQRT3 ),
  vec2(  0.5, -HALF_SQRT3 ),
  vec2(  1.0,          0.0 )
);

const vec2 EDGE_MID_POINTS[6] = vec2[6](
  vec2( -0.25, -SQRT3 / 4.0 ),
  vec2( 0.25, -SQRT3 / 4.0 ),
  vec2( 0.5, 0.0 ),
  vec2( 0.25, SQRT3 / 4.0 ),
  vec2( -0.25, SQRT3 / 4.0 ),
  vec2( -0.5, 0.0 )
);

vec4[] uvOffsets = vec4[](
  ${buildUvOffsets()}
);

float sum( vec3 v ) {
  return v.x+v.y+v.z;
}

vec2 tileUV(vec2 point, vec4 offset) {
  return offset.xy + fract(point) * offset.zw;
}

float sampleWhitenoise(vec2 p, float scale) {
  return texture( whitenoise, p * scale).x;
}

float sampleNoise(vec2 point, float scale) {
  return texture( noise, point * scale).x;
}

// https://iquilezles.org/articles/texturerepetition/
vec4 textureNoTile(sampler2D samp, vec2 point, vec4 offset) {
    float k = sampleWhitenoise(point, 0.006);

    // compute index
    float index = k*8.0;
    float i = floor( index );
    float f = fract( index );

    // offsets for the different virtual patterns
    vec2 offa = sin(vec2(3.0,7.0)*(i+0.0)); // can replace with any other hash
    vec2 offb = sin(vec2(3.0,7.0)*(i+1.0)); // can replace with any other hash

    // compute derivatives for mip-mapping
    vec2 dx = dFdx(point);
    vec2 dy = dFdy(point);

    // sample the two closest virtual patterns
    vec3 cola = textureGrad( samp, tileUV(point + offa, offset), dx, dy ).xyz;
    vec3 colb = textureGrad( samp, tileUV(point + offb, offset), dx, dy ).xyz;

    // interpolate between the two virtual patterns
    return vec4(mix( cola, colb, smoothstep(0.2,0.8,f-0.1*sum(cola-colb))), 1.0);
}

vec4 sampleAtlas(uint textureId, vec2 point) {
  vec4 offset = uvOffsets[textureId];
  if (textureId == ${tileNameToId["water.png"]}u || textureId == ${
  tileNameToId["deepWater.png"]
}u) {
    vec2 wave = vec2(
      cos(time * .07 + point.y * 4.0) * .01 + sin(time * .015 + point.y * 5.0) * .017,
      cos(time * .05 + point.x * 5.0) * .013 + sin(time * .02 + point.x * 5.0) * .021
    );
    point += wave + time * 0.0005;
  }
  return textureNoTile(atlas, point, offset);
  // return texture(atlas, tileUV(point, offset));
}

vec4 sampleSprite(vec4 originalColor, uint textureId, vec2 p) {
  vec4 offset = uvOffsets[textureId];
  vec2 realUv = (offset.xy + vec2(offset.z / 2.0, offset.w / 2.0) + p * offset.z);
  vec2 clampedUv = clamp(realUv, offset.xy, offset.xy + offset.zw);
  if (realUv.x == clampedUv.x && realUv.y == clampedUv.y) {
    return texture(atlas, realUv);
  }
  return originalColor;
}

void unpackNeighbours( uint packed, out uint n[6] ) {
  n[0] =  packed >> 25;
  n[1] = (packed >> 20) & 31u;
  n[2] = (packed >> 15) & 31u;
  n[3] = (packed >> 10) & 31u;
  n[4] = (packed >>  5) & 31u;
  n[5] =  packed        & 31u;
}

uint previousEdge( uint edge ) {
  return ( edge + 5u ) % 6u;
}

float getBorder(uint data, vec2 p) {
  float v = 0.0;
  for (int i = 0; i < 6; ++i) {
    if ((data & (1u << i)) != 0u) {
      v = max(v, -dot(p, N[i]));
    }
  }
  return clamp(1.0 - 2.0 * v, 0.0, 1.0);
}

vec4 mixNeighbours(vec4 baseColor, float angle) {
  uint  neigh[6];
  unpackNeighbours( adjacentTexId, neigh );

  uint sector = uint(floor(angle / (2.0 * PI) * 6.0));
  float edgeAlpha = (angle - float(sector) * PI / 3.0) / (PI / 3.0);
  sector = ( sector + 3u ) % 6u;

  vec4 texA = sampleAtlas(neigh[previousEdge(sector)], uv);
  vec4 texB = sampleAtlas(neigh[sector], uv);

  vec4 edgeColor = mix(texA, texB, edgeAlpha);
  return mix(baseColor, edgeColor, length(point));
}

vec4 applyCoast(vec4 color) {
  float coastBand = 1.0 - getBorder(coast, point) * 2.5;
  float coastSize = texId == ${tileNameToId["water.png"]}u ? 0.7 : 0.2;
  coastBand = smoothstep(coastSize, 1.0, coastBand);

  if (coastBand > 0.0) {
    vec4 coastColor = sampleAtlas(${tileNameToId["beach.png"]}u, uv);
    color = mix(color, coastColor, coastBand);
  }

  return color;
}

vec4 applyRiver(vec4 color) {
  float riverBand = 1.0 - getBorder(coast >> 6, point) * 3.5;
  riverBand = smoothstep(0.1, 1.0, riverBand);

  if (riverBand > 0.0) {
    vec4 coastColor = sampleAtlas(${tileNameToId["water.png"]}u, uv);
    color = mix(color, coastColor, riverBand);
  }

  return color;
}

vec4 applyNoise(vec4 color) {
  float noise1 = sampleNoise(uv, 0.02) - 0.5;
  float noise2 = sampleNoise(uv, 0.1) - 0.5;
  color += noise1 * 0.4;
  color += noise2 * 0.2;
  return color;
}

float hash1D(vec2 p) {
    // A simple hash function
    p = fract(p * vec2(5.3983, 5.4427));
    p += dot(p.yx, p.xy + vec2(21.5351, 14.3137));
    return fract(p.x * p.y * 95.4337);
}

// Generates a 2D pseudo-random offset vector within [0,1] range
vec2 hash2D(vec2 p) {
    // Use hash1D twice with different seeds
    return vec2(hash1D(p), hash1D(p + vec2(27.17, 91.43)));
}

vec2 worldToLocal(vec2 p) {
  return (p - coords) - vec2(0.5, 0.5);
}


float getBorder2(uint data, vec2 p) {
  float v = 0.0;
  for (int i = 0; i < 6; ++i) {
    if ((data & (1u << i)) == 0u) {
      v = max(v, -dot(p, N[i]));
    }
  }
  return clamp(v, 0.0, 0.5);
}

float segPointDistance(vec2 A, vec2 B, vec2 P) {
    vec2 AB = B - A;
    float len2 = dot(AB, AB);

    // Degenerate segment → treat AB as a point
    if (len2 == 0.0)
        return length(P - A);

    // Projection parameter, clamped to [0, 1]
    float t = clamp(dot(P - A, AB) / len2, 0.0, 1.0);

    // Closest point on the segment
    vec2 proj = A + AB * t;

    return length(P - proj);
}

float getRoadMask(vec2 p, vec2 uv2) {
  if ((road & (1u << 6)) == 0u) {
    return 1.0;
  }

  float noise1 = (sampleNoise(uv2, 0.15) - 0.5) * 0.35;
  float noise2 = (sampleNoise(uv2+0.3, 0.15) - 0.5) * 0.35;

  float v = 1.0;
  for (int i = 0; i < 6; i++) {
    if ((road & (1u << i)) != 0u) {
      vec2 a = vec2(noise1, noise2);
      vec2 midPoint = EDGE_MID_POINTS[i];
      float d = segPointDistance(a, midPoint, p);
      v = min(v, d);
    }
  }

  return v;
}

vec4 applyForest(vec4 color, float minY, float maxY) {
  if ((forest & (1u << 6)) == 0u) {
    return color;
  }

  float gridSize = 30.0;
  float treeRadius = 0.09;
  float tileHeight =  2.0 / sqrt(3.0);float tileRowOffset = tileHeight * 0.75;
  float rowStep      = 0.75 * (2.0 / SQRT3);
  float colShiftHalf = 0.5;

  vec2 baseGridWorld = floor(uv * gridSize);
  float totalP = 0.0;

  vec2 centerDistanceGrid = floor(centerDistance * gridSize) / (gridSize);

  uint borders = forest & ~coast & ~(coast >> 6);
  float v0 = getBorder2(borders, point);

  vec2 pointGrid = floor(point*gridSize) / gridSize;
  if (int(floor(coords.y)) % 2 == 1) {
    pointGrid.x -= (1.0 / gridSize) / 2.0;
  }

  int overlaps = 2;

  for (int dy = -overlaps; dy <= overlaps; ++dy) {
    for (int dx = -overlaps; dx <= overlaps; ++dx) {
      vec2 gridWorld = baseGridWorld + vec2(dx, dy);
      vec2 gridLocal = worldToLocal(gridWorld / gridSize);

      if (gridLocal.y < minY || gridLocal.y > maxY) {
        continue;
      }

      float v = getBorder2(borders, gridLocal);

      float roadMask = smoothstep(0.32, 0.5, 0.5 - getRoadMask(gridLocal, gridWorld));
      v = max(v, roadMask);

      float probability = pow(0.4 - v, 1.0);

      totalP += probability;

      float treeExistenceValue = hash1D(gridWorld + 0.5);

      if (treeExistenceValue < probability) {
        vec2 randomOffset = hash2D(gridWorld * 100.0) * 1.0;
        vec2 treePosWorld = (gridWorld + randomOffset) / gridSize;

        float distToTree = max(abs(uv.x-treePosWorld.x), abs(uv.y-treePosWorld.y));

        float d = length(uv - treePosWorld);

        if (d < treeRadius) {
          vec2 spriteUv = (uv - treePosWorld) / (treeRadius * 2.0) + 0.5;

          if (spriteUv.x >= 0.0 && spriteUv.x <= 1.0 && spriteUv.y >= 0.0 && spriteUv.y <= 1.0) {
            uint textureId = forest >> 7;
            vec4 treeColor = sampleSprite(color, textureId, spriteUv - vec2(0.5, 0.5));
            color = color * (1.0 - treeColor.a) + treeColor;
          }
        }
      }
    }
  }

  // color.r += totalP / pow(float(overlaps) * 2.0 + 1.0, 2.0);
  return color;
}

vec4 applyRoad(vec4 color) {
  float v = getRoadMask(point, uv);

  if (v < 0.03) {
    v = 1.0 - smoothstep(0.0, 0.03, v);
    vec4 roadColor;
    float alpha = 1.0;
    if (v < 0.4) {
      roadColor = vec4(0.0, 0.0, 0.0, 1.0);
      alpha = sqrt(v);
    } else {
      roadColor = vec4(0.509, 0.34, 0.011, 1.0);
    }
    color = mix(color, roadColor, alpha);
  }

  return color;
}

void main() {
  vec4 base = sampleAtlas(texId, uv);

  float angle = atan(point.y, point.x);
  angle = angle < 0.0 ? angle + 2.0 * PI : angle;

  uint edge = uint(floor(angle / (PI / 3.0)));
  edge = (edge + 3u) % 6u;

  bool needCoast = ((coast & (1u << edge)) != 0u);

  fragColor = needCoast ? base : mixNeighbours(base, angle);

  fragColor = applyCoast(fragColor);
  fragColor = applyRiver(fragColor);

  float forestThreshold = 1.0;
  if (decorTex != 0u) {
    forestThreshold = decorTex == ${tileNameToId["mountain.png"]}u ? 0.2 : 0.0;
  }

  fragColor = applyForest(fragColor, -1.0, forestThreshold);

  if (decorTex != 0u) {
    vec4 spriteColor = sampleSprite(fragColor, decorTex, point);
    fragColor = fragColor * (1.0 - spriteColor.a) + spriteColor;
    fragColor = applyForest(fragColor, forestThreshold, 1.0);
  }

  fragColor = applyRoad(fragColor);

  fragColor = applyNoise(fragColor);

  if (gridEnabled) {
    float grid = max(0.0, length(centerDistance) - 1.3) * 1.0;
    fragColor += smoothstep(0.0, 0.4, grid);
  }
}`;

export class TerrainDrawer extends HexDrawer<TileChanneled> {
  instanceTextures = new Uint32Array(0);
  instanceAdjacentTextures = new Uint32Array(0);
  instanceCoast = new Uint32Array(0);
  instanceDecorTex = new Uint32Array(0);
  instanceForest = new Uint32Array(0);
  instanceRoad = new Uint32Array(0);

  isBuilt = false;

  constructor(container: Container) {
    super(container);

    bridge.game.start$.subscribe(() => {
      measureTime("terrain build", () => this.build());
    });

    bridge.tiles.updated$.subscribe((tiles) => {
      if (!this.isBuilt) {
        return;
      }
      const t0 = performance.now();
      for (const tile of tiles) {
        this.updateTile(tile);
      }

      this.updateBuffers_();
      const t1 = performance.now();
      console.log("Call to updateTile took " + (t1 - t0) + " milliseconds.");
    });

    mapUi.gridEnabled$.subscribe((enabled) => {
      if (this.shader) {
        this.shader.resources.uniforms.uniforms.gridEnabled = enabled ? 1 : 0;
      }
    });
  }

  public tick(time: number) {
    if (this.shader) {
      this.shader.resources.uniforms.uniforms.time = time / 50;
    }
  }

  private async build() {
    this.isBuilt = false;
    this.clear();
    const tiles = await bridge.tiles.getAll();
    this.setTiles(tiles);
    this.isBuilt = true;
  }

  updateTile(tile: TileChanneled) {
    this.tilesMap.set(tile.id, tile);
    this.setTileAttributes(tile, this.tilesIndexMap.get(tile.id)!);
    for (const neighbour of tile.fullNeighbours) {
      if (neighbour) {
        this.setTileAttributes(
          this.tilesMap.get(neighbour)!,
          this.tilesIndexMap.get(neighbour)!,
        );
      }
    }
  }

  override buildShader() {
    const terrain = getAssets().tilesSpritesheet;

    return Shader.from({
      gl: { fragment: FRAGMENT_PROGRAM, vertex: VERTEX_PROGRAM },
      resources: {
        atlas: terrain.textureSource,
        noise: getAssets().textures.noise.source,
        whitenoise: getAssets().textures.whitenoise.source,
        uniforms: {
          gridEnabled: { value: mapUi.gridEnabled ? 1 : 0, type: "i32" },
          time: { value: 0, type: "f32" },
        },
      },
    });
  }

  override getGeometryAttributes(): AttributeOptions {
    return {
      aCenterDistance: {
        buffer: HEX.centerDistance,
        format: "float32x2",
      },
      aInstanceTexture: {
        buffer: this.instanceTextures,
        format: "uint32",
        instance: true,
      },
      aInstanceAdjancentTextures: {
        buffer: this.instanceAdjacentTextures,
        format: "uint32",
        instance: true,
      },
      aInstanceDecorTex: {
        buffer: this.instanceDecorTex,
        format: "uint32",
        instance: true,
      },
      aCoast: {
        buffer: this.instanceCoast,
        format: "uint32",
        instance: true,
      },
      aForest: {
        buffer: this.instanceForest,
        format: "uint32",
        instance: true,
      },
      aRoad: {
        buffer: this.instanceRoad,
        format: "uint32",
        instance: true,
      },
    };
  }

  override setTileAttributes(tile: TileChanneled, index: number) {
    this.instanceTextures[index] = this.getTextureIndex(tile);
    this.instanceAdjacentTextures[index] = this.getAdjacentsTextureIndexes(
      tile,
      this.tilesMap,
    );
    const coast = this.getCoast(tile, this.tilesMap);
    const river = this.getRiver(tile);
    this.instanceCoast[index] = coast + (river << 6);
    this.instanceDecorTex[index] = this.getDecorTextureIndex(tile);
    this.instanceForest[index] = this.getForestData(tile);
    this.instanceRoad[index] = tile.roadData;
  }

  getForestData(tile: TileChanneled): number {
    // const textureName =
    //   FOREST_BY_CLIMATE[tile.climate] ?? "tree-tropical-4.png";
    const textureName: TileTextureName = "tree-tropical-4.png";
    return tile.forestData + (tileNameToId[textureName] << 7);
  }

  getDecorTextureIndex(tile: TileChanneled): number {
    // if (tile.landForm === LandForm.mountains) {
    //   return tileNameToId["mountain.png"];
    // }
    if (tile.landForm === LandForm.hills) {
      return tileNameToId[HILL_BY_CLIMATE[tile.climate]];
    }
    return 0;
  }

  getTextureIndex(tile: TileChanneled): number {
    const texIndex = tileNameToId[TILE_BY_SEA_LEVEL[tile.seaLevel]];
    if (texIndex !== null) {
      return texIndex;
    }
    // if (tile.decorTex === LandForm.hills) {
    //   return CLIMATE_HILLS_TO_TEXTURE[tile.climate];
    // }
    // if (tile.decorTex === LandForm.mountains) {
    //   return CLIMATE_MOUNTAINS_TO_TEXTURE[tile.climate];
    // }
    return tileNameToId[TILE_BY_CLIMATE[tile.climate]];
  }

  getAdjacentsTextureIndexes(
    tile: TileChanneled,
    tilesMap: Map<number, TileChanneled>,
  ): number {
    const textures = tile.fullNeighbours.map((n) => {
      const neighbour = (n ? tilesMap.get(n) : null) ?? tile;
      return isLandWaterTransition(tile, neighbour)
        ? this.getTextureIndex(tile)
        : this.getTextureIndex(neighbour);
    });

    return (
      textures[5] +
      (textures[4] << 5) +
      (textures[3] << 10) +
      (textures[2] << 15) +
      (textures[1] << 20) +
      (textures[0] << 25)
    );
  }

  getCoast(tile: TileChanneled, tilesMap: Map<number, TileChanneled>): number {
    const coast = tile.fullNeighbours.map((n) => {
      const neighbour = (n ? tilesMap.get(n) : null) ?? tile;
      return isLandWaterTransition(tile, neighbour) ? 1 : 0;
    });

    return (
      coast[0] +
      (coast[1] << 1) +
      (coast[2] << 2) +
      (coast[3] << 3) +
      (coast[4] << 4) +
      (coast[5] << 5)
    );
  }

  getRiver(tile: TileChanneled): number {
    let river = 0;
    for (const r of tile.riverParts) {
      river += 1 << r;
    }
    return river;
  }

  override initializeBuffers(maxInstances: number) {
    super.initializeBuffers(maxInstances);
    this.instanceTextures = new Uint32Array(maxInstances);
    this.instanceAdjacentTextures = new Uint32Array(maxInstances);
    this.instanceCoast = new Uint32Array(maxInstances);
    this.instanceDecorTex = new Uint32Array(maxInstances);
    this.instanceForest = new Uint32Array(maxInstances);
    this.instanceRoad = new Uint32Array(maxInstances);
  }

  private updateBuffers_(): void {
    this.geometry?.getAttribute("aInstanceTexture").buffer.update();
    this.geometry?.getAttribute("aInstanceAdjancentTextures").buffer.update();
    this.geometry?.getAttribute("aInstanceDecorTex").buffer.update();
    this.geometry?.getAttribute("aCoast").buffer.update();
    this.geometry?.getAttribute("aForest").buffer.update();
    this.geometry?.getAttribute("aRoad").buffer.update();
  }
}

function isLandWaterTransition(tileA: TileChanneled, tileB: TileChanneled) {
  return (
    (tileA.seaLevel === SeaLevel.none && tileB.seaLevel !== SeaLevel.none) ||
    (tileA.seaLevel !== SeaLevel.none && tileB.seaLevel === SeaLevel.none)
  );
}
