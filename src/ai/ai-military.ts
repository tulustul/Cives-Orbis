import { LandForm, UnitTrait, UnitType } from "@/shared";
import { CityCore } from "@/core/city";
import { UnitDefinition } from "@/core/data/types";
import { findPath } from "@/core/pathfinding";
import { PlayerCore } from "@/core/player";
import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { SeaLevel } from "@/shared";
import { AISystem } from "./ai-system";
import { dataManager } from "@/core/data/dataManager";
import { simulateCombat } from "@/core/combat";

type AttackTarget = {
  score: number;
  difficulty: number;
  attractiveness: number;
  forcesRequired: {
    land: number;
    naval: number;
  };
  tile: TileCore;
  isCityTarget: boolean;
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
  threatLevel: number;
};

type UnitTask = {
  tile: TileCore;
  priority: number;
};

type AssignedUnitTask = UnitTask & {
  unit: UnitCore;
};

enum ArmyState {
  FORMING = "forming",
  GATHERING = "gathering",
  MARCHING = "marching",
  ATTACKING = "attacking",
  DISBANDED = "disbanded",
}

enum UnitRole {
  FRONTLINE = "frontline",
  RANGED = "ranged",
  SIEGE = "siege",
  SUPPORT = "support",
  SCOUT = "scout",
}

type ArmyUnit = {
  unit: UnitCore;
  role: UnitRole;
  position?: TileCore; // Desired tactical position
};

type Army = {
  id: number;
  units: ArmyUnit[];
  target: TileCore;
  gatheringPoint: TileCore;
  requiredSize: number;
  currentSize: number;
  state: ArmyState;
  power: number;
  targetDifficulty: number;
  readiness: number; // 0-100, indicates how ready the army is to attack
};

export class MilitaryAI extends AISystem {
  private MAX_UNITS_PER_CITY = 10;
  private MIN_ARMY_SIZE = 3;
  private ARMY_READINESS_THRESHOLD = 70;

