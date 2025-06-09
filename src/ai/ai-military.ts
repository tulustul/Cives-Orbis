import { AISystem } from "./ai-system";
import { CityCore } from "@/core/city";
import { UnitCore } from "@/core/unit";
import { DefendCityTask } from "./tasks/defendCityTask";
import { FormArmyTask } from "./tasks/formArmyTask";
import { InterceptTask } from "./tasks/interceptTask";
import { AiOrder } from "./types";

interface ThreatAssessment {
  city: CityCore;
  threatLevel: number;
  nearbyEnemies: UnitCore[];
  requiredDefense: number;
}

interface TargetAssessment {
  city: CityCore;
  attractiveness: number;
  difficulty: number;
  requiredForce: number;
  distance: number;
}

export class MilitaryAI extends AISystem {
  private defenseTracker = new Map<CityCore, DefendCityTask>();
  private activeArmies = new Map<CityCore, FormArmyTask>();
  private activeIntercepts = new Set<InterceptTask>();

  private PRIORITIES = {
    CITY_DEFENSE_CRITICAL: 200,
    CITY_DEFENSE_HIGH: 150,
    CITY_DEFENSE_NORMAL: 100,
    INTERCEPT_HIGH: 120,
    INTERCEPT_NORMAL: 80,
    ARMY_FORMATION: 90,
    CITY_ATTACK: 85,
  };

  *plan(): Generator<AiOrder> {
    // Clean up completed tasks
    this.cleanupCompletedTasks();

    // Assess threats to our cities
    const threats = this.assessThreats();
    this.handleThreats(threats);

    // Look for interception opportunities
    this.handleInterceptions();

    // Assess attack opportunities
    const targets = this.assessTargets();
    this.handleOffensiveOperations(targets);

    // Request unit production if needed
    this.requestUnitProduction();

    // Yield nothing - all work is done through tasks
    return;
  }

  private cleanupCompletedTasks() {
    // Clean up defense tasks
    for (const [city, task] of this.defenseTracker) {
      if (
        task.result ||
        !city.tile.city ||
        city.tile.city.player !== this.player
      ) {
        this.defenseTracker.delete(city);
      }
    }

    // Clean up army tasks
    for (const [targetCity, task] of this.activeArmies) {
      if (task.result) {
        this.activeArmies.delete(targetCity);
      }
    }

    // Clean up intercept tasks
    for (const task of this.activeIntercepts) {
      if (task.result) {
        this.activeIntercepts.delete(task);
      }
    }
  }

  private assessThreats(): ThreatAssessment[] {
    const threats: ThreatAssessment[] = [];

    for (const city of this.player.cities) {
      let threatLevel = 0;
      const nearbyEnemies: UnitCore[] = [];

      // Check for enemies within threat range
      const threatRange = 5;
      for (const tile of city.tile.getTilesInRange(threatRange)) {
        const enemyUnits = tile.units.filter((u) =>
          this.player.isEnemyWith(u.player),
        );

        if (enemyUnits.length > 0) {
          nearbyEnemies.push(...enemyUnits);

          // Calculate threat based on distance and strength
          const distance = tile.getDistanceTo(city.tile);
          const distanceFactor = 1 + (threatRange - distance) * 0.3;

          for (const enemy of enemyUnits) {
            threatLevel += enemy.definition.strength * distanceFactor;
          }
        }
      }

      if (threatLevel > 0) {
        // Calculate required defense
        const currentDefense = city.tile.units
          .filter((u) => u.player === this.player && u.isMilitary)
          .reduce((sum, u) => sum + u.definition.strength, 0);

        const requiredDefense = Math.ceil(threatLevel * 0.8 + 10);

        threats.push({
          city,
          threatLevel,
          nearbyEnemies,
          requiredDefense: Math.max(0, requiredDefense - currentDefense),
        });
      }
    }

    // Sort by threat level (highest first)
    threats.sort((a, b) => b.threatLevel - a.threatLevel);

    return threats;
  }

