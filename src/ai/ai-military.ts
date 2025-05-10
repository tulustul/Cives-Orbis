import { UnitTrait, UnitType } from "@/shared";
import { CityCore } from "@/core/city";
import { UnitDefinition } from "@/core/data/types";
import { findPath } from "@/core/pathfinding";
import { PlayerCore } from "@/core/player";
import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { SeaLevel } from "@/shared";
import { AISystem } from "./ai-system";
import { dataManager } from "@/core/data/dataManager";

type AttackTarget = {
  score: number;
  difficulty: number;
  attractiveness: number;
  forcesRequired: {
    land: number;
    naval: number;
  };
  tile: TileCore;
};

type DefenseTarget = {
  tile: TileCore;
  forcesRequired: {
    land: number;
    naval: number;
  };
  forcesAssigned: {
    land: number;
    naval: number;
  };
};

type UnitTask = {
  tile: TileCore;
  priority: number;
};

type AssignedUnitTask = UnitTask & {
  unit: UnitCore;
};

type Army = {
  units: UnitCore[];
  target: TileCore;
  requiredSize: number;
  state: "gathering" | "attacking";
};

export class MilitaryAI extends AISystem {
  private MAX_UNITS_PER_CITY = 10;
  private PRIORITY = {
    RETREAT_INJURED: 600,
    CITY_DEFENSE: 300,
    CITY_INVASION: 200,
    ATTACK_NEARBY_ENEMY: 100,
  };

  private enemyPlayers: PlayerCore[] = [];

  private militaryUnits: UnitCore[] = [];
  private landUnits: UnitCore[] = [];
  private navalUnits: UnitCore[] = [];

  private unassignedMilitaryUnits: UnitCore[] = [];

  private potentialTargets: AttackTarget[] = [];
  private potentialDefenses: DefenseTarget[] = [];
  private unfulfilledDefenses: DefenseTarget[] = [];

  private assignedDefenseTasks: AssignedUnitTask[] = [];
  private assignedAttackTasks: AssignedUnitTask[] = [];
  private armies: Army[] = [];

  plan() {
    this.assignedAttackTasks = [];
    this.operations = [];

    this.enemyPlayers = this.player.game.players.filter((p) =>
      this.player.isEnemyWith(p),
    );

    this.preprocessUnits();

    this.findPotentialDefenses();

    this.findPotentialTargets();

    this.updateAssignedDefenses();

    this.validateAssignedTasks();

    this.assignDefenses();

    this.assignAttackTargets();

    this.scheduleUnitProduction();

    this.processTasks();

    // const injuredUnits = militaryUnits.filter(
    //   (unit) => unit.health < 30 && unit.order !== "go"
    // );

    // for (const unit of injuredUnits) {
    //   // Find the closest friendly city to retreat to
    //   const retreatCity = this.findClosestFriendlyCity(unit.tile);

    //   if (retreatCity) {
    //     this.operations.push({
    //       group: "unit",
    //       entityId: unit.id,
    //       focus: "military",
    //       priority: this.PRIORITY.RETREAT_INJURED,
    //       perform: () => {
    //         unit.path = findPath(unit, retreatCity.tile);
    //       },
    //     });

    //     // Remove this unit from consideration for other tasks
    //     const index = militaryUnits.indexOf(unit);
    //     if (index > -1) {
    //       militaryUnits.splice(index, 1);
    //     }
    //   }
    // }

    return this.operations;
  }

  private validateAssignedTasks() {
    const defenseByTile = new Map<TileCore, DefenseTarget>();
    for (const defense of this.potentialDefenses) {
      defenseByTile.set(defense.tile, defense);
    }

    this.assignedDefenseTasks = this.assignedDefenseTasks.filter((task) => {
      if (
        task.unit.health <= 0 ||
        (task.tile.areaOf !== null && task.tile.areaOf.player !== this.player)
      ) {
        task.unit.order = null;
        return false;
      }

      const defense = defenseByTile.get(task.tile);
      if (!defense) {
        task.unit.order = null;
        return false;
      }

      if (task.unit.definition.type === UnitType.land) {
        if (
          defense.forcesAssigned.land >=
          defense.forcesRequired.land - task.unit.definition.strength
        ) {
          task.unit.order = null;
          return false;
        }
      } else if (task.unit.definition.type === UnitType.naval) {
        if (
          defense.forcesAssigned.naval >=
          defense.forcesRequired.naval - task.unit.definition.strength
        ) {
          task.unit.order = null;
          return false;
        }
      }

      return true;
    });
  }