  private PRIORITY = {
    RETREAT_INJURED: 600,
    CITY_DEFENSE: 300,
    ARMY_GATHERING: 250,
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
  private nextArmyId = 1;

  plan() {
    this.operations = [];

    this.enemyPlayers = this.player.game.players.filter((p) =>
      this.player.isEnemyWith(p),
    );

    this.preprocessUnits();
    this.updateArmies();
    this.findPotentialDefenses();
    this.findPotentialTargets();
    this.updateAssignedDefenses();
    this.validateAssignedTasks();

    // Process retreating injured units first
    this.handleInjuredUnits();

    // Defense is highest priority
    this.assignDefenses();

    // Manage armies - formation, gathering, and attacking
    this.manageArmies();

    // Any remaining units get assigned to individual attack tasks
    this.assignAttackTargets();

    // Schedule unit production
    this.scheduleUnitProduction();

    // Process all tasks
    this.processTasks();

    return this.operations;
  }

  /* ARMY MANAGEMENT */

  private updateArmies() {
    // Update existing armies
    this.armies = this.armies.filter((army) => {
      // Count valid units in the army
      const validUnits = army.units.filter(
        (u) => u.unit.health > 0 && !u.unit.parent,
      );

      // Update army size and power
      army.units = validUnits;
      army.currentSize = validUnits.length;
      army.power = validUnits.reduce(
        (sum, u) => sum + u.unit.definition.strength,
        0,
      );

      // Disband army if too small
      if (army.currentSize < Math.max(2, Math.floor(army.requiredSize / 2))) {
        return false;
      }

      // Update army readiness
      army.readiness = this.calculateArmyReadiness(army);

      // Update army state
      this.updateArmyState(army);

      return army.state !== ArmyState.DISBANDED;
    });
  }

  private calculateArmyReadiness(army: Army): number {
    // Factors affecting readiness:
    // 1. Percentage of required units gathered
    const sizeReadiness = (army.currentSize / army.requiredSize) * 100;

    // 2. Health of units
    const avgHealth =
      army.units.reduce((sum, u) => sum + u.unit.health, 0) / army.currentSize;

    // 3. Distance to gathering point
    const avgDistance =
      army.units.reduce((sum, u) => {
        const distance = u.unit.tile.getDistanceTo(army.gatheringPoint);
        return sum + distance;
      }, 0) / army.currentSize;

    const distanceReadiness = Math.max(0, 100 - avgDistance * 10);

    // 4. Power relative to target difficulty
    const powerRatio =
      army.targetDifficulty > 0
        ? (army.power / army.targetDifficulty) * 100
        : 100;

    // Weighted average of factors
    return Math.min(
      100,
      sizeReadiness * 0.4 +
        avgHealth * 0.3 +
        distanceReadiness * 0.1 +
        powerRatio * 0.2,
    );
  }

  private updateArmyState(army: Army) {
    switch (army.state) {
      case ArmyState.FORMING:
        // If we have enough units, move to gathering
        if (
          army.currentSize >= Math.max(1, Math.floor(army.requiredSize * 0.7))
        ) {
          army.state = ArmyState.GATHERING;
        }
        break;

      case ArmyState.GATHERING:
        // Check if units have gathered
        const allUnitsNearGatheringPoint = army.units.every(
          (u) => u.unit.tile.getDistanceTo(army.gatheringPoint) <= 2,
        );

        if (allUnitsNearGatheringPoint) {
          // If readiness is high enough, move to attack phase
          if (army.readiness >= this.ARMY_READINESS_THRESHOLD) {
            army.state = ArmyState.MARCHING;
          }
        }
        break;

      case ArmyState.MARCHING:
        // Check if army has reached target
        const avgDistanceToTarget =
          army.units.reduce(
            (sum, u) => sum + u.unit.tile.getDistanceTo(army.target),
            0,
          ) / army.currentSize;

        if (avgDistanceToTarget <= 3) {
          army.state = ArmyState.ATTACKING;
        }
        break;

      case ArmyState.ATTACKING:
        // Check if target has been captured or destroyed
        if (!this.isValidAttackTarget(army.target)) {
          army.state = ArmyState.DISBANDED;
        }

        // Or if army is too weak to continue
        if (army.readiness < 30) {
          army.state = ArmyState.DISBANDED;
        }
        break;
    }
  }

  private isValidAttackTarget(tile: TileCore): boolean {
    // Check if target still exists and is an enemy
    if (tile.city && !this.player.isEnemyWith(tile.city.player)) {
      return false;
    }

    // Check if there are still enemy units
    const hasEnemyUnits = tile.units.some((u) =>
      this.player.isEnemyWith(u.player),
    );

    return !!tile.city || hasEnemyUnits;
  }

  private manageArmies() {
    // Create new armies if needed
    this.createNewArmies();

    // Handle each army based on its state
    for (const army of this.armies) {
      switch (army.state) {
        case ArmyState.FORMING:
          this.assignUnitsToArmy(army);
          break;

        case ArmyState.GATHERING:
          this.manageArmyGathering(army);
          break;

        case ArmyState.MARCHING:
          this.manageArmyMarching(army);
          break;

        case ArmyState.ATTACKING:
          this.manageArmyAttacking(army);
          break;
      }
    }
  }

  private createNewArmies() {
    // Don't create too many armies
    if (this.armies.length >= Math.ceil(this.player.cities.length / 2)) {
      return;
    }

    // Only create new armies if we have enough unassigned units
    if (this.unassignedMilitaryUnits.length < this.MIN_ARMY_SIZE) {
      return;
    }

    // Find a suitable target for a new army
    const targets = [...this.potentialTargets]
      .filter((t) => t.isCityTarget)
      .sort((a, b) => b.score - a.score);

    if (targets.length === 0) return;

    // Get the highest priority target
    const target = targets[0];

    // Find a suitable gathering point (a friendly city near the target)
    let gatheringPoint: TileCore | null = null;
    let shortestDistance = Infinity;

    for (const city of this.player.cities) {
      const distance = city.tile.getDistanceTo(target.tile);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        gatheringPoint = city.tile;
      }
    }

    // If no gathering point found, use the closest unassigned unit's position
    if (!gatheringPoint && this.unassignedMilitaryUnits.length > 0) {
      let closestUnit = this.unassignedMilitaryUnits[0];
      shortestDistance = closestUnit.tile.getDistanceTo(target.tile);

      for (let i = 1; i < this.unassignedMilitaryUnits.length; i++) {
        const unit = this.unassignedMilitaryUnits[i];
        const distance = unit.tile.getDistanceTo(target.tile);
        if (distance < shortestDistance) {
          shortestDistance = distance;
          closestUnit = unit;
        }
      }

      gatheringPoint = closestUnit.tile;
    }

    if (!gatheringPoint) return;

    // Create new army
    const newArmy: Army = {
      id: this.nextArmyId++,
      units: [],
      target: target.tile,
      gatheringPoint,
      requiredSize: Math.ceil(target.difficulty / 10),
      currentSize: 0,
      state: ArmyState.FORMING,
      power: 0,
      targetDifficulty: target.difficulty,
      readiness: 0,
    };

    this.armies.push(newArmy);
  }

