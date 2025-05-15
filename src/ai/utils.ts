/**
 * Utility functions for AI systems
 */

import { UnitCore } from "@/core/unit";
import { TileCore } from "@/core/tile";
import {
  Building,
  ProductDefinition,
  ResourceDefinition,
} from "@/core/data/types";
import { LandForm } from "@/shared";

/**
 * Estimates combat result between two units
 * Returns {attackerWins: boolean, attackerDamage: number, defenderDamage: number}
 */
export function estimateCombatResult(
  attacker: UnitCore,
  defender: UnitCore,
): {
  attackerWins: boolean;
  attackerDamage: number;
  defenderDamage: number;
} {
  // Basic strength comparison
  const attackerStrength = attacker.definition.strength || 1;
  const defenderStrength = defender.definition.strength || 1;

  // Factor in health
  const attackerEffectiveStrength = attackerStrength * (attacker.health / 100);
  const defenderEffectiveStrength = defenderStrength * (defender.health / 100);

  // Apply terrain defense bonuses (simplified)
  let terrainBonus = 1.0;
  if (defender.tile.landForm === LandForm.hills) terrainBonus += 0.3;
  if (defender.tile.forest) terrainBonus += 0.2;

  const defenderFinalStrength = defenderEffectiveStrength * terrainBonus;

  // Calculate damage
  const ratio = attackerEffectiveStrength / defenderFinalStrength;
  const attackerToDefenderDamage = Math.min(
    100,
    Math.round(30 * Math.pow(ratio, 1.2)),
  );
  const defenderToAttackerDamage = Math.min(
    100,
    Math.round(30 * Math.pow(1 / ratio, 0.8)),
  );

  // Predict winner (ignoring retaliation for simplicity)
  const attackerWins =
    defender.health - attackerToDefenderDamage <= 0 ||
    attackerToDefenderDamage > defenderToAttackerDamage;

  return {
    attackerWins,
    attackerDamage: defenderToAttackerDamage,
    defenderDamage: attackerToDefenderDamage,
  };
}

/**
 * Extended TileCore interface with additional helpers for AI
 */
export function isCoastal(tile: TileCore): boolean {
  return tile.neighbours.some((n) => n.isWater);
}

/**
 * Get the defense bonus of a tile
 */
export function getTileDefenseBonus(tile: TileCore): number {
  let bonus = 0;
  if (tile.landForm === LandForm.hills) bonus += 0.3;
  if (tile.forest) bonus += 0.2;
  if (tile.riverParts.length > 0) bonus += 0.25;
  return bonus;
}

/**
 * Check if a tile has freshwater
 */
export function hasFreshwater(tile: TileCore): boolean {
  return tile.riverParts.length > 0;
}

/**
 * Check if a resource is known to the player
 */
export function isResourceKnown(resource: ResourceDefinition | null): boolean {
  // Simplified - in a real implementation you would check against player knowledge
  return resource !== null;
}

/**
 * Types that are missing from the codebase
 */
export enum VictoryType {
  conquest = "conquest",
  science = "science",
  cultural = "cultural",
  economic = "economic",
}

/**
 * Building definition interface with additional properties
 */
export interface BuildingDefinition extends Building {
  cost?: { value: number };
  enables?: any[];
}
