import { bridge } from "@/bridge";
import { TileChanneled } from "@/core/serialization/channel";
import { SeaLevel } from "@/shared";
import { measureTime } from "@/utils";
import { AttributeOptions, Container, Shader } from "pixi.js";
import { HexDrawer } from "./hexDrawer";

const VERTEX_PROGRAM = `#version 300 es

precision mediump float;

in vec2 aVertexPosition;
in vec2 aInstancePosition;
in uint aHexType;
in uint aNeighbours;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

out vec2 point;
flat out uint hexType;
flat out uint neighbours;

void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  point = aVertexPosition;
  hexType = aHexType;
  neighbours = aNeighbours;
  gl_Position = vec4((mvp * vec3(aVertexPosition + aInstancePosition, 1.0)).xy, 0.0, 1.0);
}`;

const FRAGMENT_PROGRAM = `#version 300 es
precision highp float;

in vec2 point; // Local coordinates for each hex (width=1, pointy top)
flat in uint hexType; // 0=water, 1=land
flat in uint neighbours; // Packed neighbor types (NW, NE, E, SE, SW, W)

out vec4 fragColor;

// Constants
const float TRANSITION_WIDTH = 0.1;
const vec3 LAND_COLOR = vec3(0.2, 0.8, 0.2); // Green
const vec3 WATER_COLOR = vec3(0.2, 0.4, 0.8); // Blue
const vec3 COAST_COLOR = vec3(0.8, 0.8, 0.1); // Yellow

// Check if a neighbor is land (1) or water (0)
bool isNeighborLand(uint neighbors, int position) {
    uint mask = uint(1) << uint(position);
    return (neighbors & mask) != 0u;
}

// Edge vertices for a pointy-top hexagon with width 1.0, centered at (0.5, 0.5)
const vec2 hexVertices[6] = vec2[6](
    vec2(0.067, 0.25),        // NW
    vec2(0.5, 0.0),          // N
    vec2(0.933, 0.25),       // NE
    vec2(0.933, 0.75),       // SE
    vec2(0.5, 1.0),          // S
    vec2(0.067, 0.75)       // SW
);

// Distance to quadratic Bezier curve (p0, p1, p2) from point p
float distanceToBezier(vec2 p, vec2 p0, vec2 p1, vec2 p2) {
    float minDist = 1000.0;

    // Approximate the curve with line segments
    const int segments = 6;

    for (int i = 0; i < segments; i++) {
        float t0 = float(i) / float(segments);
        float t1 = float(i + 1) / float(segments);

        // Quadratic Bezier points
        vec2 q0 = mix(mix(p0, p1, t0), mix(p1, p2, t0), t0);
        vec2 q1 = mix(mix(p0, p1, t1), mix(p1, p2, t1), t1);

        // Line segment
        vec2 dir = q1 - q0;
        float len = length(dir);
        dir = dir / len;

        // Vector from line start to point
        vec2 v = p - q0;

        // Project point onto line
        float t = clamp(dot(v, dir), 0.0, len);
        vec2 projection = q0 + dir * t;

        // Distance from point to line segment
        float dist = length(p - projection);

        minDist = min(minDist, dist);
    }

    return minDist;
}

// Generate a consistent hash for an edge based on its vertices
float edgeHash(int i) {
    // Use a simple but consistent hash function
    // This ensures the curve shape is the same regardless of which hex draws it
    float val = float(i) * 0.37;
    return fract(sin(val * 12.9898) * 43758.5453);
}

void main() {
    // Current hex type
    bool isLand = (hexType == 1u);

    // Base colors
    vec3 currentColor = isLand ? LAND_COLOR : WATER_COLOR;
    vec3 oppositeColor = COAST_COLOR;

    // Blend factor for the transition
    float blendFactor = 0.0;

    // Hex center
    vec2 center = vec2(0.5, 0.5);

    // For each edge, check if it's a transition edge
    for (int i = 0; i < 6; i++) {
        int nextIdx = (i + 1) % 6;

        bool neighborIsLand = isNeighborLand(neighbours, i);

        // If current hex and neighbor are different types, create transition
        if (isLand != neighborIsLand) {
            // Edge vertices
            vec2 v1 = hexVertices[i];
            vec2 v2 = hexVertices[nextIdx];
            vec2 edgeMidpoint = (v1 + v2) * 0.5;

            // Generate a consistent control point regardless of which hex draws the edge
            // Always bulge from water to land (consistent direction)
            vec2 edgeNormal = normalize(edgeMidpoint - center); // Points outward

            // If land is on the outside, reverse the direction
            if (isLand) {
                edgeNormal = -edgeNormal;
            }

            // Adjust the curve amount for variety, but in a deterministic way
            float curveAmount = 0.12 + edgeHash(i) * 0.08; // 0.12-0.20 range

            // Position control point along the edge normal from the midpoint
            vec2 controlPoint = edgeMidpoint + edgeNormal * curveAmount;

            // Get distance to the Bezier curve
            float dist = distanceToBezier(point, v1, controlPoint, v2);

            // Smooth transition
            float influence = 1.0 - smoothstep(0.0, TRANSITION_WIDTH, dist);

            // Accumulate transition influence
            blendFactor = max(blendFactor, influence);
        }
    }

    // Blend between colors
    vec3 finalColor = mix(currentColor, oppositeColor, blendFactor);

    fragColor = vec4(finalColor, 1.0);
}`;

export class TerrainDrawerSimple extends HexDrawer<TileChanneled> {
  hexType = new Uint32Array(0);
  neighbours = new Uint32Array(0);
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
  }

  public tick(_: number) {}

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
    return Shader.from({
      gl: { fragment: FRAGMENT_PROGRAM, vertex: VERTEX_PROGRAM },
    });
  }

  override getGeometryAttributes(): AttributeOptions {
    return {
      aHexType: {
        buffer: this.hexType,
        format: "uint32",
        instance: true,
      },
      aNeighbours: {
        buffer: this.neighbours,
        format: "uint32",
        instance: true,
      },
    };
  }

  override setTileAttributes(tile: TileChanneled, index: number) {
    this.hexType[index] = this.getHexType(tile);
    this.neighbours[index] = this.getNeighbours(tile, this.tilesMap);
  }

  getHexType(tile: TileChanneled): number {
    return tile.seaLevel === SeaLevel.none ? 1 : 0;
  }

  getNeighbours(
    tile: TileChanneled,
    tilesMap: Map<number, TileChanneled>,
  ): number {
    const neighbours = tile.fullNeighbours.map((n) => {
      let neighbour = n ? tilesMap.get(n) : null;

      return this.getHexType(neighbour ?? tile);
    });

    let hexTypes = 0;
    for (let i = 0; i < neighbours.length; i++) {
      hexTypes += neighbours[i] << i;
    }

    return hexTypes;
  }

  override initializeBuffers(maxInstances: number) {
    super.initializeBuffers(maxInstances);
    this.hexType = new Uint32Array(maxInstances);
    this.neighbours = new Uint32Array(maxInstances);
  }

  private updateBuffers_(): void {
    this.geometry?.getAttribute("aHexType").buffer.update();
    this.geometry?.getAttribute("aNeighbours").buffer.update();
  }
}