  private assignUnitsToArmy(army: Army) {
    // Don't recruit more units if we've reached the required size
    if (army.currentSize >= army.requiredSize) {
      return;
    }

    // Find suitable units for this army
    const unitsForArmy: UnitCore[] = [];

    for (let i = this.unassignedMilitaryUnits.length - 1; i >= 0; i--) {
      const unit = this.unassignedMilitaryUnits[i];

      // Only assign land units to land armies
      if (unit.definition.type !== UnitType.land) {
        continue;
      }

      // Calculate unit's suitability for this army
      const distance = unit.tile.getDistanceTo(army.gatheringPoint);

      // Skip units that are too far away
      if (distance > 15) {
        continue;
      }

      // Add unit to army
      unitsForArmy.push(unit);
      this.unassignedMilitaryUnits.splice(i, 1);

      // Stop once we've reached the required size
      if (unitsForArmy.length + army.currentSize >= army.requiredSize) {
        break;
      }
    }

    // Add units to the army
    for (const unit of unitsForArmy) {
      army.units.push({
        unit,
        role: this.determineUnitRole(unit),
      });
    }

    // Update army size and power
    army.currentSize = army.units.length;
    army.power = army.units.reduce(
      (sum, u) => sum + u.unit.definition.strength,
      0,
    );
  }

  private determineUnitRole(unit: UnitCore): UnitRole {
    // In a real implementation, this would consider unit type, promotions, and capabilities
    if (unit.definition.actionPoints && unit.definition.actionPoints > 1) {
      return UnitRole.RANGED;
    }

    return UnitRole.FRONTLINE;
  }

  private manageArmyGathering(army: Army) {
    for (const armyUnit of army.units) {
      const unit = armyUnit.unit;

      // Skip units already at gathering point
      if (unit.tile === army.gatheringPoint) {
        continue;
      }

      // Move unit to gathering point
      this.operations.push({
        group: "unit",
        entityId: unit.id,
        focus: "military",
        priority: this.PRIORITY.ARMY_GATHERING,
        perform: () => {
          unit.path = findPath(unit, army.gatheringPoint);
        },
      });
    }
  }

  private manageArmyMarching(army: Army) {
    // Calculate tactical positions for each unit
    this.assignTacticalPositions(army);

    for (const armyUnit of army.units) {
      const unit = armyUnit.unit;
      const position = armyUnit.position || army.target;

      // Move unit to its tactical position
      this.operations.push({
        group: "unit",
        entityId: unit.id,
        focus: "military",
        priority: this.PRIORITY.CITY_INVASION,
        perform: () => {
          unit.path = findPath(unit, position);
        },
      });
    }
  }

  private manageArmyAttacking(army: Army) {
    // Reassign tactical positions based on current situation
    this.assignTacticalPositions(army);

    for (const armyUnit of army.units) {
      const unit = armyUnit.unit;
      const position = armyUnit.position;

      // Find attackable enemy units
      const attackableEnemies = unit.tile.neighbours
        .flatMap((tile) => tile.units)
        .filter((u) => this.player.isEnemyWith(u.player));

      if (attackableEnemies.length > 0) {
        // Sort enemies by priority
        attackableEnemies.sort((a, b) => {
          // Prioritize low health units
          const healthDiff = a.health - b.health;
          if (Math.abs(healthDiff) > 20) return healthDiff;

          // Otherwise prioritize by strength
          return a.definition.strength - b.definition.strength;
        });

        // Attack highest priority enemy
        const target = attackableEnemies[0];

        this.operations.push({
          group: "unit",
          entityId: unit.id,
          focus: "military",
          priority: this.PRIORITY.CITY_INVASION + 50,
          perform: () => {
            unit.path = findPath(unit, target.tile);
          },
        });
      } else if (position) {
        // Move to tactical position
        this.operations.push({
          group: "unit",
          entityId: unit.id,
          focus: "military",
          priority: this.PRIORITY.CITY_INVASION,
          perform: () => {
            unit.path = findPath(unit, position);
          },
        });
      }
    }
  }

