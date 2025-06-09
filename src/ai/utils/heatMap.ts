import { PlayerCore } from "@/core/player";
import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { LandForm } from "@/shared";
import { TileInfluence } from "@/shared";

type UnitMemory = {
  unit: UnitCore;
  tile: TileCore;
  lastSeen: number;
};

const MEMORY_TURN_LIMIT = 20;
const INFLUENCE_DISTANCE = 6;

export class HeatMap {
  public influences = new Map<TileCore, TileInfluence>();

  private unitsMemory = new Map<UnitCore, UnitMemory>();

  constructor(private player: PlayerCore) {}

  update() {
    this.influences.clear();

    for (const city of this.player.game.citiesManager.cities) {
      if (!this.player.exploredTiles.has(city.tile)) {
        continue;
      }

      const isEnemy = city.player !== this.player;
      const cityInfluence =
        city.defense.strength * (city.defense.health / city.defense.maxHealth) +
        1;
      this.spreadInfluence(
        city.tile,
        isEnemy ? 0 : cityInfluence,
        isEnemy ? cityInfluence : 0,
      );
    }

    for (const tile of this.player.visibleTiles) {
      this.updateTile(tile, tile.units);
    }

    const memoriesByTile = new Map<TileCore, UnitMemory[]>();
    for (const memory of this.unitsMemory.values()) {
      const turns = this.player.game.turn - memory.lastSeen;
      if (!turns) {
        continue;
      }

      if (turns >= MEMORY_TURN_LIMIT) {
        this.unitsMemory.delete(memory.unit);
        continue;
      }

      let tileMemory = memoriesByTile.get(memory.tile);
      if (!tileMemory) {
        tileMemory = [];
        memoriesByTile.set(memory.tile, tileMemory);
      }
      tileMemory.push(memory);
    }

    for (const [tile, memories] of memoriesByTile) {
      const units = memories.map((m) => m.unit);
      const confidence = memories.map(
        (m) => 1 - (this.player.game.turn - m.lastSeen) / MEMORY_TURN_LIMIT,
      );
      this.updateTile(tile, units, confidence);
    }
  }

  private updateTile(
    tile: TileCore,
    units: UnitCore[],
    unitsConfidence: number[] | null = null,
  ) {
    let friendlyInfluence = 0;
    let enemyInfluence = 0;

    let i = 0;
    for (const unit of units) {
      const isFriendly = unit.player === this.player;
      const isEnemy = this.player.isEnemyWith(unit.player);

      if (isEnemy && !unitsConfidence) {
        let memory = this.unitsMemory.get(unit);
        if (memory) {
          memory.tile = tile;
          memory.lastSeen = this.player.game.turn;
        } else {
          memory = { unit, tile, lastSeen: this.player.game.turn };
          this.unitsMemory.set(unit, memory);
        }
      }

      const confidence = unitsConfidence ? unitsConfidence[i] : 1;
      const influence =
        unit.definition.strength * (unit.health / 100) * confidence;
      if (isFriendly) {
        friendlyInfluence += influence;
      } else if (isEnemy) {
        enemyInfluence += influence;
      }

      i++;
    }

    this.spreadInfluence(tile, friendlyInfluence, enemyInfluence);
  }

  private spreadInfluence(
    tile: TileCore,
    friendlyInfluence: number,
    enemyInfluence: number,
  ) {
    if (friendlyInfluence < 0.1 && enemyInfluence < 0.1) {
      return;
    }

    const neighbours = tile.getTilesInRange(INFLUENCE_DISTANCE);
    for (const neighbour of neighbours) {
      if (friendlyInfluence > 0.1) {
        const distance = neighbour.getDistanceTo(tile);
        const influence = this.calculateInfluence(
          friendlyInfluence,
          distance,
          tile,
          neighbour,
        );
        if (influence > 0.1) {
          this.addInfluenceToTile(neighbour, influence, true);
        }
      }
      if (enemyInfluence > 0.1) {
        const distance = neighbour.getDistanceTo(tile);
        const influence = this.calculateInfluence(
          enemyInfluence,
          distance,
          tile,
          neighbour,
        );
        if (influence > 0.1) {
          this.addInfluenceToTile(neighbour, influence, false);
        }
      }
    }
  }

  private calculateInfluence(
    baseStrength: number,
    distance: number,
    fromTile: TileCore,
    toTile: TileCore,
  ): number {
    // Basic distance decay
    let influence =
      baseStrength - (baseStrength / INFLUENCE_DISTANCE) * distance;

    // Terrain affects influence spread
    if (toTile.landForm === LandForm.mountains) {
      influence = 0; // Mountains block influence
    } else if (toTile.landForm === LandForm.hills) {
      influence *= 0.7; // Hills reduce influence
    }

    // Water tiles reduce land unit influence
    if (toTile.isWater && !fromTile.isWater) {
      influence *= 0.2;
    }

    return influence;
  }

  private addInfluenceToTile(
    tile: TileCore,
    influence: number,
    isFriendly: boolean,
  ) {
    let tileInfluence = this.influences.get(tile);

    if (!tileInfluence) {
      tileInfluence = {
        friendly: { total: 0 },
        enemy: { total: 0 },
      };
      this.influences.set(tile, tileInfluence);
    }

    const target = isFriendly ? tileInfluence.friendly : tileInfluence.enemy;

    // Categorize unit type
    target.total += influence;
  }

  // Query methods
  getTileInfluence(tile: TileCore): TileInfluence | null {
    return this.influences.get(tile) || null;
  }

  getThreatLevel(tile: TileCore): number {
    const influence = this.getTileInfluence(tile);
    if (!influence) return 0;
    return influence.enemy.total;
  }

  getFriendlyStrength(tile: TileCore): number {
    const influence = this.getTileInfluence(tile);
    if (!influence) return 0;
    return influence.friendly.total;
  }

  getContestedAreas(threshold: number = 0.7): TileCore[] {
    const contested: TileCore[] = [];

    for (const [tile, influence] of this.influences) {
      const friendly = influence.friendly.total;
      const enemy = influence.enemy.total;
      const total = friendly + enemy;

      if (total > 0) {
        const ratio = Math.min(friendly, enemy) / Math.max(friendly, enemy);
        if (ratio > threshold) {
          contested.push(tile);
        }
      }
    }

    return contested;
  }
}