  private handleThreats(threats: ThreatAssessment[]) {
    for (const threat of threats) {
      // Check if we already have a defense task for this city
      const existingTask = this.defenseTracker.get(threat.city);
      if (existingTask && !existingTask.result) {
        continue; // Task already active
      }

      // Determine priority based on threat level
      let priority = this.PRIORITIES.CITY_DEFENSE_NORMAL;
      if (threat.threatLevel > 50) {
        priority = this.PRIORITIES.CITY_DEFENSE_CRITICAL;
      } else if (threat.threatLevel > 25) {
        priority = this.PRIORITIES.CITY_DEFENSE_HIGH;
      }

      // Create defense task
      const defenseTask = new DefendCityTask(this.ai, {
        city: threat.city,
        priority,
      });

      this.ai.addRootTask(defenseTask);
      this.defenseTracker.set(threat.city, defenseTask);
    }
  }

  private handleInterceptions() {
    // Find high-value enemy units to intercept
    const interceptTargets: { unit: UnitCore; priority: number }[] = [];

    for (const player of this.player.game.players) {
      if (!this.player.isEnemyWith(player)) continue;

      for (const unit of player.units) {
        // Skip if not visible
        if (!this.player.exploredTiles.has(unit.tile)) continue;

        // Calculate intercept priority
        let priority = 0;

        // High priority for settlers
        if (unit.definition.actions.includes("foundCity")) {
          priority = 100;
        }
        // Medium priority for strong military units near our territory
        else if (unit.isMilitary) {
          const nearOurCity = this.player.cities.some(
            (city) => city.tile.getDistanceTo(unit.tile) <= 8,
          );

          if (nearOurCity) {
            priority = unit.definition.strength * 2;
          }
        }

        if (priority > 30) {
          interceptTargets.push({ unit, priority });
        }
      }
    }

    // Sort by priority
    interceptTargets.sort((a, b) => b.priority - a.priority);

    // Create intercept tasks for top targets
    const maxIntercepts = 2;
    let interceptCount = this.activeIntercepts.size;

    for (const target of interceptTargets) {
      if (interceptCount >= maxIntercepts) break;

      // Check if we're already intercepting this unit
      const alreadyIntercepting = Array.from(this.activeIntercepts).some(
        (task) => task.options.target === target.unit,
      );

      if (alreadyIntercepting) continue;

      const priority =
        target.priority > 80
          ? this.PRIORITIES.INTERCEPT_HIGH
          : this.PRIORITIES.INTERCEPT_NORMAL;

      const interceptTask = new InterceptTask(this.ai, {
        target: target.unit,
        priority,
      });

      this.ai.addRootTask(interceptTask);
      this.activeIntercepts.add(interceptTask);
      interceptCount++;
    }
  }

  private assessTargets(): TargetAssessment[] {
    const targets: TargetAssessment[] = [];

    // Find enemy cities we can attack
    for (const player of this.player.game.players) {
      if (!this.player.isEnemyWith(player)) continue;

      for (const city of player.cities) {
        // Skip if not explored
        if (!this.player.exploredTiles.has(city.tile)) {
          continue;
        }

        // Calculate attractiveness (value of capturing)
        const attractiveness =
          city.population.total * 10 +
          city.tile.yields.food * 5 +
          city.tile.yields.production * 5 +
          (city.tile.resource ? 20 : 0);

        // Calculate difficulty
        let difficulty = 0;

        // City defenses
        const defenders = city.tile.units.filter((u) => u.player === player);
        difficulty += defenders.reduce(
          (sum, u) => sum + u.definition.strength,
          0,
        );

        // Nearby reinforcements
        for (const tile of city.tile.getTilesInRange(3)) {
          const reinforcements = tile.units.filter((u) => u.player === player);
          const distance = tile.getDistanceTo(city.tile);
          difficulty += reinforcements.reduce(
            (sum, u) => sum + u.definition.strength / (distance + 1),
            0,
          );
        }

        // Base city defense (reduced to make AI more aggressive)
        difficulty += 5;

        // Calculate required force (with smaller safety margin to be more aggressive)
        const requiredForce = Math.ceil(difficulty * 1.1);

        // Calculate distance from our nearest city
        let minDistance = Infinity;
        for (const ourCity of this.player.cities) {
          const distance = ourCity.tile.getDistanceTo(city.tile);
          if (distance < minDistance) {
            minDistance = distance;
          }
        }

        targets.push({
          city,
          attractiveness,
          difficulty,
          requiredForce,
          distance: minDistance,
        });
      }
    }

    // Sort by score (attractiveness vs difficulty and distance)
    targets.sort((a, b) => {
      const scoreA = a.attractiveness / (a.difficulty * (1 + a.distance * 0.1));
      const scoreB = b.attractiveness / (b.difficulty * (1 + b.distance * 0.1));
      return scoreB - scoreA;
    });

    return targets;
  }