  private preprocessUnits() {
    const assignedUnits = new Set<UnitCore>();
    for (const task of this.assignedAttackTasks) {
      assignedUnits.add(task.unit);
    }
    for (const task of this.assignedDefenseTasks) {
      assignedUnits.add(task.unit);
    }
    for (const army of this.armies) {
      for (const unit of army.units) {
        assignedUnits.add(unit);
      }
    }

    this.militaryUnits = this.player.units.filter(
      (unit) =>
        unit.definition.trait === UnitTrait.military && unit.parent === null,
    );
    this.landUnits = this.militaryUnits.filter(
      (unit) => unit.definition.type === UnitType.land,
    );
    this.navalUnits = this.militaryUnits.filter(
      (unit) => unit.definition.type === UnitType.naval,
    );

    this.unassignedMilitaryUnits = this.militaryUnits.filter(
      (u) => !assignedUnits.has(u),
    );
  }

  private scheduleUnitProduction() {
    const landDroductionPriority = Math.round(
      (this.player.cities.length / this.landUnits.length) * 100,
    );

    // Schedule production of new military units if needed
    for (const city of this.player.citiesWithoutProduction) {
      const unitDef = this.chooseUnitDef(city, UnitType.land);
      if (unitDef) {
        this.operations.push({
          group: "city-produce",
          entityId: city.id,
          focus: "military",
          priority: landDroductionPriority,
          perform: () => {
            city.production.produce(unitDef);
          },
        });
      }
    }

    const navalDroductionPriority = Math.round(
      (this.player.cities.length / this.navalUnits.length) * 70,
    );
    // Schedule production of new military units if needed
    for (const city of this.player.citiesWithoutProduction) {
      if (city.tile.units.length >= this.MAX_UNITS_PER_CITY) {
        continue;
      }
      const unitDef = this.chooseUnitDef(city, UnitType.naval);
      if (unitDef) {
        this.operations.push({
          group: "city-produce",
          entityId: city.id,
          focus: "military",
          priority: navalDroductionPriority,
          perform: () => {
            city.production.produce(unitDef);
          },
        });
      }
    }
  }

  private chooseUnitDef(
    city: CityCore,
    unitType: UnitType,
  ): UnitDefinition | null {
    if (unitType === UnitType.land) {
      const warrior = dataManager.units.get("unit_warrior");
      if (city.production.canProduce(warrior)) {
        return warrior;
      }
    }

    if (unitType === UnitType.naval) {
      if (!city.isCoastline) {
        return null;
      }
      const navalUnit = dataManager.units.get("unit_tireme");
      if (city.production.canProduce(navalUnit)) {
        return navalUnit;
      }
    }

    return null;
  }

  private findPotentialDefenses() {
    this.potentialDefenses = [];

    for (const city of this.player.cities) {
      let threatPower = 0;

      for (const tile of city.tile.getTilesInRange(5)) {
        threatPower += tile.units.reduce(
          (acc, u) =>
            acc +
            (u.player.isEnemyWith(this.player) ? u.definition.strength : 0),
          0,
        );
      }

      this.potentialDefenses.push({
        tile: city.tile,
        forcesRequired: {
          land: 10 + Math.min(50, threatPower / 2),
          naval: city.isCoastline ? 10 : 0,
        },
        forcesAssigned: {
          land: 0,
          naval: 0,
        },
      });
    }

    this.unfulfilledDefenses = this.potentialDefenses.filter(
      (defense) =>
        defense.forcesRequired.land > defense.forcesAssigned.land ||
        defense.forcesRequired.naval > defense.forcesAssigned.naval,
    );
  }

  private findPotentialTargets() {
    this.potentialTargets = [];

    for (const enemy of this.enemyPlayers) {
      this.findEnemyCityTargets(enemy);
      this.findEnemyUnitTargets(enemy);
    }
  }

  private findEnemyCityTargets(enemy: PlayerCore) {
    for (const city of enemy.cities) {
      if (!this.player.exploredTiles.has(city.tile)) {
        continue;
      }

      const attractiveness = city.population.total * 2;
      const difficulty = city.tile.units.reduce(
        (acc, u) => acc + u.definition.strength,
        0,
      );

      this.potentialTargets.push({
        score: attractiveness / difficulty,
        attractiveness,
        difficulty,
        tile: city.tile,
        forcesRequired: {
          land: difficulty * 2 + 5,
          naval: 0,
        },
      });
    }
  }

  private findEnemyUnitTargets(enemy: PlayerCore) {
    const visitedTiles = new Set<TileCore>();
    for (const unit of enemy.units) {
      if (visitedTiles.has(unit.tile)) {
        continue;
      }
      visitedTiles.add(unit.tile);

      const difficulty = unit.tile.units.reduce(
        (acc, u) => acc + u.definition.strength,
        0,
      );

      this.potentialTargets.push({
        score: 1,
        attractiveness: 1,
        difficulty,
        tile: unit.tile,
        forcesRequired: {
          land: unit.tile.seaLevel === SeaLevel.none ? difficulty + 5 : 0,
          naval: unit.tile.seaLevel !== SeaLevel.none ? difficulty + 5 : 0,
        },
      });
    }
  }

