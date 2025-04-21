import * as terrainData from "@/assets/atlas-terrain.json";
import { TileChanneled } from "@/core/serialization/channel";
import { Climate, SeaLevel } from "@/shared";
import { AttributeOptions, Container, Shader } from "pixi.js";
import { bridge } from "@/bridge";
import { mapUi } from "@/ui/mapUi";
import { HexDrawer } from "./hexDrawer";
import { getAssets } from "./assets";
import { measureTime } from "@/utils";
import { HEX } from "./hexGeometry";
import { render } from "sass-embedded";
import { renderer } from "./renderer";

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

const float PI = 3.14159265359;
const float SQRT3 = 1.73205080757;
const float HALF_SQRT3 = 0.5 * SQRT3;

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
    float k = sampleWhitenoise(uv, 0.01);
    // float k = noiseFn( uv );

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
  if (textureId == ${terrainNameToId["water.png"]}u || textureId == ${
  terrainNameToId["deepWater.png"]
}u) {
    vec2 wave = vec2(
      cos(time * .07 + uv.y * 4.0) * .01 + sin(time * .015 + uv.y * 5.0) * .017,
      cos(time * .05 + uv.x * 5.0) * .013 + sin(time * .02 + uv.x * 5.0) * .021
    );
    uv += wave + time * 0.0005;
  }
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

float getBorder(uint data) {
  vec2 p = uv - vec2(0.5);
  // vec2 p = point;
  float v = 0.0;
  for (int i = 0; i < 6; ++i) {
    if ((data & (1u << i)) != 0u) {
      v = max(v, -dot(p, N[i]));
    }
  }
  return clamp(1.0 - 2.0 * v, 0.0, 1.0);
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

  float coastBand = 1.0 - getBorder(vCoast) * 1.5;
  float riverBand = 1.0 - getBorder(vCoast >> 6) * 3.5;

  // float coastNoise = 1.0 + ((sampleWhitenoise(vTextureCoord, 0.02)) - 0.5) * 0.5;
  // coastBand *= coastNoise;
  // riverBand *= coastNoise;

  float coastSize = vInstanceTexture == ${
    terrainNameToId["water.png"]
  }u ? 0.7 : 0.2;
  coastBand = smoothstep(coastSize, 1.0, coastBand);
  riverBand = smoothstep(0.5, 1.0, riverBand);

  if (coastBand > 0.0) {
    vec4 coastColor = sampleAtlas(5u, vTextureCoord)*1.3;
    fragColor = mix(fragColor, coastColor, coastBand);
  }

  if (riverBand > 0.0) {
    vec4 coastColor = sampleAtlas(11u, vTextureCoord);
    fragColor = mix(fragColor, coastColor, riverBand);
  }

  float noise1 = sampleNoise(vTextureCoord, 0.02) - 0.5;
  float noise2 = sampleNoise(vTextureCoord, 0.1) - 0.5;
  fragColor += noise1 * 0.6;
  fragColor += noise2 * 0.3;

  if (gridEnabled) {
    float grid = max(0.0, distanceToEdge - 1.3) * 1.0;
    fragColor += smoothstep(0.0, 0.4, grid);
  }
}`;

const SEA_LEVEL_TO_TEXTURE: Record<SeaLevel, number | null> = {
  [SeaLevel.shallow]: terrainNameToId["water.png"],
  [SeaLevel.deep]: terrainNameToId["deepWater.png"],
  [SeaLevel.none]: null,
};

const CLIMATE_TO_TEXTURE: Record<Climate, number> = {
  [Climate.tropical]: terrainNameToId["tropical.png"],
  [Climate.savanna]: terrainNameToId["savanna.png"],
  [Climate.desert]: terrainNameToId["desert.png"],
  [Climate.arctic]: terrainNameToId["arctic.png"],
  [Climate.temperate]: terrainNameToId["temperate.png"],
  [Climate.tundra]: terrainNameToId["tundra.png"],
};

export class TerrainDrawer extends HexDrawer<TileChanneled> {
  instanceTextures = new Uint32Array(0);
  instanceAdjacentTextures = new Uint32Array(0);
  instanceCoast = new Uint32Array(0);

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
    const terrain = getAssets().terrainSpritesheet;

    return Shader.from({
      gl: { fragment: FRAGMENT_PROGRAM, vertex: VERTEX_PROGRAM },
      resources: {
        atlas: terrain.textureSource,
        noise: getAssets().textures.noise.source,
        whitenoise: getAssets().textures.whitenoise.source,
        uniforms: {
          gridEnabled: { value: mapUi.gridEnabled ? 1 : 0, type: "i32" },
          time: { value: renderer.app.ticker.elapsedMS / 1000, type: "f32" },
        },
      },
    });
  }

  override getGeometryAttributes(): AttributeOptions {
    return {
      aDistanceToCenter: { buffer: HEX.centerDistance, format: "float32x2" },
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
      aCoast: {
        buffer: this.instanceCoast,
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
  }

  getTextureIndex(tile: TileChanneled): number {
    const texIndex = SEA_LEVEL_TO_TEXTURE[tile.seaLevel];
    if (texIndex !== null) {
      return texIndex;
    }
    return CLIMATE_TO_TEXTURE[tile.climate];
  }

  getAdjacentsTextureIndexes(
    tile: TileChanneled,
    tilesMap: Map<number, TileChanneled>,
  ): number {
    const textures = tile.fullNeighbours.map((n) => {
      let neighbour = n ? tilesMap.get(n) : null;

      return this.getTextureIndex(neighbour ?? tile);
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
      let neighbour = (n ? tilesMap.get(n) : null) ?? tile;
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
  }

  private updateBuffers_(): void {
    this.geometry?.getAttribute("aInstanceTexture").buffer.update();
    this.geometry?.getAttribute("aInstanceAdjancentTextures").buffer.update();
    this.geometry?.getAttribute("aCoast").buffer.update();
  }
}
