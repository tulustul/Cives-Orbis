import { TileChanneled } from "@/core/serialization/channel";
import { Container, Geometry, Mesh, Shader } from "pixi.js";
import { getAssets } from "../assets";
import { Climate, SeaLevel } from "@/shared";
import * as terrainData from "@/assets/atlas-terrain.json";
import { TILE_HEIGHT, TILE_ROW_OFFSET } from "../constants";

function buildHex(): number[] {
  const yo = Math.sqrt(3) / 6;
  const my = TILE_HEIGHT / 2;
  // prettier-ignore
  return [
    0.5, 0.5,
    0, 0.5 - yo,
    0.5, 0.5 - my,
    1, 0.5 - yo,
    1, 0.5 + yo,
    0.5, 0.5 + my,
    0, 0.5 + yo,
  ];
}

const TRIANGLES = buildHex();

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

const float  PI         = 3.14159265359;
const float  SQRT3      = 1.73205080757;
const float  HALF_SQRT3 = 0.5 * SQRT3;     // ≈0.8660 - tan(60°)

in vec2 vTextureCoord;
in vec2 uv;
in vec2 vDistanceToCenter;
flat in uint vInstanceTexture;
flat in uint vInstanceAdjancentTextures;
flat in uint vCoast;

out vec4 fragColor;

uniform sampler2D atlas;
uniform sampler2D whitenoise;
uniform sampler2D noise;

const vec2 N[6] = vec2[6](
  vec2(  0.5,  HALF_SQRT3 ),
  vec2( -0.5,  HALF_SQRT3 ),
  vec2( -1.0,          0.0 ),
  vec2( -0.5, -HALF_SQRT3 ),
  vec2(  0.5, -HALF_SQRT3 ),
  vec2(  1.0,          0.0 )
);

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

float sampleWhitenoise(vec2 uv, float scale) {
  return texture( whitenoise, uv * scale).x;
}

float sampleNoise(vec2 uv, float scale) {
  return texture( noise, uv * scale).x;
}