  private assignTacticalPositions(army: Army) {
    const target = army.target;

    // Get tiles around the target
    const surroundingTiles = target.neighbours.filter((tile) => {
      // Ensure tile is passable
      return tile.passableArea === target.passableArea;
    });

    if (surroundingTiles.length === 0) return;

    // Assign frontline units to surrounding tiles
    const frontlineUnits = army.units.filter(
      (u) => u.role === UnitRole.FRONTLINE,
    );
    const rangedUnits = army.units.filter((u) => u.role === UnitRole.RANGED);

    // Assign frontline units to tiles adjacent to target
    for (let i = 0; i < frontlineUnits.length; i++) {
      const unit = frontlineUnits[i];
      const tileIndex = i % surroundingTiles.length;
      unit.position = surroundingTiles[tileIndex];
    }

    // Assign ranged units to tiles behind the frontline
    for (const unit of rangedUnits) {
      // Find suitable tile for ranged unit
      let bestTile: TileCore | null = null;
      let bestScore = -Infinity;

      for (const frontlineUnit of frontlineUnits) {
        if (!frontlineUnit.position) continue;

        for (const tile of frontlineUnit.position.neighbours) {
          // Skip if tile is not passable
          if (tile.passableArea !== frontlineUnit.position.passableArea)
            continue;

          // Skip if tile is adjacent to target
          if (tile.neighbours.includes(target)) continue;

          // Score based on distance to target
          const distanceToTarget = tile.getDistanceTo(target);
          let score = unit.unit.definition.actionPoints! - distanceToTarget;

          // Prefer tiles with good defense
          if (tile.landForm === LandForm.hills) {
            score += 2;
          }

          if (score > bestScore) {
            bestScore = score;
            bestTile = tile;
          }
        }
      }

      if (bestTile) {
        unit.position = bestTile;
      }
    }
  }

  /* UNIT TASKS */

