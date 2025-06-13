import {
  Climate,
  LandForm,
  SeaLevel,
  TileDirection,
  TileRoad,
  Yields,
} from "@/shared";
import { CityCore } from "./city";
import { District } from "./city/cityDistricts";
import { collector } from "./collector";
import { Nation, TileImprovementDefinition } from "./data/types";
import { PlayerCore } from "./player";
import { ResourceDeposit } from "./resources";
import { SuppliesProducer } from "./supplies";
import { PassableArea } from "./tiles-map";
import { UnitCore } from "./unit";
import { UnitGroup } from "./unitGroup";
import { EMPTY_YIELDS, addYields } from "./yields";

const BASE_CLIMATE_YIELDS: Record<Climate, Yields> = {
  [Climate.arctic]: { ...EMPTY_YIELDS },
  [Climate.desert]: {
    ...EMPTY_YIELDS,
  },
  [Climate.temperate]: { ...EMPTY_YIELDS, food: 2, production: 1 },
  [Climate.savanna]: { ...EMPTY_YIELDS, food: 1, production: 1 },
  [Climate.tropical]: { ...EMPTY_YIELDS, food: 1 },
  [Climate.tundra]: { ...EMPTY_YIELDS, production: 1 },
};

const BASE_LAND_FORM_YIELDS: Record<LandForm, Yields> = {
  [LandForm.plains]: { ...EMPTY_YIELDS },
  [LandForm.hills]: { ...EMPTY_YIELDS, food: -1 },
  [LandForm.mountains]: { ...EMPTY_YIELDS, food: -Infinity, production: -5 },
};

export class TileCore {
  climate = Climate.temperate;
  landForm = LandForm.plains;
  seaLevel = SeaLevel.deep;

  riverParts: TileDirection[] = [];

  /* Extra information for the renderer. Data is stored as bits for each edge/corner.
  0-5: edge has no river (0), edge has river (1)
  6-11: river is flowing clockwise (0), river is flowing counter-clockwise (1)
  12-17: corner is a river source (1)
  18-23: corner is a river mouth (1)
  */
  river = 0;

  /* Extra information for the renderer.
  Bits 0-5: mountains
  Bits 6-11: hills
  */
  landFormNeighbours = 0;

  /** Extra information for the renderer.
   * Bits 0-5: 1 if neighbour has a forest
   * Bit 6: 1 if this tile has a forest
   */
  forestData = 0;

  /** Extra information for the renderer.
   * Bits 0-5: 1 if neighbour has a road
   * Bit 6: 1 if this tile has a road
   */
  roadData = 0;

  forest = false;
  wetlands = false;
  coast = false;
  improvement: TileImprovementDefinition | null = null;
  road: TileRoad | null = null;
  resource: ResourceDeposit | null = null;

  units: UnitGroup[] = [];
  city: CityCore | null = null;
  district: District | null = null;
  areaOf: CityCore | null = null;

  // Worker slots
  workerSlots = 1; // Default is 1 slot for a basic tile
  currentWorkers: { populationType: string; city: CityCore }[] = [];

  yields: Yields = { ...EMPTY_YIELDS };

  ethnicity = new Map<Nation, number>();

  // cached data below
  neighbours: TileCore[] = [];

  // keeps neighbours in all directions, null if map border, can be indexed with TileDirection
  fullNeighbours: (TileCore | null)[] = [];

  neighboursCosts = new Map<TileCore, number>();

  // used by ai to find good city location
  sweetSpotValue = 0;

  // used by pathfinding to quickly decide if a path between two tiles exists
  passableArea: PassableArea | null = null;

  isMapEdge = false;

  // Zone of control. Which player is militarly in control of the tile.
  zocPlayer: PlayerCore | null = null;
  zocUnits = new Set<UnitGroup>();

  potentiallySuppliedBy = new Set<SuppliesProducer>();
  suppliedBy = new Set<SuppliesProducer>();
  // canBeSuppliedByCities = new Set<CityCore>();
  // suppliedByUnits = new Set<UnitCore>();

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
    this.yields = { ...EMPTY_YIELDS };
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

      if (this.improvement && this.improvement.extraYields) {
        addYields(this.yields, this.improvement.extraYields);
      }