// https://iquilezles.org/articles/texturerepetition/
vec4 textureNoTile(sampler2D samp, vec2 uv, vec4 offset) {
    // sample variation pattern
    // float k = sampleWhitenoise(uv, 0.01); // cheap (cache friendly) lookup
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

vec4 sampleAtlas(uint textureId, vec2 uv) {
  vec4 offset = uvOffsets[textureId];
  // uv = fract(uv);
  // return texture(atlas, offset.xy + uv * offset.zw);
  return textureNoTile(atlas, uv, offset);
}

void unpackNeighbours( uint packed, out uint n[6] ) {
  n[0] =  packed >> 25;
  n[1] = (packed >> 20) & 31u;
  n[2] = (packed >> 15) & 31u;
  n[3] = (packed >> 10) & 31u;
  n[4] = (packed >>  5) & 31u;
  n[5] =  packed        & 31u;
}

uint edgeFromPos( vec2 p ) {
  float a = atan( p.y - .5, p.x - .5 ) + PI / 6.0;   // 0° = centre of edge 0
  if( a < 0.0 ) {
    a += 2.0 * PI;
  }
  return uint( floor( a / ( PI / 3.0 ) ) );          // 60° sectors
}

uint previousEdge( uint edge ) {
  return ( edge + 5u ) % 6u;
}

uint nextEdge( uint edge ) {
  return ( edge + 1u ) % 6u;
}

float sdHex( vec2 p ) {
  p -= vec2( 0.5 );             // move centre to the origin
  p  = abs( p );                // first sextant is enough
  return max( dot( p, vec2( HALF_SQRT3, .5 ) ), p.y ) - 0.5;
}

void main() {
  float distanceToEdge = length(vDistanceToCenter);
  float distanceToEdge2 = length(uv - vec2(0.5, 0.5));
  vec4 base = sampleAtlas(vInstanceTexture, vTextureCoord);

  uint  neigh[6];
  unpackNeighbours( vInstanceAdjancentTextures, neigh );

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
  // edge -= 1u;
  if (edge < 0u) {
    edge = 5u;
  }
  uint edgeN  = ( edge + 1u ) % 6u; // next edge CCW
  // uint  edge   = edgeFromPos( uv );

  uint sector = uint(floor(angle / (2.0 * PI) * 6.0));
  sector = ( sector + 3u ) % 6u;
  uint nextSector = ( sector + 1u ) % 6u;

  if (angle < PI / 3.0) {
    a = angle / (PI / 3.0);
  } else if (angle < 2.0 * PI / 3.0) {
    a = (angle - PI / 3.0) / (PI / 3.0);
  } else if (angle < 3.0 * PI / 3.0) {
    a = (angle - 2.1 * PI / 3.0) / (PI / 3.0);
  } else if (angle < 4.0 * PI / 3.0) {
    a = (angle - 3.0 * PI / 3.0) / (PI / 3.0);
  } else if (angle < 5.0 * PI / 3.0) {
    a = (angle - 4.0 * PI / 3.0) / (PI / 3.0);
  } else if (angle < 6.0 * PI / 3.0) {
    a = (angle - 5.0 * PI / 3.0) / (PI / 3.0);
  }

  // float sectorFrac = fract( ( atan( uv.y - .5, uv.x - .5 ) + PI/6.0 ) / ( PI / 3.0 ) );
  float sectorFrac = fract( ( angle - PI/6.0 ) / ( PI / 3.0 ) );

  vec4 texA = sampleAtlas(neigh[previousEdge(sector)], vTextureCoord);
  vec4 texB = sampleAtlas(neigh[sector], vTextureCoord);

  float mixSize = 0.2;
  float d = distanceToEdge / 2.6;
  float mixValue = d;

  vec4 edgeColor = mix(texA, texB, a);


  const float BLEND = 0.25;
  bool needCoast = ((vCoast & (1u<<edge)) != 0u);

  if (!needCoast) {
    fragColor = mix(base, edgeColor, mixValue);
  } else {
    fragColor = base;
  }

  float coastBand = 0.0;

  // if (needCoast) {
  //   coastBand = distanceToEdge2;
  //   // + (sampleWhitenoise(vTextureCoord, 0.02) - 0.5) * 0.2;

  //   if (coastBand < 0.4) {
  //     coastBand = 0.0;
  //   }
  // }

  const float r = 0.57735026919;
  vec2 p = uv - vec2(0.5);
  for( int i = 0 ; i < 6 ; ++i ) {
    if( ( vCoast & ( 1u << i ) ) == 0u ) {
      continue;
    };

    // float d = - ( dot( p, N[i] ) - r );
    float d = - ( dot( p, N[i] ));
    // float d = distanceToEdge2*2.0 * -dot( p, N[i] );
    coastBand = max( coastBand, smoothstep( 0.0, 0.99, d ) );
    // coastBand = d;
  }

  coastBand += (sampleWhitenoise(vTextureCoord, 0.02) - 0.5) * 0.2;

  if (coastBand < 0.4) {
    coastBand = 0.0;
  }

  coastBand = smoothstep(0.3, 1.0, coastBand * 2.0);

  if (coastBand > 0.0) {
    vec4 coastColor = sampleAtlas(5u, vTextureCoord)*1.2;
    fragColor = mix(fragColor, coastColor, coastBand);
  }

  float noise1 = sampleNoise(vTextureCoord, 0.02) - 0.5;
  float noise2 = sampleNoise(vTextureCoord, 0.1) - 0.5;
  fragColor += noise1 * 0.6;
  fragColor += noise2 * 0.3;

  // fragColor = vec4(x, x,x,1.0);
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
        noise: getAssets().textures.noise.source,
        whitenoise: getAssets().textures.whitenoise.source,
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
      const y = tile.y * TILE_ROW_OFFSET;
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
