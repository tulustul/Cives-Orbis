import { LandForm, SeaLevel } from "@/shared";
import { TileCore } from "./tile";
import { getTileNeighbours, getTileFullNeighbours } from "./hex-math";

export type PassableArea = {
  id: number;
  type: "land" | "water";
  area: number;
};

export class TilesMapCore {
  tiles: TileCore[][] = [];
  tilesMap = new Map<number, TileCore>();
  passableAreas = new Map<number, PassableArea>();

  constructor(public width: number, public height: number) {
    let id = 0;
    for (let x = 0; x < width; x++) {
      const row: TileCore[] = [];
      this.tiles.push(row);
      for (let y = 0; y < height; y++) {
        const tile = new TileCore(id++, x, y);
        row.push(tile);
        this.tilesMap.set(tile.id, tile);
      }
    }

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const tile = this.tiles[x][y];
        tile.neighbours = getTileNeighbours(this.tiles, x, y);
        tile.fullNeighbours = getTileFullNeighbours(this.tiles, x, y);
        tile.isMapEdge = tile.neighbours.length !== 6;
      }
    }
  }

  precompute() {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const tile = this.tiles[x][y];
        tile.computeYields();
        tile.computeMovementCosts();
        tile.computeSweetSpotValue();
        tile.computeRenderingData();
      }
    }
    this.precomputePassableAreas();
  }

  private precomputePassableAreas() {
    this.passableAreas.clear();
    const visited = new Set<TileCore>();
    let areaId = 1;
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const tile = this.tiles[x][y];
        if (visited.has(tile)) {
          continue;
        }

        if (tile.landForm === LandForm.mountains) {
          tile.passableArea = null;
          continue;
        }
        const passableArea: PassableArea = {
          id: areaId++,
          type: tile.seaLevel === SeaLevel.none ? "land" : "water",
          area: 1,
        };
        this.passableAreas.set(passableArea.id, passableArea);
        this.computePassableArea(tile, passableArea, visited);
      }
    }
  }

  private computePassableArea(
    startTile: TileCore,
    passableArea: PassableArea,
    visited: Set<TileCore>,
  ) {
    // Cannot use recursion here because it fails with too many recursion levels on bigger maps. Using queue instead.
    const queue: TileCore[] = [startTile];
    visited.add(startTile);

    while (queue.length) {
      const tile = queue.shift()!;
      tile.passableArea = passableArea;

      for (const neighbour of tile.neighbours) {
        if (visited.has(neighbour)) {
          continue;
        }

        const isMountains = neighbour.landForm === LandForm.mountains;

        const areBothLand =
          tile.seaLevel === SeaLevel.none &&
          neighbour.seaLevel === SeaLevel.none;

        const areBothWater =
          tile.seaLevel !== SeaLevel.none &&
          neighbour.seaLevel !== SeaLevel.none;

        if (!isMountains && (areBothLand || areBothWater)) {
          visited.add(neighbour);
          queue.push(neighbour);
          passableArea.area++;
        }
      }
    }
  }

  get(x: number, y: number): TileCore | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }
    return this.tiles[x][y];
  }
}