  private assignDefenses() {
    for (const unit of this.unassignedMilitaryUnits) {
      const defense = this.findBestDefenseTarget(unit);
      if (!defense) {
        continue;
      }
      this.assignedDefenseTasks.push({
        tile: defense.tile,
        priority: this.PRIORITY.CITY_DEFENSE,
        unit,
      });

      // Remove this unit from consideration for other tasks
      const index = this.unassignedMilitaryUnits.indexOf(unit);
      if (index > -1) {
        this.unassignedMilitaryUnits.splice(index, 1);
      }
    }
  }

  private findBestDefenseTarget(unit: UnitCore): DefenseTarget | null {
    let bestTarget = null;
    let bestScore = -Infinity;

    for (const defense of this.unfulfilledDefenses) {
      if (unit.definition.type === UnitType.land) {
        if (defense.forcesRequired.land <= defense.forcesAssigned.land) {
          continue;
        }
      } else if (unit.definition.type === UnitType.naval) {
        if (defense.forcesRequired.naval <= defense.forcesAssigned.naval) {
          continue;
        }
      }

      const distance = unit.tile.getDistanceTo(defense.tile);
      const score =
        distance * (defense.forcesRequired.land / defense.forcesAssigned.land);

      if (score > bestScore) {
        bestScore = score;
        bestTarget = defense;
      }
    }

    return bestTarget;
  }

  private assignAttackTargets() {
    for (const unit of this.unassignedMilitaryUnits) {
      const target = this.findBestAttackTarget(unit);
      if (!target) {
        continue;
      }
      this.assignedAttackTasks.push({
        tile: target.tile,
        priority: this.PRIORITY.ATTACK_NEARBY_ENEMY,
        unit,
      });

      // Remove this unit from consideration for other tasks
      const index = this.unassignedMilitaryUnits.indexOf(unit);
      if (index > -1) {
        this.unassignedMilitaryUnits.splice(index, 1);
      }
    }
  }

  private findBestAttackTarget(unit: UnitCore): AttackTarget | null {
    let bestTarget = null;
    let bestScore = -Infinity;

    for (const target of this.potentialTargets) {
      if (unit.definition.type === UnitType.land) {
        if (target.forcesRequired.land <= 0) {
          continue;
        }
      } else if (unit.definition.type === UnitType.naval) {
        if (target.forcesRequired.naval <= 0) {
          continue;
        }
      }

      const distance = unit.tile.getDistanceTo(target.tile);
      const score = target.score - distance;

      if (score > bestScore) {
        bestScore = score;
        bestTarget = target;
      }
    }

    return bestTarget;
  }

  private processTasks() {
    for (const task of [
      ...this.assignedAttackTasks,
      ...this.assignedDefenseTasks,
    ]) {
      this.operations.push({
        group: "unit",
        entityId: task.unit.id,
        focus: "military",
        priority: 100,
        perform: () => {
          task.unit.path = findPath(task.unit, task.tile);
        },
      });
    }
  }

  // private findClosestFriendlyCity(fromTile: TileCore): CityCore | null {
  //   if (this.player.cities.length === 0) {
  //     return null;
  //   }

  //   let closestCity = this.player.cities[0];
  //   let closestDistance = fromTile.getDistanceTo(closestCity.tile);

  //   for (let i = 1; i < this.player.cities.length; i++) {
  //     const city = this.player.cities[i];
  //     const distance = fromTile.getDistanceTo(city.tile);

  //     if (distance < closestDistance) {
  //       closestDistance = distance;
  //       closestCity = city;
  //     }
  //   }

  //   return closestCity;
  // }

  private updateAssignedDefenses() {
    const assignedUnitsByTile = new Map<TileCore, UnitCore[]>();
    for (const task of this.assignedDefenseTasks) {
      if (!assignedUnitsByTile.has(task.tile)) {
        assignedUnitsByTile.set(task.tile, []);
      }
      assignedUnitsByTile.get(task.tile)!.push(task.unit);
    }

    for (const defense of this.potentialDefenses) {
      const assignedUnits = assignedUnitsByTile.get(defense.tile) || [];
      defense.forcesAssigned.land = assignedUnits.reduce(
        (acc, u) =>
          acc +
          (u.definition.type === UnitType.land ? u.definition.strength : 0),
        0,
      );
      defense.forcesAssigned.naval = assignedUnits.reduce(
        (acc, u) =>
          acc +
          (u.definition.type === UnitType.naval ? u.definition.strength : 0),
        0,
      );
    }
  }
}