  private handleInjuredUnits() {
    const injuredUnits = this.unassignedMilitaryUnits.filter(
      (unit) => unit.health < 30 && unit.order !== "go",
    );

    for (const unit of injuredUnits) {
      // Find the closest friendly city to retreat to
      const retreatCity = this.findClosestFriendlyCity(unit.tile);

      if (retreatCity) {
        this.operations.push({
          group: "unit",
          entityId: unit.id,
          focus: "military",
          priority: this.PRIORITY.RETREAT_INJURED,
          perform: () => {
            unit.path = findPath(unit, retreatCity.tile);
          },
        });

        // Remove this unit from consideration for other tasks
        const index = this.unassignedMilitaryUnits.indexOf(unit);
        if (index > -1) {
          this.unassignedMilitaryUnits.splice(index, 1);
        }
      }
    }
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
      for (const armyUnit of army.units) {
        assignedUnits.add(armyUnit.unit);
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
    const landProductionPriority = Math.round(
      (this.player.cities.length / Math.max(1, this.landUnits.length)) * 100,
    );

    // Schedule production of new military units if needed
    for (const city of this.player.citiesWithoutProduction) {
      const unitDef = this.chooseUnitDef(city, UnitType.land);
      if (unitDef) {
        this.operations.push({
          group: "city-produce",
          entityId: city.id,
          focus: "military",
          priority: landProductionPriority,
          perform: () => {
            city.production.produce(unitDef);
          },
        });
      }
    }

    const navalProductionPriority = Math.round(
      (this.player.cities.length / Math.max(1, this.navalUnits.length)) * 70,
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
          priority: navalProductionPriority,
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
      let nearbyEnemyUnits = 0;

      for (const tile of city.tile.getTilesInRange(5)) {
        const enemyUnitsOnTile = tile.units.filter((u) =>
          u.player.isEnemyWith(this.player),
        );

        nearbyEnemyUnits += enemyUnitsOnTile.length;

        // Calculate threat power based on unit strength and distance
        const distance = tile.getDistanceTo(city.tile);
        const distanceFactor = 1 + (5 - distance) * 0.2; // Units closer to city are more threatening

        threatPower += enemyUnitsOnTile.reduce(
          (acc, u) => acc + u.definition.strength * distanceFactor,
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
        threatLevel: threatPower,
      });
    }

    // Add border defense points
    this.addBorderDefensePoints();

    this.unfulfilledDefenses = this.potentialDefenses.filter(
      (defense) =>
        defense.forcesRequired.land > defense.forcesAssigned.land ||
        defense.forcesRequired.naval > defense.forcesAssigned.naval,
    );
  }

  private addBorderDefensePoints() {
    // Get all tiles owned by the player
    const ownedTiles = new Set<TileCore>();
    for (const city of this.player.cities) {
      for (const tile of city.expansion.tiles) {
        ownedTiles.add(tile);
      }
    }

    // Find border tiles
    const borderTiles = Array.from(ownedTiles).filter((tile) => {
      // A border tile has at least one adjacent tile that isn't owned by the player
      return tile.neighbours.some((neighbor) => !ownedTiles.has(neighbor));
    });

    // Group border tiles into defense zones
    const borderGroups: TileCore[][] = [];
    const processedTiles = new Set<TileCore>();

    for (const tile of borderTiles) {
      if (processedTiles.has(tile)) continue;

      // Start a new group with this tile
      const group: TileCore[] = [tile];
      processedTiles.add(tile);

      // Add adjacent border tiles to this group
      let i = 0;
      while (i < group.length) {
        const currentTile = group[i];

        for (const neighbor of currentTile.neighbours) {
          if (borderTiles.includes(neighbor) && !processedTiles.has(neighbor)) {
            group.push(neighbor);
            processedTiles.add(neighbor);
          }
        }

        i++;
      }

      borderGroups.push(group);
    }

    // Create defense targets for each border group
    for (const group of borderGroups) {
      if (group.length < 3) continue; // Ignore very small borders

      // Find central tile in this group
      let centralTile = group[0];
      let maxBorderNeighbors = 0;

      for (const tile of group) {
        const borderNeighbors = tile.neighbours.filter((n) =>
          group.includes(n),
        ).length;
        if (borderNeighbors > maxBorderNeighbors) {
          maxBorderNeighbors = borderNeighbors;
          centralTile = tile;
        }
      }

      // Calculate threat level
      let threatLevel = 0;
      for (const tile of centralTile.getTilesInRange(3)) {
        if (!ownedTiles.has(tile)) {
          threatLevel += tile.units.reduce(
            (acc, u) =>
              acc +
              (u.player.isEnemyWith(this.player) ? u.definition.strength : 0),
            0,
          );
        }
      }

      // Adjust forces based on size of border and threat level
      const borderSize = group.length;
      const requiredForces = Math.max(
        5,
        Math.min(20, Math.floor(borderSize / 2 + threatLevel / 5)),
      );

      this.potentialDefenses.push({
        tile: centralTile,
        forcesRequired: {
          land: requiredForces,
          naval: centralTile.coast ? Math.floor(requiredForces / 2) : 0,
        },
        forcesAssigned: {
          land: 0,
          naval: 0,
        },
        threatLevel,
      });
    }
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
        score: attractiveness / (difficulty || 1),
        attractiveness,
        difficulty,
        tile: city.tile,
        forcesRequired: {
          land: difficulty * 2 + 5,
          naval: 0,
        },
        isCityTarget: true,
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
        isCityTarget: false,
      });
    }
  }

  private assignDefenses() {
    // Sort defense targets by threat level
    this.unfulfilledDefenses.sort((a, b) => b.threatLevel - a.threatLevel);

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

      // Score based on threat level, distance, and how much more force is needed
      const forceNeeded =
        unit.definition.type === UnitType.land
          ? defense.forcesRequired.land - defense.forcesAssigned.land
          : defense.forcesRequired.naval - defense.forcesAssigned.naval;

      const score =
        (defense.threatLevel * 2 + forceNeeded * 5) / (distance + 1);

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

      // Skip city targets unless we have a really strong unit
      if (target.isCityTarget && unit.definition.strength < 10) {
        continue;
      }

      const distance = unit.tile.getDistanceTo(target.tile);

      // For city targets, prefer to wait for army
      let score = target.isCityTarget
        ? target.score / 2 - distance
        : target.score * 2 - distance;

      // Adjust score based on combat odds
      if (target.tile.units.length > 0) {
        const enemyUnit = target.tile.units[0];
        const combatResult = simulateCombat(unit, enemyUnit);
        if (combatResult) {
          score *=
            combatResult.attacker.damage > combatResult.defender.damage
              ? 2
              : 0.5;
        }
      }

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
          // Check if we're already at the destination
          if (task.unit.tile === task.tile) {
            return;
          }

          task.unit.path = findPath(task.unit, task.tile);
        },
      });
    }
  }

  private findClosestFriendlyCity(fromTile: TileCore): CityCore | null {
    if (this.player.cities.length === 0) {
      return null;
    }

    let closestCity = this.player.cities[0];
    let closestDistance = fromTile.getDistanceTo(closestCity.tile);

    for (let i = 1; i < this.player.cities.length; i++) {
      const city = this.player.cities[i];
      const distance = fromTile.getDistanceTo(city.tile);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestCity = city;
      }
    }

    return closestCity;
  }

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
