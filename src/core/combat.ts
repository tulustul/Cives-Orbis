import {
  BattleResult,
  CombatModifier,
  CombatModifierType,
  LandForm,
} from "@/shared";
import { CityCore } from "./city";
import { CityDefense } from "./city/cityDefense";
import { collector } from "./collector";
import { TileCore } from "./tile";
import { UnitCore } from "./unit";
import { UnitGroup } from "./unitGroup";

export type Combatant = UnitCore | CityDefense;

export type CombatSimulationUnitType = {
  casualties: number;
  modifiers: CombatModifier[];
  unit: UnitCore;
};

export type CombatUnitSimulationSide = {
  damage: number;
  strength: number;
  modifiers: CombatModifier[];
  combatant: UnitCore;
};

export type CombatUnitSimulation = {
  attacker: CombatUnitSimulationSide;
  defender: CombatUnitSimulationSide;
};

export type CombatCitySimulation = {
  city: CityCore;
  damage: number;
  modifiers: CombatModifier[];
};

export type CombatSimulationSide = {
  units: Map<UnitCore, CombatSimulationUnitType>;
  group: UnitGroup;
};

export type CombatSimulation = {
  attacker: CombatSimulationSide;
  defender: Map<UnitGroup, CombatSimulationSide>;
  city?: CombatCitySimulation;
};

// Returns true if the unit can move to the tile
export function attack(unit: UnitGroup, tile: TileCore): boolean {
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
  for (const attacker of sim.attacker.units.values()) {
    executeUnitSimulation(attacker);
  }
  for (const defenderGroup of sim.defender.values()) {
    for (const defender of defenderGroup.units.values()) {
      executeUnitSimulation(defender);
    }
  }

  if (sim.city) {
    // collector.cities.add(sim.defender.combatant.city);
  }

  if (sim.attacker.group.units.length === 0) {
    return BattleResult.defeat;
  }

  for (const defenderGroup of sim.defender.values()) {
    if (defenderGroup.group.units.length > 0) {
      return BattleResult.undecided;
    }
  }

  return BattleResult.victory;
}

function executeUnitSimulation(sim: CombatSimulationUnitType) {
  sim.unit.changeCount(-sim.casualties);

  if (sim.unit.count > 0) {
    collector.unitGroups.add(sim.unit.group);
  } else {
    sim.unit.destroy();
  }
}

export function simulateCombat(
  group: UnitGroup,
  tile: TileCore,
): CombatSimulation | null {
  const tempCount = new Map<UnitCore, number>();
  for (const unit of group.units) {
    tempCount.set(unit, unit.count);
  }
  for (const group of tile.units) {
    for (const unit of group.units) {
      tempCount.set(unit, unit.count);
    }
  }

  const result: CombatSimulation = {
    attacker: { group, units: new Map() },
    defender: new Map(),
  };

  for (const unit of group.units) {
    const attacker: CombatSimulationUnitType = {
      casualties: 0,
      unit: unit,
      modifiers: [],
    };
    result.attacker.units.set(unit, attacker);
    for (let i = 0; i < Math.ceil(unit.count); i++) {
      const enemyUnit = getBestEnemyUnit(unit, tile, tempCount);

      if (enemyUnit) {
        let enemyGroup = result.defender.get(enemyUnit.group);
        if (!enemyGroup) {
          enemyGroup = { group: enemyUnit.group, units: new Map() };
          result.defender.set(enemyUnit.group, enemyGroup);
        }
        let defender = enemyGroup.units.get(enemyUnit);
        if (!defender) {
          defender = {
            casualties: 0,
            unit: enemyUnit,
            modifiers: [],
          };
          enemyGroup.units.set(enemyUnit, defender);
        }
        const sim = simulateUnitsCombat(unit, enemyUnit);
        attacker.casualties += sim.attacker.damage;
        defender.casualties += sim.defender.damage;
      } else if (
        tile.city &&
        tile.city.player !== unit.player &&
        tile.city.defense.health > 0
      ) {
        // return simulateCombatants(unit, tile.city.defense);
      }
    }
  }

  return result;
}

function getBestEnemyUnit(
  unit: UnitCore,
  tile: TileCore,
  tempHp: Map<UnitCore, number>,
): UnitCore | null {
  let bestEnemy: UnitCore | null = null;
  let bestScore = -Infinity;
  for (const group of tile.units) {
    if (group.player === unit.player) {
      continue;
    }
    for (const u of group.units) {
      if (u.definition.strength) {
        const score = u.definition.strength * (tempHp.get(u) ?? 0);
        if (score > bestScore) {
          bestScore = score;
          bestEnemy = u;
        }
      }
    }
  }
  return bestEnemy;
}

function simulateUnitsCombat(
  attacker: UnitCore,
  defender: UnitCore,
): CombatUnitSimulation {
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

// function simulateCombatants(
//   attacker: Combatant,
//   defender: Combatant,
// ): CombatSimulation {
//   const attackerModifiers = [
//     ...getUnitModifiers(attacker),
//     ...getAttackerModifiers(attacker, defender),
//   ];
//   const defenderModifiers = [
//     ...getUnitModifiers(defender),
//     ...getDefenderModifiers(attacker, defender),
//   ];

//   const attackerStrength =
//     attacker.strength *
//     attackerModifiers.reduce((total, bonus) => total + bonus.value, 1);

//   const defenderStrength =
//     defender.strength *
//     defenderModifiers.reduce((total, bonus) => total + bonus.value, 1);

//   return {
//     attacker: {
//       strength: attackerStrength,
//       modifiers: attackerModifiers,
//       damage: getDamage(defenderStrength, attackerStrength),
//       combatant: attacker,
//     },
//     defender: {
//       strength: defenderStrength,
//       modifiers: defenderModifiers,
//       damage: getDamage(attackerStrength, defenderStrength),
//       combatant: defender,
//     },
//   };
// }

function getUnitModifiers(unit: UnitCore): CombatModifier[] {
  const modifiers: CombatModifier[] = [];
  if (unit.count < 1) {
    modifiers.push({
      type: CombatModifierType.health,
      value: (unit.count - 1) / 2,
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
  return Math.max(0, Math.min(1, Math.round(0.3 * modifier)));
}

function getFlanks(unit: Combatant, enemy: Combatant) {
  return (
    enemy.tile.neighbours.filter(
      (tile) =>
        !!tile.units.find((u) => u.player === unit.player && u.isMilitary),
    ).length - 1
  );
}
