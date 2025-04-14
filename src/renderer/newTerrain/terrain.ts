import { TileChanneled } from "@/core/serialization/channel";
import { Container, Geometry, Mesh, Shader } from "pixi.js";
import { getAssets } from "../assets";
import { Climate, SeaLevel } from "@/shared";
import * as terrainData from "@/assets/atlas-terrain.json";

// prettier-ignore
const TRIANGLES: number[] = [
  0.5, 0.5,
  0, 0.25,
  0.5, 0,
  1, 0.25,
  1, 0.75,
  0.5, 1,
  0, 0.75,
];

// prettier-ignore
const INDEXES: number[] = [
  0, 1, 2,
  0, 2, 3,
  0, 3, 4,
  0, 4, 5,
  0, 5, 6,
  0, 6, 1,
];

// prettier-ignore
const DISTANCE_TO_CENTER: number[] = [
  0, 0,
  1, 1,
  1, 1,
  1, 1,
  1, 1,
  1, 1,
  1, 1,
]

type TerrainTextureName = keyof typeof terrainData.frames;

const terrainKeys = Object.keys(terrainData.frames) as TerrainTextureName[];

const terrainNameToId: Record<TerrainTextureName, number> = {} as any;
for (let i = 0; i < terrainKeys.length; i++) {
  terrainNameToId[terrainKeys[i]] = i;
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
in vec2 aDistanceToCenter;
in vec2 aInstancePosition;
in uint aInstanceTexture;
in uint aInstanceAdjancentTextures;
in uint aCoast;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

out vec2 vTextureCoord;
out vec2 vDistanceToCenter;
out vec2 uv;
flat out uint vInstanceTexture;
flat out uint vInstanceAdjancentTextures;
flat out uint vCoast;

void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  vTextureCoord = aVertexPosition + aInstancePosition;
  uv = aVertexPosition;
  vDistanceToCenter = aDistanceToCenter;
  vInstanceTexture = aInstanceTexture;
  vCoast = aCoast;
  vInstanceAdjancentTextures = aInstanceAdjancentTextures;
  gl_Position = vec4((mvp * vec3(aVertexPosition + aInstancePosition, 1.0)).xy, 0.0, 1.0);
}`;

const FRAGMENT_PROGRAM = `#version 300 es

precision mediump float;

#define HASHSCALE1 443.8975
#define PI 3.14159265359
#define SQRT3 1.7320508

in vec2 vTextureCoord;
in vec2 uv;
in vec2 vDistanceToCenter;
flat in uint vInstanceTexture;
flat in uint vInstanceAdjancentTextures;
flat in uint vCoast;

out vec4 fragColor;

uniform sampler2D atlas;
uniform sampler2D noise;

vec4[] uvOffsets = vec4[](
  ${buildUvOffsets()}
);

float rand(vec2 p) {
	vec3 p3  = fract(vec3(p.xyx) * HASHSCALE1);
	p3 += dot(p3, p3.yzx + 19.19);
	return fract((p3.x + p3.y) * p3.z);
}

float noiseFn(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);

	float res = mix(
		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
	//return res*res;
    return res;
}

float sum( vec3 v ) {
  return v.x+v.y+v.z;
}

vec2 tileUV(vec2 uv, vec4 offset) {
  return offset.xy + fract(uv) * offset.zw;
}

float sampleNoise(vec2 uvm, float scale) {
  return texture( noise, uv * scale).x;
}

// https://iquilezles.org/articles/texturerepetition/
vec4 textureNoTile(sampler2D samp, vec2 uv, vec4 offset) {
    // sample variation pattern
    // float k = sampleNoise(uv, 0.01); // cheap (cache friendly) lookup
    float k = noiseFn( uv * 1.0 );

    // compute index
    float index = k*8.0;
    float i = floor( index );
    float f = fract( index );

    // offsets for the different virtual patterns
    vec2 offa = sin(vec2(3.0,7.0)*(i+0.0)); // can replace with any other hash
    vec2 offb = sin(vec2(3.0,7.0)*(i+1.0)); // can replace with any other hash

    // compute derivatives for mip-mapping
    vec2 dx = dFdx(uv);
    vec2 dy = dFdy(uv);

    // sample the two closest virtual patterns
    vec3 cola = textureGrad( samp, tileUV(uv + offa, offset), dx, dy ).xyz;
    vec3 colb = textureGrad( samp, tileUV(uv + offb, offset), dx, dy ).xyz;

    // interpolate between the two virtual patterns
    return vec4(mix( cola, colb, smoothstep(0.2,0.8,f-0.1*sum(cola-colb))), 1.0);
}

