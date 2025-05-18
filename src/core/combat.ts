import {
  BattleResult,
  CombatModifier,
  CombatModifierType,
  LandForm,
} from "@/shared";
import { CityDefense } from "./city/cityDefense";
import { collector } from "./collector";
import { TileCore } from "./tile";
import { UnitCore } from "./unit";

export type Combatant = UnitCore | CityDefense;

export type CombatSimulationSide = {
  damage: number;
  strength: number;
  modifiers: CombatModifier[];
  combatant: Combatant;
};

export type CombatSimulation = {
  attacker: CombatSimulationSide;
  defender: CombatSimulationSide;
};

// Returns true if the unit can move to the tile
export function attack(unit: UnitCore, tile: TileCore): boolean {
  const simulation = simulateCombat(unit, tile);

  if (simulation) {
    unit.actionPointsLeft = Math.max(unit.actionPointsLeft - 3, 0);
    const battleResult = executeSimulation(simulation);
    if (battleResult !== BattleResult.victory) {
      return false;
    }

    const anotherEnemyUnit = tile.getBestEnemyMilitaryUnit(unit);
    if (anotherEnemyUnit) {
      return false;
    }
  }

  const enemyCity = tile.city?.player !== unit.player ? tile.city : null;
  if (enemyCity && enemyCity.defense.health > 0) {
    return false;
  }

  const enemyCivilianUnits = tile.units.filter((u) => u.player !== unit.player);
  for (const enemyCivilian of enemyCivilianUnits) {
    // TODO implement slaves
    enemyCivilian.destroy();
  }

  if (enemyCity) {
    enemyCity.changeOwner(unit.player);
  }

  return true;
}

function executeSimulation(sim: CombatSimulation): BattleResult {
  sim.attacker.combatant.health -= sim.attacker.damage;
  sim.defender.combatant.health -= sim.defender.damage;

  if (sim.attacker.combatant.health > 0) {
    if (sim.attacker.combatant instanceof UnitCore) {
      collector.units.add(sim.attacker.combatant);
    }
    if (sim.attacker.combatant instanceof CityDefense) {
      collector.cities.add(sim.attacker.combatant.city);
    }
  }

  if (sim.defender.combatant.health > 0) {
    if (sim.defender.combatant instanceof UnitCore) {
      collector.units.add(sim.defender.combatant);
    }
    if (sim.defender.combatant instanceof CityDefense) {
      collector.cities.add(sim.defender.combatant.city);
    }
  }

  if (sim.attacker.combatant.health <= 0) {
    if (sim.attacker.combatant instanceof UnitCore) {
      sim.attacker.combatant.destroy();
    }
    return BattleResult.defeat;
  }

  if (sim.defender.combatant.health <= 0) {
    if (sim.defender.combatant instanceof UnitCore) {
      sim.defender.combatant.destroy();
    }
    return BattleResult.victory;
  }

  return BattleResult.undecided;
}

export function simulateCombat(
  unit: UnitCore,
  tile: TileCore,
): CombatSimulation | null {
  const enemyUnit = tile.getEnemyUnit(unit);

  if (enemyUnit) {
    return simulateCombatants(unit, enemyUnit);
  }

  if (
    tile.city &&
    tile.city.player !== unit.player &&
    tile.city.defense.health > 0
  ) {
    return simulateCombatants(unit, tile.city.defense);
  }

  return null;
}

function simulateCombatants(
  attacker: Combatant,
  defender: Combatant,
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
    attacker.strength *
    attackerModifiers.reduce((total, bonus) => total + bonus.value, 1);

  const defenderStrength =
    defender.strength *
    defenderModifiers.reduce((total, bonus) => total + bonus.value, 1);

  return {
    attacker: {
      strength: attackerStrength,
      modifiers: attackerModifiers,
      damage: getDamage(defenderStrength, attackerStrength),
      combatant: attacker,
    },
    defender: {
      strength: defenderStrength,
      modifiers: defenderModifiers,
      damage: getDamage(attackerStrength, defenderStrength),
      combatant: defender,
    },
  };
}

function getUnitModifiers(unit: Combatant): CombatModifier[] {
  const modifiers: CombatModifier[] = [];
  if (unit.health < unit.maxHealth) {
    modifiers.push({
      type: CombatModifierType.health,
      value: (unit.health - unit.maxHealth) / (unit.maxHealth * 2),
    });
  }

  return modifiers;
}

function getAttackerModifiers(
  attacker: Combatant,
  defender: Combatant,
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
  attacker: Combatant,
  defender: Combatant,
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

  if (defender.tile.city && !(defender instanceof CityDefense)) {
    modifiers.push({
      type: CombatModifierType.city,
      value: defender.tile.city.defense.unitsDefenseBonus,
    });
  }

  return modifiers;
}

export function getDamage(strengthA: number, strengthB: number): number {
  const ratio = strengthA / strengthB;
  const modifier = Math.pow(ratio, 1.2);
  return Math.max(0, Math.min(100, Math.round(30 * modifier)));
}

function getFlanks(unit: Combatant, enemy: Combatant) {
  return (
    enemy.tile.neighbours.filter(
      (tile) =>
        !!tile.units.find(
          (u) => u.player === unit.player && u.definition.strength,
        ),
    ).length - 1
  );
}
