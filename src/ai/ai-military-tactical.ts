import { findPath } from "@/core/pathfinding";
import { PlayerCore } from "@/core/player";
import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { AISystem } from "./ai-system";
import { AiOrder } from "./types";
import { estimateCombatResult, getTileDefenseBonus, isCoastal } from "./utils";

/**
 * Target selection and evaluation
 */
interface CombatTarget {
  unit: UnitCore;
  tile: TileCore;
  attackValue: number;
  defensiveValue: number;
  priority: number;
  estimatedDamage: number;
  estimatedRetaliationDamage: number;
}

/**
 * Combat area that groups targets and attackers
 */
interface CombatZone {
  center: TileCore;
  targets: CombatTarget[];
  friendlyUnits: UnitCore[];
  radius: number;
  priority: number;
}

/**
 * Represents a granular tactical AI that handles combat encounters
 * and coordinates unit positioning and target selection.
 */
export class MilitaryTacticalAI extends AISystem {
  private combatZones: CombatZone[] = [];
  private unitAssignments = new Map<number, CombatZone>();
  private orders: AiOrder[] = [];

  /**
   * Main planning method for tactical AI
   */
  *plan(): Generator<AiOrder> {
    this.orders = [];

    // Only process if we have military units
    const militaryUnits = this.player.units.filter(
      (unit) => unit.isMilitary && unit.parent === null,
    );

    if (militaryUnits.length === 0) {
      return this.orders;
    }

    // Identify combat zones
    this.identifyCombatZones();

    // Assign units to combat zones
    this.assignUnitsToCombatZones(militaryUnits);

    // Plan combat operations
    this.planCombatOperations();

    yield* this.orders;
  }