      this.yields.food = Math.max(0, this.yields.food);
      this.yields.production = Math.max(0, this.yields.production);
    }

    if (this.resource) {
      this.resource.computeYields();
      if (this.resource.yields) {
        addYields(this.yields, this.resource.yields);
      }
    }
  }

  get totalYields(): number {
    return this.yields.food + this.yields.production + this.yields.gold;
  }

  getTilesInRange(range: number): Set<TileCore> {
    if (range === 0) return new Set([this]);

    const result = new Set<TileCore>();
    const visited = new Set<TileCore>();
    const queue: { tile: TileCore; distance: number }[] = [
      { tile: this, distance: 0 },
    ];
    let head = 0;

    while (head < queue.length) {
      const { tile, distance } = queue[head++];

      if (visited.has(tile)) continue;
      visited.add(tile);
      result.add(tile);

      if (distance < range) {
        for (const neighbour of tile.neighbours) {
          if (!visited.has(neighbour)) {
            queue.push({ tile: neighbour, distance: distance + 1 });
          }
        }
      }
    }

    return result;
  }

  *getTilesAndDistanceInRange(range: number): Generator<[TileCore, number]> {
    yield [this, 0];
    const visited = new Set<TileCore>([this]);
    for (let i = 0; i < range; i++) {
      const neighbours = new Set<TileCore>();
      for (const tile of visited) {
        for (const neighbour of tile.neighbours) {
          neighbours.add(neighbour);
        }
      }
      for (const tile of neighbours) {
        if (!visited.has(tile)) {
          visited.add(tile);
          yield [tile, i];
        }
      }
    }
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
      this.sweetSpotValue += tile.yields.gold;
    }

    if (this.coast) {
      this.sweetSpotValue *= 1.5;
    }
  }

  update() {
    this.computeYields();
    this.computeMovementCosts();
    for (const neighbour of this.neighbours) {
      // TODO this loop can be optimized by computing only the cost from neighbour to this tile.
      neighbour.computeMovementCosts();
    }
    this.computeRenderingData();
    collector.tiles.add(this);
  }

  updateWithNeighbours() {
    this.update();
    for (const neighbour of this.neighbours) {
      neighbour.update();
    }
  }

  get isWater() {
    return this.seaLevel !== SeaLevel.none;
  }

  get isLand() {
    return !this.isWater;
  }

  getBestEnemyMilitaryUnit(unit: UnitGroup): UnitCore | null {
    // TODO implement war state between players
    let bestEnemy: UnitCore | null = null;
    let bestScore = -Infinity;
    for (const group of this.units) {
      if (group.player === unit.player) {
        continue;
      }
      for (const u of group.units) {
        if (u.definition.strength) {
          const score = u.definition.strength * Math.min(1, u.count);
          if (score > bestScore) {
            bestScore = score;
            bestEnemy = u;
          }
        }
      }
    }
    return bestEnemy;
  }

  getEnemyUnit(unit: UnitGroup): UnitCore | undefined {
    // TODO implement war state between players
    const militaryEnemy = this.getBestEnemyMilitaryUnit(unit);
    if (militaryEnemy) {
      return militaryEnemy;
    }
    const enemyGroup = this.units.find((u) => u.player !== unit.player);
    return enemyGroup?.units[0];
  }

  getEmbarkmentTarget(unit: UnitCore): UnitCore | undefined {
    for (const group of this.units) {
      const transport = group.units.find(
        (u) =>
          u.player === unit.player &&
          u.definition.capacity &&
          u.children.length < u.definition.capacity,
      );
      if (transport) {
        return transport;
      }
    }
  }

  isSuppliedByPlayer(player: PlayerCore): boolean {
    return player.suppliedTiles.has(this);
  }

  isPotentiallySuppliedByPlayer(player: PlayerCore): boolean {
    for (const suppliesProducer of this.potentiallySuppliedBy) {
      if (suppliesProducer.player === player) {
        return true;
      }
    }

    return false;
  }

  precompute() {
    this.coast =
      this.seaLevel === SeaLevel.none &&
      this.neighbours.some((n) => n.seaLevel !== SeaLevel.none);

    this.computeYields();
    this.computeMovementCosts();
    this.computeSweetSpotValue();
    this.computeRenderingData();
  }

  computeRenderingData() {
    this.computeRiverData();
    this.computeLandFormData();
    this.computeForestData();
    this.computeRoadData();
  }

  computeRiverData() {
    this.river = 0;
    for (const dir of this.riverParts) {
      this.river |= 1 << dir;
    }

    // for (const dir of this.riverParts) {
    //   const n1 = this.fullNeighbours[dir];
    //   const n2 = this.fullNeighbours[dir === 0 ? 5 : dir - 1];
    //   if (!n1 || !n2) {
    //     continue;
    //   }

    //   if (this.river & (1 << (neighbourDir + 12))) {
    //     this.river |= 1 << (dir + 18);
    //   }
    // }
  }

  computeLandFormData() {
    this.landFormNeighbours = 0;
    for (let i = 0; i < this.fullNeighbours.length; i++) {
      const neighbour = this.fullNeighbours[i];
      if (!neighbour) {
        continue;
      }
      if (neighbour.landForm === LandForm.mountains) {
        this.landFormNeighbours |= 1 << i;
      } else if (neighbour.landForm === LandForm.hills) {
        this.landFormNeighbours |= 1 << (i + 6);
      }
    }
  }

  computeForestData() {
    this.forestData = 0;
    for (let i = 0; i < this.fullNeighbours.length; i++) {
      const neighbour = this.fullNeighbours[i];
      if (!neighbour) {
        continue;
      }
      if (neighbour.forest) {
        this.forestData |= 1 << i;
      }
    }
    if (this.forest) {
      this.forestData |= 1 << 6;
    }
  }

  computeRoadData() {
    this.roadData = 0;
    for (let i = 0; i < this.fullNeighbours.length; i++) {
      const neighbour = this.fullNeighbours[i];
      if (!neighbour) {
        continue;
      }
      if (neighbour.road !== null) {
        this.roadData |= 1 << i;
      }
    }
    if (this.road !== null) {
      this.roadData |= 1 << 6;
    }
  }
}
