import { TilesMapCore } from "./tiles-map";
import { TileCore } from "./tile";
import { Entity } from "./data/types";

/**
 * Each tile have two properties for each of the entities:
 * - Pressure [0, inf]
 * - Influence [0, 1]
 */

export class InfluenceFieldEmitter<T extends Entity> {
  tile!: TileCore;
  entity!: T;
  pressure!: number;
  pressureSpreadModifier!: number;
  minInfluenceToSpread!: number;

  constructor(options: any) {
    Object.assign(this, options);
  }
}

interface TileInfluence {
  pressure: number;
  influence: number;
}

export class InfluenceField<T extends Entity> {
  tiles = new Map<TileCore, Map<T, TileInfluence>>();

  private emitters: InfluenceFieldEmitter<T>[] = [];

  constructor(map: TilesMapCore) {
    for (let x = 0; x < map.width; x++) {
      for (let y = 0; y < map.height; y++) {
        this.tiles.set(map.tiles[x][y], new Map());
      }
    }
  }

  addEmmitter(emitter: InfluenceFieldEmitter<T>) {
    this.emitters.push(emitter);
  }

  removeEmmitter(emitter: InfluenceFieldEmitter<T>) {
    const index = this.emitters.indexOf(emitter);
    if (index !== -1) {
      this.emitters.splice(index, 1);
    }
  }

  addEntity(entity: T) {
    for (const influenceMap of this.tiles.values()) {
      influenceMap.set(entity, { pressure: 0, influence: 0 });
    }
  }

  tick() {
    this.calculatePressures();
    this.calculateInfluences();
  }

  private calculatePressures() {
    // Copy emitter pressure to the tile.
    for (const emitter of this.emitters) {
      this.tiles.get(emitter.tile)!.get(emitter.entity)!.pressure =
        emitter.pressure;
    }

    // Calculate new pressures for all tiles.
    // for (const emitter of this.emitters) {
    // }
  }

  private calculateInfluences() {
    // for (let x = 0; x < this.map.width; x++) {
    //   for (let y = 0; y < this.map.height; y++) {}
    // }
  }
}
