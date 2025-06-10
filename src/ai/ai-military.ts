import { AISystem } from "./ai-system";
import { CityCore } from "@/core/city";
import { UnitCore } from "@/core/unit";
import { DefendCityTask } from "./tasks/defendCityTask";
import { FormArmyTask } from "./tasks/formArmyTask";
import { InterceptTask } from "./tasks/interceptTask";
import { AiOrder } from "./types";
import { CityAssessment } from "./utils/mapAnalysis";
import { AiTask } from "./tasks";

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

  *plan(): Generator<AiOrder | AiTask<any, any>> {
    // Clean up completed tasks
    this.cleanupCompletedTasks();

    // Update map analysis data
    this.ai.mapAnalysis.update();

    // Handle defense based on map analysis
    this.handleThreats(this.ai.mapAnalysis.defenseTargets);

    // Look for interception opportunities
    this.handleInterceptions();

    // Handle offensive operations based on map analysis
    this.handleOffensiveOperations(this.ai.mapAnalysis.attackTargets);

    // Request unit production if needed
    this.requestUnitProduction();
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

  private handleThreats(threats: CityAssessment[]) {
    for (const threat of threats) {
      // Check if we already have a defense task for this city
      const existingTask = this.defenseTracker.get(threat.city);
      if (existingTask && !existingTask.result) {
        continue; // Task already active
      }

      // Calculate threat ratio for priority
      const threatRatio =
        threat.enemyInfluence / Math.max(1, threat.friendlyInfluence);

      // Determine priority based on threat ratio
      let priority = this.PRIORITIES.CITY_DEFENSE_NORMAL;
      if (threatRatio > 3.0) {
        priority = this.PRIORITIES.CITY_DEFENSE_CRITICAL;
      } else if (threatRatio > 1.5) {
        priority = this.PRIORITIES.CITY_DEFENSE_HIGH;
      }

      // Create defense task even for influence-based threats (early warning)
      const defenseTask = new DefendCityTask(this.ai, {
        city: threat.city,
        priority,
      });

      this.ai.addRootTask(defenseTask);
      this.defenseTracker.set(threat.city, defenseTask);

      // Log early warning detections
      if (
        threat.city.tile.units.filter((u) => this.player.isEnemyWith(u.player))
          .length === 0 &&
        threat.enemyInfluence > 0
      ) {
        console.log(
          `[Military AI ${this.player.nation.name}] Early warning: ${
            threat.city.name
          } under influence threat (ratio: ${threatRatio.toFixed(2)})`,
        );
      }
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

  private handleOffensiveOperations(targets: CityAssessment[]) {
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
          `  Best target: ${targets[0].city.name}, effort: ${targets[0].effort}, score: ${targets[0].score}`,
        );
      }
    }

    // Try to form armies for best targets (already sorted by score)
    for (const target of targets) {
      if (currentAttacks >= maxConcurrentAttacks) break;

      // Skip if we already have an army targeting this city
      if (this.activeArmies.has(target.city)) continue;

      // Calculate required force based on actual enemy strength
      // Start with city defense strength
      const cityDefense = target.city.defense.strength * (target.city.defense.health / target.city.defense.maxHealth);
      
      // Add enemy influence (represents nearby enemy units)
      const enemyStrength = cityDefense + target.enemyInfluence;
      
      // Calculate force multiplier
      let forceMultiplier = 2.0; // Base: we need 2x the enemy strength
      
      // Distance penalty: farther targets need more force for attrition
      if (target.distance > 15) {
        forceMultiplier += 0.5;
      } else if (target.distance > 10) {
        forceMultiplier += 0.3;
      }
      
      // Subtract friendly influence already at the target
      const effectiveEnemyStrength = Math.max(1, enemyStrength - target.friendlyInfluence * 0.5);
      
      // Calculate actual required force
      const requiredForce = Math.ceil(effectiveEnemyStrength * forceMultiplier);
      
      // Skip if we don't have enough available strength (need at least 70% ready)
      if (availableMilitary < requiredForce * 0.7) {
        if (this.player.game.turn % 10 === 0) {
          console.log(
            `  Skipping ${target.city.name}: insufficient strength (${availableMilitary} < ${requiredForce * 0.7} needed, enemy: ${enemyStrength.toFixed(1)})`,
          );
        }
        continue;
      }

      // Skip very low score targets
      if (target.score < 1) {
        if (this.player.game.turn % 10 === 0) {
          console.log(
            `  Skipping ${target.city.name}: low score (${target.score} < 1)`,
          );
        }
        continue;
      }

      console.log(
        `[Military AI ${this.player.nation.name}] Creating army to attack ${target.city.name} (enemy: ${enemyStrength.toFixed(1)}, required: ${requiredForce})`,
      );

      // Create army formation task with properly calculated force
      const armyTask = new FormArmyTask(this.ai, {
        targetCity: target.city,
        requiredStrength: requiredForce,
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

      // Base strength
      const baseStrength = unit.definition.strength * (unit.health / 100);

      // Factor in influence at unit's location
      const influence = this.ai.mapAnalysis.heatMap.getTileInfluence(unit.tile);
      let availabilityMultiplier = 1.0;

      if (influence) {
        const friendly = influence.friendly.total;
        const enemy = influence.enemy.total;

        if (friendly > 0 || enemy > 0) {
          // Units in friendly-dominated areas are more available
          // Units in enemy-dominated areas are less available
          const influenceRatio = friendly / (friendly + enemy);

          // Scale from 0.5 (enemy dominated) to 1.2 (friendly dominated)
          availabilityMultiplier = 0.5 + influenceRatio * 0.7;
        }
      }

      totalStrength += baseStrength * availabilityMultiplier;
    }

    return totalStrength;
  }

  private requestUnitProduction() {
    // Calculate military needs more aggressively
    const totalCities = this.player.cities.length;
    const totalMilitary = this.player.units.filter((u) => u.isMilitary && !u.isNaval).length;
    const militaryRatio = totalMilitary / Math.max(1, totalCities);

    // Calculate threats and opportunities
    const threatenedCities = this.ai.mapAnalysis.defenseTargets.length;
    const attackTargets = this.ai.mapAnalysis.attackTargets.length;
    const activeArmies = this.activeArmies.size;
    
    // Dynamic target ratio based on situation
    let targetRatio = 3; // Base: 3 units per city
    
    // Add more if we have threats
    if (threatenedCities > 0) {
      targetRatio += threatenedCities * 0.5;
    }
    
    // Add more if we have attack opportunities but no armies
    if (attackTargets > 0 && activeArmies === 0) {
      targetRatio += 2;
    }
    
    // Always produce military if we have very few
    const needsUrgentMilitary = totalMilitary < totalCities * 1.5;
    
    if (militaryRatio < targetRatio || needsUrgentMilitary) {
      // Calculate priority - much higher for urgent needs
      let priority = Math.round((targetRatio - militaryRatio) * 150);
      
      // Boost priority if we have no active armies but have targets
      if (activeArmies === 0 && attackTargets > 0) {
        priority = Math.max(priority, 200);
      }
      
      // Emergency priority if very low military
      if (needsUrgentMilitary) {
        priority = Math.max(priority, 250);
      }

      // Find best land military units we can produce
      const availableUnits = Array.from(
        this.player.knowledge.discoveredEntities.unit,
      ).filter((u) => u.traits.includes("military") && !u.traits.includes("naval"));

      // Sort by strength/cost efficiency
      availableUnits.sort((a, b) => {
        const efficiencyA = a.strength / Math.max(1, a.productionCost);
        const efficiencyB = b.strength / Math.max(1, b.productionCost);
        return efficiencyB - efficiencyA;
      });

      // Request multiple unit types with decreasing priority
      let requestPriority = priority;
      for (const unitDef of availableUnits.slice(0, 3)) {
        this.ai.productionAi.request({
          focus: "military",
          priority: requestPriority,
          product: unitDef,
        });
        requestPriority = Math.max(100, requestPriority - 50);
      }
      
      // Log military production requests
      if (this.player.game.turn % 10 === 0) {
        console.log(
          `[Military AI ${this.player.nation.name}] Requesting military: ${totalMilitary}/${Math.ceil(targetRatio * totalCities)} units, priority: ${priority}`
        );
      }
    }

    // Naval units - lower priority
    const coastalCities = this.player.cities.filter((c) => c.tile.coast);
    const navalUnits = this.player.units.filter((u) => u.isNaval).length;

    if (coastalCities.length > 0 && navalUnits < coastalCities.length * 0.5) {
      const navalPriority = 50; // Lower priority than land units

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