vec4 sampleTexture(uint textureId, vec2 uv) {
  vec4 offset = uvOffsets[textureId];
  // uv = fract(uv);
  // return texture(atlas, offset.xy + uv * offset.zw);
  return textureNoTile(atlas, uv, offset);
}

void main() {
  float distanceToEdge = length(vDistanceToCenter);
  float distanceToEdge2 = length(uv - vec2(0.5, 0.5));
  vec4 base = sampleTexture(vInstanceTexture, vTextureCoord);

  uint texMask = vInstanceAdjancentTextures;

  uint t0Id = texMask >> 25;
  texMask -= t0Id << 25;

  uint t1Id = texMask >> 20;
  texMask -= t1Id << 20;

  uint t2Id = texMask >> 15;
  texMask -= t2Id << 15;

  uint t3Id = texMask >> 10;
  texMask -= t3Id << 10;

  uint t4Id = texMask >> 5;
  uint t5Id = texMask - (t4Id << 5);

  float angle = atan(uv.y-0.5, uv.x-0.5);
  if (angle < 0.0) {
    angle += 2.0 * PI;
  }

  uint texAId = vInstanceTexture;
  uint texBId = vInstanceTexture;
  float a;

  float angle2 = angle + PI / 6.0 + PI * 2.0 / 3.0;
  if (angle2 > 2.0 * PI) {
    angle2 -= 2.0 * PI;
  }
  uint edge = uint(floor(angle2 / (PI / 3.0)));

  uint sector = 0u;
  if (angle < PI / 3.0) {
    sector = 0u;
    texAId = t2Id;
    texBId = t3Id;
    a = angle / (PI / 3.0);
  } else if (angle < 2.1 * PI / 3.0) {
    sector = 1u;
    texAId = t3Id;
    texBId = t4Id;
    a = (angle - PI / 3.0) / (PI / 3.0);
  } else if (angle < 3.0 * PI / 3.0) {
    sector = 2u;
    texAId = t4Id;
    texBId = t5Id;
    a = (angle - 2.1 * PI / 3.0) / (PI / 3.0);
  } else if (angle < 3.9 * PI / 3.0) {
    sector = 3u;
    texAId = t5Id;
    texBId = t0Id;
    a = (angle - 3.0 * PI / 3.0) / (PI / 3.0);
  } else if (angle < 5.0 * PI / 3.0) {
    sector = 4u;
    texAId = t0Id;
    texBId = t1Id;
    a = (angle - 3.9 * PI / 3.0) / (PI / 3.0);
  } else if (angle < 6.0 * PI / 3.0) {
    sector = 5u;
    texAId = t1Id;
    texBId = t2Id;
    a = (angle - 5.0 * PI / 3.0) / (PI / 3.0);
  }

  vec4 texA = sampleTexture(texAId, vTextureCoord);
  vec4 texB = sampleTexture(texBId, vTextureCoord);

  float mixSize = 0.2;
  float d = distanceToEdge / 2.6;
  float mixValue = d;

  vec4 edgeColor = mix(texA, texB, a);

  fragColor = mix(base, edgeColor, mixValue);

  const float BLEND = 0.25;
  bool needCoast = ((vCoast & (1u<<edge)) != 0u);

  float coastBand = 0.0;

  if (needCoast) {
    coastBand = distanceToEdge2;
    // + (sampleNoise(vTextureCoord, 0.02) - 0.5) * 0.2;

    if (coastBand < 0.4) {
      coastBand = 0.0;
    }
  }

  fragColor = mix(fragColor, vec4(1.0,1.0,1.0, 1.0), coastBand);
}`;

console.log(FRAGMENT_PROGRAM);

export class TerrainDrawer {
  shader: Shader;

  constructor(public container: Container) {
    const terrain = getAssets().terrainSpritesheet;

    this.shader = Shader.from({
      gl: { fragment: FRAGMENT_PROGRAM, vertex: VERTEX_PROGRAM },
      resources: {
        atlas: terrain.textureSource,
        noise: getAssets().textures.whitenoise.source,
      },
    });
  }

  async build(tiles: TileChanneled[]) {
    const instancePositions = new Float32Array(tiles.length * 2);
    const instanceTextures = new Uint32Array(tiles.length);
    const instanceAdjacentTextures = new Uint32Array(tiles.length);
    const instanceCoast = new Uint32Array(tiles.length);

    const geometry = new Geometry({
      attributes: {
        aVertexPosition: { buffer: TRIANGLES, format: "float32x2" },
        aDistanceToCenter: { buffer: DISTANCE_TO_CENTER, format: "float32x2" },
        aInstancePosition: {
          buffer: instancePositions,
          format: "float32x2",
          instance: true,
        },
        aInstanceTexture: {
          buffer: instanceTextures,
          format: "uint32",
          instance: true,
        },
        aInstanceAdjancentTextures: {
          buffer: instanceAdjacentTextures,
          format: "uint32",
          instance: true,
        },
        aCoast: {
          buffer: instanceCoast,
          format: "uint32",
          instance: true,
        },
      },
      instanceCount: tiles.length,
      indexBuffer: INDEXES,
    });

    const tilesMap = new Map<number, TileChanneled>();
    for (const tile of tiles) {
      tilesMap.set(tile.id, tile);
    }

    let idx = 0;
    for (const tile of tiles) {
      const x = tile.x + (tile.y % 2 ? 0.5 : 0);
      const y = tile.y * 0.75;
      instancePositions[idx * 2] = x;
      instancePositions[idx * 2 + 1] = y;
      instanceTextures[idx] = this.getTextureIndex(tile);
      instanceAdjacentTextures[idx] = this.getAdjacentsTextureIndexes(
        tile,
        tilesMap,
      );
      instanceCoast[idx] = this.getCoast(tile, tilesMap);
      idx++;
    }

    const mesh = new Mesh({ geometry, shader: this.shader });
    this.container.addChild(mesh);
  }

  getTextureIndex(tile: TileChanneled): number {
    if (tile.seaLevel === SeaLevel.shallow) {
      return terrainNameToId["water.png"];
    }
    if (tile.seaLevel === SeaLevel.deep) {
      return terrainNameToId["deepWater.png"];
    }
    if (tile.climate === Climate.tropical) {
      return terrainNameToId["tropical.png"];
    }
    if (tile.climate === Climate.savanna) {
      return terrainNameToId["savanna.png"];
    }
    if (tile.climate === Climate.desert) {
      return terrainNameToId["desert.png"];
    }
    if (tile.climate === Climate.arctic) {
      return terrainNameToId["arctic.png"];
    }
    if (tile.climate === Climate.temperate) {
      return terrainNameToId["temperate.png"];
    }
    if (tile.climate === Climate.tundra) {
      return terrainNameToId["tundra.png"];
    }
    return terrainNameToId["water.png"];
  }

  getAdjacentsTextureIndexes(
    tile: TileChanneled,
    tilesMap: Map<number, TileChanneled>,
  ): number {
    const textures = tile.fullNeighbours.map((t) => {
      let neighbour = t ? tilesMap.get(t)! : tile;
      // if (
      //   tile.seaLevel === SeaLevel.none &&
      //   neighbour.seaLevel !== SeaLevel.none
      // ) {
      //   neighbour = tile;
      // }
      // if (
      //   tile.seaLevel !== SeaLevel.none &&
      //   neighbour.seaLevel === SeaLevel.none
      // ) {
      //   neighbour = tile;
      // }

      return this.getTextureIndex(neighbour);
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
    const coast = tile.fullNeighbours.map((t) => {
      let neighbour = t ? tilesMap.get(t)! : tile;
      if (
        tile.seaLevel === SeaLevel.none &&
        neighbour.seaLevel !== SeaLevel.none
      ) {
        return 1;
      }
      if (
        tile.seaLevel !== SeaLevel.none &&
        neighbour.seaLevel === SeaLevel.none
      ) {
        return 1;
      }

      return 0;
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
}
