import { UnitCore } from "./unit";
import { collector } from "./collector";
import { LandForm } from "../shared";
import { TileCore } from "./tile";

export enum CombatModifierType {
  hills,
  forest,
  river,
  health,
  flanks,
}

export enum BattleResult {
  victory,
  undecided,
  defeat,
}

export interface CombatModifier {
  type: CombatModifierType;
  value: number;
}

export interface CombatSimulationSide {
  damage: number;
  strength: number;
  modifiers: CombatModifier[];
}

export interface CombatSimulation {
  attacker: CombatSimulationSide;
  defender: CombatSimulationSide;
}

// Returns true if the unit can move to the tile
export function attack(unit: UnitCore, tile: TileCore): boolean {
  const enemyUnit = tile.getFirstEnemyUnit(unit);

  if (enemyUnit) {
    unit.actionPointsLeft = Math.max(unit.actionPointsLeft - 3, 0);
    const battleResult = doCombat(unit, enemyUnit);
    if (battleResult !== BattleResult.victory) {
      return false;
    }

    const anotherEnemyUnit = tile.getFirstEnemyMilitaryUnit(unit);

    if (anotherEnemyUnit) {
      return false;
    }
  }

  const enemyCivilianUnits = tile.units.filter((u) => u.player !== unit.player);
  for (const enemyCivilian of enemyCivilianUnits) {
    // TODO implement slaves
    enemyCivilian.destroy();
  }

  if (tile.city && tile.city.player !== unit.player) {
    tile.city.changeOwner(unit.player);
  }

  return true;
}

function doCombat(attacker: UnitCore, defender: UnitCore): BattleResult {
  const sim = simulateCombat(attacker, defender);

  // TODO add small random variations
  attacker.health -= sim.attacker.damage;
  defender.health -= sim.defender.damage;

  if (attacker.health > 0) {
    collector.units.add(attacker);
  }

  if (defender.health > 0) {
    collector.units.add(defender);
  }

  if (attacker.health <= 0) {
    attacker.destroy();
    return BattleResult.defeat;
  }

  if (defender.health <= 0) {
    defender.destroy();
    return BattleResult.victory;
  }

  return BattleResult.undecided;
}

export function simulateCombat(
  attacker: UnitCore,
  defender: UnitCore
): CombatSimulation {
  const attackerModifiers = [
    ...getUnitModifiers(attacker),
    ...getAttackerModifiers(attacker, defender),
  ];
  const defenderModifiers = [
    ...getUnitModifiers(defender),
    ...getDefenderModifiers(attacker, defender),
  ];

  const attackerStrength =
    attacker.definition.strength *
    attackerModifiers.reduce((total, bonus) => total + bonus.value, 1);

  const defenderStrength =
    defender.definition.strength *
    defenderModifiers.reduce((total, bonus) => total + bonus.value, 1);

  return {
    attacker: {
      strength: attackerStrength,
      modifiers: attackerModifiers,
      damage: getDamage(defenderStrength, attackerStrength),
    },
    defender: {
      strength: defenderStrength,
      modifiers: defenderModifiers,
      damage: getDamage(attackerStrength, defenderStrength),
    },
  };
}

function getUnitModifiers(unit: UnitCore): CombatModifier[] {
  const modifiers: CombatModifier[] = [];
  if (unit.health < 100) {
    modifiers.push({
      type: CombatModifierType.health,
      value: (unit.health - 100) / 200,
    });
  }

  return modifiers;
}

function getAttackerModifiers(
  attacker: UnitCore,
  defender: UnitCore
): CombatModifier[] {
  const modifiers: CombatModifier[] = [];

  const flanks = getFlanks(attacker, defender);
  if (flanks) {
    modifiers.push({
      type: CombatModifierType.flanks,
      value: flanks * 0.1,
    });
  }

  return modifiers;
}

function getDefenderModifiers(
  attacker: UnitCore,
  defender: UnitCore
): CombatModifier[] {
  const modifiers: CombatModifier[] = [];

  if (defender.tile.landForm === LandForm.hills) {
    modifiers.push({ type: CombatModifierType.hills, value: 0.3 });
  }

  if (defender.tile.forest) {
    modifiers.push({ type: CombatModifierType.forest, value: 0.2 });
  }

  const direction = defender.tile.getDirectionTo(attacker.tile);
  if (defender.tile.riverParts.includes(direction)) {
    modifiers.push({ type: CombatModifierType.river, value: 0.25 });
  }

  const flanks = getFlanks(defender, attacker);
  if (flanks) {
    modifiers.push({
      type: CombatModifierType.flanks,
      value: flanks * 0.1,
    });
  }

  return modifiers;
}

export function getDamage(strengthA: number, strengthB: number): number {
  const ratio = strengthA / strengthB;
  const modifier = Math.pow(ratio, 1.2);
  return Math.max(0, Math.min(100, Math.round(30 * modifier)));
}

function getFlanks(unit: UnitCore, enemy: UnitCore) {
  return (
    enemy.tile.neighbours.filter(
      (tile) =>
        !!tile.units.find(
          (u) => u.player === unit.player && u.definition.strength
        )
    ).length - 1
  );
}