  /**
   * Identify areas with enemy units or cities that represent combat zones
   */
  private identifyCombatZones() {
    this.combatZones = [];

    const visitedEnemyTiles = new Set<TileCore>();

    // Find all enemy units and cities
    for (const player of this.player.game.players) {
      if (player === this.player) continue;

      // Skip if not at war or if this player isn't visible
      if (!this.player.isEnemyWith(player)) continue;

      // Process enemy units
      for (const unit of player.units) {
        if (visitedEnemyTiles.has(unit.tile)) continue;
        visitedEnemyTiles.add(unit.tile);

        // Create combat zone around this enemy unit
        this.createCombatZone(unit.tile, player);
      }

      // Process enemy cities
      for (const city of player.cities) {
        if (visitedEnemyTiles.has(city.tile)) continue;
        visitedEnemyTiles.add(city.tile);

        // Create combat zone around this enemy city
        this.createCombatZone(city.tile, player);
      }
    }

    // Sort combat zones by priority
    this.combatZones.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Create a combat zone around an enemy location
   */
  private createCombatZone(centerTile: TileCore, enemyPlayer: PlayerCore) {
    // Get all tiles in range
    const radius = 3;
    const tilesInZone = Array.from(centerTile.getTilesInRange(radius));

    // Gather enemy targets in this zone
    const targets: CombatTarget[] = [];

    // Check all tiles in the zone for enemy units
    for (const tile of tilesInZone) {
      for (const unit of tile.units) {
        if (unit.player === enemyPlayer) {
          const target = this.evaluateTarget(unit);
          targets.push(target);
        }
      }
    }

    // Gather friendly units in this zone
    const friendlyUnits = tilesInZone
      .flatMap((tile) => tile.units)
      .filter((unit) => unit.player === this.player && unit.isMilitary);

    // Calculate priority based on strategic value
    const cityValue = centerTile.city
      ? centerTile.city.population.total * 20
      : 0;
    const unitValue = targets.reduce((sum, target) => sum + target.priority, 0);
    const resourceValue = centerTile.resource ? 50 : 0;

    // Strategic location value
    const strategicValue = centerTile.isWater ? 10 : 30;

    // Calculate overall zone priority
    const priority = cityValue + unitValue + resourceValue + strategicValue;

    // Create the combat zone
    this.combatZones.push({
      center: centerTile,
      targets,
      friendlyUnits,
      radius,
      priority,
    });
  }

  /**
   * Evaluate an enemy unit as a potential target
   */
  private evaluateTarget(unit: UnitCore): CombatTarget {
    const tile = unit.tile;

    // Base attack value on unit strength
    const attackValue = unit.definition.strength;

    // Defensive value based on unit strength and tile defensive bonus
    const defensiveValue =
      unit.definition.strength * (1 + (getTileDefenseBonus(tile) || 0));

    // Priority calculation
    let priority = unit.definition.strength;

    // Increase priority for wounded units
    if (unit.health < 100) {
      priority += (100 - unit.health) / 2;
    }

    // Increase priority for certain unit types
    if (unit.isSettler) {
      priority += 100; // Settler units are the highest priority targets
    }

    // Estimate combat results (placeholder values)
    const estimatedDamage = 20;
    const estimatedRetaliationDamage = 10;

    return {
      unit,
      tile,
      attackValue,
      defensiveValue,
      priority,
      estimatedDamage,
      estimatedRetaliationDamage,
    };
  }

  /**
   * Assign military units to combat zones
   */
  private assignUnitsToCombatZones(militaryUnits: UnitCore[]) {
    this.unitAssignments.clear();

    // Create copies of arrays to work with
    const availableUnits = [...militaryUnits];
    const pendingZones = [...this.combatZones];

    // First pass: assign units already in combat zones
    for (const zone of pendingZones) {
      for (let i = availableUnits.length - 1; i >= 0; i--) {
        const unit = availableUnits[i];
        const distance = unit.tile.getDistanceTo(zone.center);

        if (distance <= zone.radius) {
          this.unitAssignments.set(unit.id, zone);
          availableUnits.splice(i, 1);
        }
      }
    }

    // Second pass: assign remaining units to closest zones
    for (const unit of availableUnits) {
      let bestZone: CombatZone | null = null;
      let bestScore = -Infinity;

      for (const zone of pendingZones) {
        const distance = unit.tile.getDistanceTo(zone.center);
        const unitNeeded = Math.max(
          0,
          zone.targets.length - zone.friendlyUnits.length,
        );

        // Score based on priority and distance
        const score =
          (zone.priority / Math.max(1, distance)) * (unitNeeded > 0 ? 2 : 1);

        if (score > bestScore) {
          bestScore = score;
          bestZone = zone;
        }
      }

      if (bestZone) {
        this.unitAssignments.set(unit.id, bestZone);
      }
    }
  }

  /**
   * Plan combat operations for assigned units
   */
  private planCombatOperations() {
    // Process each military unit that has been assigned to a combat zone
    for (const [unitId, zone] of this.unitAssignments.entries()) {
      // Get player unit if it still exists
      const unit = this.player.units.find((u) => u.id === unitId);
      if (!unit) continue;

      // Find best target in this zone
      const target = this.findBestTarget(unit, zone);

      if (target) {
        // Plan attack operation
        this.orders.push({
          group: "unit",
          entityId: unit.id,
          focus: "military",
          priority: 150,
          perform: () => {
            unit.path = findPath(unit, target.tile);
          },
        });
      } else {
        // Move toward zone center for defensive positioning
        this.orders.push({
          group: "unit",
          entityId: unit.id,
          focus: "military",
          priority: 100,
          perform: () => {
            // Find optimal defensive position
            const defensivePosition = this.findDefensivePosition(unit, zone);
            if (defensivePosition && defensivePosition !== unit.tile) {
              unit.path = findPath(unit, defensivePosition);
            }
          },
        });
      }
    }
  }

  /**
   * Find the best target for a unit in a combat zone
   */
  private findBestTarget(
    unit: UnitCore,
    zone: CombatZone,
  ): CombatTarget | null {
    // Filter targets that this unit can potentially attack
    const potentialTargets = zone.targets.filter((target) => {
      // Land units can't attack naval units in water and vice versa
      if (unit.isLand && target.tile.isWater && !isCoastal(target.tile)) {
        return false;
      }
      if (unit.isNaval && !target.tile.isWater && !isCoastal(target.tile)) {
        return false;
      }
      return true;
    });

    if (potentialTargets.length === 0) return null;

    // Calculate scores for each target
    const targetScores = potentialTargets.map((target) => {
      // Base score on target priority
      let score = target.priority;

      // Adjust score based on distance
      const distance = unit.tile.getDistanceTo(target.tile);
      score = score / Math.max(1, distance);

      // Adjust score based on estimated combat results
      const combatResult = estimateCombatResult(unit, target.unit);
      score *= combatResult.attackerWins ? 1.5 : 0.5;

      return { target, score };
    });

    // Sort by score and return the best target
    targetScores.sort((a, b) => b.score - a.score);
    return targetScores.length > 0 ? targetScores[0].target : null;
  }

  /**
   * Find optimal defensive position for a unit in the combat zone
   */
  private findDefensivePosition(
    unit: UnitCore,
    zone: CombatZone,
  ): TileCore | null {
    // Get tiles in a smaller radius than the combat zone
    const defensiveRadius = Math.floor(zone.radius / 2);
    const potentialPositions = Array.from(
      zone.center.getTilesInRange(defensiveRadius),
    );

    // Filter to tiles the unit can move to
    const accessiblePositions = potentialPositions.filter((tile) => {
      // Check if the tile is passable for this unit
      if (unit.isLand && tile.isWater) {
        return false;
      }
      if (unit.isNaval && !tile.isWater) {
        return false;
      }

      return true;
    });

    if (accessiblePositions.length === 0) return null;

    // Score positions based on defensive value
    const positionScores = accessiblePositions.map((tile) => {
      let score = 0;

      // Higher ground is better for defense
      score += getTileDefenseBonus(tile) * 10;

      // Prefer positions closer to zone center
      const distanceToCenter = tile.getDistanceTo(zone.center);
      score += (defensiveRadius - distanceToCenter) * 5;

      // Prefer positions that can attack more targets
      const targetsInRange = zone.targets.filter(
        (target) => tile.getDistanceTo(target.tile) <= 1, // Use standard range of 1 since range not in defs
      );
      score += targetsInRange.length * 20;

      return { tile, score };
    });

    // Sort by score and return the best position
    positionScores.sort((a, b) => b.score - a.score);
    return positionScores.length > 0 ? positionScores[0].tile : null;
  }
}