  private handleOffensiveOperations(targets: TargetAssessment[]) {
    // Limit number of concurrent attacks based on empire size
    const maxConcurrentAttacks = Math.max(
      1,
      Math.ceil(this.player.cities.length / 3),
    );
    let currentAttacks = this.activeArmies.size;

    if (currentAttacks >= maxConcurrentAttacks) return;

    // Check available military strength
    const availableMilitary = this.calculateAvailableMilitaryStrength();

    // Debug: log if we found targets
    if (targets.length > 0 && this.player.game.turn % 10 === 0) {
      console.log(
        `[Military AI ${this.player.nation.name}] Found ${targets.length} targets, available strength: ${availableMilitary}`,
      );
      if (targets[0]) {
        console.log(
          `  Best target: ${targets[0].city.name}, required: ${
            targets[0].requiredForce
          }, score: ${targets[0].attractiveness / targets[0].difficulty}`,
        );
      }
    }

    // Try to form armies for best targets
    for (const target of targets) {
      if (currentAttacks >= maxConcurrentAttacks) break;

      // Skip if we already have an army targeting this city
      if (this.activeArmies.has(target.city)) continue;

      // Skip if we don't have enough available strength (be more aggressive)
      if (availableMilitary < target.requiredForce * 0.3) {
        if (this.player.game.turn % 10 === 0) {
          console.log(
            `  Skipping ${
              target.city.name
            }: not enough strength (${availableMilitary} < ${
              target.requiredForce * 0.3
            })`,
          );
        }
        continue;
      }

      // Check if target is still worth attacking (very low threshold)
      const score = target.attractiveness / target.difficulty;
      if (score < 0.1) {
        if (this.player.game.turn % 10 === 0) {
          console.log(
            `  Skipping ${target.city.name}: low score (${score} < 0.1)`,
          );
        }
        continue;
      }

      console.log(
        `[Military AI ${this.player.nation.name}] Creating army to attack ${target.city.name}`,
      );

      // Create army formation task
      const armyTask = new FormArmyTask(this.ai, {
        targetCity: target.city,
        requiredStrength: target.requiredForce,
        priority: this.PRIORITIES.ARMY_FORMATION,
      });

      this.ai.addRootTask(armyTask);
      this.activeArmies.set(target.city, armyTask);
      currentAttacks++;
    }
  }

  private calculateAvailableMilitaryStrength(): number {
    let totalStrength = 0;

    for (const unit of this.ai.units.freeByTrait.military) {
      if (unit.parent) continue; // In transport
      if (unit.health < 30) continue; // Too damaged

      totalStrength += unit.definition.strength * (unit.health / 100);
    }

    return totalStrength;
  }

  private requestUnitProduction() {
    // Calculate military needs
    const totalCities = this.player.cities.length;
    const totalMilitary = this.player.units.filter((u) => u.isMilitary).length;
    const militaryRatio = totalMilitary / Math.max(1, totalCities);

    // We want at least 2 military units per city
    const targetRatio = 2;

    if (militaryRatio < targetRatio) {
      // Request military production
      const priority = Math.round((targetRatio - militaryRatio) * 100);

      // Find best military unit we can produce
      const availableUnits = Array.from(
        this.player.knowledge.discoveredEntities.unit,
      ).filter((u) => u.traits.includes("military"));

      // Sort by strength
      availableUnits.sort((a, b) => b.strength - a.strength);

      for (const unitDef of availableUnits) {
        this.ai.productionAi.request({
          focus: "military",
          priority,
          product: unitDef,
        });
      }
    }

    // Special request for naval units if we have coastal cities
    const coastalCities = this.player.cities.filter((c) => c.tile.coast);
    const navalUnits = this.player.units.filter((u) => u.isNaval).length;

    if (coastalCities.length > 0 && navalUnits < coastalCities.length) {
      const navalPriority = 70;

      // Request naval units
      const navalUnitDefs = Array.from(
        this.player.knowledge.discoveredEntities.unit,
      ).filter((u) => u.traits.includes("naval"));

      for (const unitDef of navalUnitDefs) {
        this.ai.productionAi.request({
          focus: "military",
          priority: navalPriority,
          product: unitDef,
        });
      }
    }
  }
}
