import { Yields, EMPTY_YIELDS } from "./yields";
import { TileImprovement, TileRoad } from "./tile-improvements";
import {
  Climate,
  LandForm,
  SeaLevel,
  TileDirection,
  BaseTile,
} from "../shared";
import { UnitCore } from "./unit";
import { CityCore } from "./city";
import { collector } from "./collector";
import { Nation } from "./data.interface";

const BASE_CLIMATE_YIELDS: Record<Climate, Yields> = {
  [Climate.arctic]: { ...EMPTY_YIELDS },
  [Climate.continental]: { ...EMPTY_YIELDS, food: 1, production: 1 },
  [Climate.desert]: {
    ...EMPTY_YIELDS,
  },
  [Climate.oceanic]: { ...EMPTY_YIELDS, food: 2, production: 1 },
  [Climate.savanna]: { ...EMPTY_YIELDS, food: 1, production: 1 },
  [Climate.tropical]: { ...EMPTY_YIELDS, food: 1 },
  [Climate.tundra]: { ...EMPTY_YIELDS, production: 1 },
};

const BASE_LAND_FORM_YIELDS: Record<LandForm, Yields> = {
  [LandForm.plains]: { ...EMPTY_YIELDS },
  [LandForm.hills]: { ...EMPTY_YIELDS, food: -1 },
  [LandForm.mountains]: { ...EMPTY_YIELDS, food: -Infinity, production: -5 },
};

export class TileCore implements BaseTile {
  climate = Climate.continental;
  landForm = LandForm.plains;
  seaLevel = SeaLevel.deep;
  riverParts: TileDirection[] = [];
  forest = false;
  wetlands = false;
  improvement: TileImprovement | null = null;
  road: TileRoad | null = null;

  units: UnitCore[] = [];
  city: CityCore | null = null;
  areaOf: CityCore | null = null;

  yields: Yields = { ...EMPTY_YIELDS };

  ethnicity = new Map<Nation, number>();

  // cached data
  neighbours: TileCore[] = [];
  fullNeighbours: (TileCore | null)[] = []; // keeps neighbours in all directions, null if map border, can be indexed with TileDirection
  neighboursCosts = new Map<TileCore, number>();
  sweetSpotValue = 0; // used by ai to find good city location
  passableArea = 0; // used by pathfinding to quickly decide if a path between two tiles exists

  constructor(public id: number, public x: number, public y: number) {}

  computeMovementCosts() {
    for (const neighbour of this.neighbours) {
      const dir = this.getDirectionTo(neighbour);
      let cost = 1;

      if (neighbour.landForm === LandForm.mountains) {
        cost = Infinity;
      } else if (neighbour.landForm === LandForm.hills) {
        cost = 2;
      } else {
        if (this.riverParts.includes(dir)) {
          cost = 3;
        } else if (this.riverParts.length && neighbour.riverParts.length) {
          cost = 0.5;
        }
      }

      if (neighbour.road === TileRoad.road) {
        cost /= 3;
      }
      if (neighbour.forest) {
        cost *= 2;
      }
      this.neighboursCosts.set(neighbour, cost);
    }
  }

  getDirectionTo(tile: TileCore): TileDirection {
    if (tile.x === this.x - (this.y % 2 ? 0 : 1) && tile.y === this.y - 1) {
      return TileDirection.NW;
    }
    if (tile.x === this.x + (this.y % 2 ? 1 : 0) && tile.y === this.y - 1) {
      return TileDirection.NE;
    }
    if (tile.x === this.x + 1 && tile.y === this.y) {
      return TileDirection.E;
    }
    if (tile.x === this.x + (this.y % 2 ? 1 : 0) && tile.y === this.y + 1) {
      return TileDirection.SE;
    }
    if (tile.x === this.x - (this.y % 2 ? 0 : 1) && tile.y === this.y + 1) {
      return TileDirection.SW;
    }
    if (tile.x === this.x - 1 && tile.y === this.y) {
      return TileDirection.W;
    }
    return TileDirection.NONE;
  }

  getDistanceTo(tile: TileCore) {
    // This is imprecise but good enough for now.
    return Math.abs(this.x - tile.x) + Math.abs(this.y - tile.y);
  }

  computeYields() {
    if (this.seaLevel === SeaLevel.deep) {
      this.yields.food = 0;
      this.yields.production = 0;
    } else if (this.seaLevel === SeaLevel.shallow) {
      this.yields.food = 1;
      this.yields.production = 0;
    } else {
      const climateYields = BASE_CLIMATE_YIELDS[this.climate];
      const landFormYields = BASE_LAND_FORM_YIELDS[this.landForm];
      this.yields.food = climateYields.food + landFormYields.food;
      this.yields.production =
        climateYields.production + landFormYields.production;

      if (this.forest) {
        this.yields.food--;
        this.yields.production++;
      }

      if (this.wetlands) {
        this.yields.food--;
        this.yields.production--;
      }

      if (this.riverParts.length) {
        this.yields.food += this.climate === Climate.desert ? 3 : 1;
      }

      if (this.improvement === TileImprovement.farm) {
        this.yields.food++;
      } else if (this.improvement === TileImprovement.mine) {
        this.yields.production++;
      } else if (this.improvement === TileImprovement.sawmill) {
        this.yields.production++;
      }

      this.yields.food = Math.max(0, this.yields.food);
      this.yields.production = Math.max(0, this.yields.production);
    }
  }

  get totalYields(): number {
    return this.yields.food + this.yields.production;
  }

  getTilesInRange(range: number): Set<TileCore> {
    const result = new Set<TileCore>([this]);
    for (let i = 0; i < range; i++) {
      let neighbours = new Set<TileCore>();
      for (const tile of result) {
        for (const neighbour of tile.neighbours) {
          neighbours.add(neighbour);
        }
      }
      for (const tile of neighbours) {
        result.add(tile);
      }
    }
    return result;
  }

  computeSweetSpotValue() {
    this.sweetSpotValue = 0;
    if (
      this.areaOf ||
      this.landForm === LandForm.mountains ||
      this.seaLevel !== SeaLevel.none
    ) {
      return;
    }
    const tiles = this.getTilesInRange(3);
    for (const tile of tiles) {
      this.sweetSpotValue += tile.yields.food;
      this.sweetSpotValue += tile.yields.production;
    }
  }

  update() {
    this.computeYields();
    this.computeMovementCosts();
    for (const neighbour of this.neighbours) {
      // TODO this loop can be optimized by computing only the cost from neighbour to this tile.
      neighbour.computeMovementCosts();
    }
    collector.tiles.add(this);
  }

  get isWater() {
    return this.seaLevel !== SeaLevel.none;
  }

  get isLand() {
    return !this.isWater;
  }

  getFirstEnemyUnit(unit: UnitCore): UnitCore | undefined {
    // TODO implement war state between players
    return this.units.find(
      (u) => u.definition.strength && u.player !== unit.player,
    );
  }

  getEmbarkmentTarget(unit: UnitCore): UnitCore | undefined {
    return this.units.find(
      (u) =>
        u.player === unit.player &&
        u.definition.capacity &&
        u.children.length < u.definition.capacity,
    );
  }
}
