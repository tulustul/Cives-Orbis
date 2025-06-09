import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { CityCore } from "@/core/city";
import { AiTask, AiTaskOptions } from "./task";
import { MoveUnitTask } from "./moveUnitTask";
import { AttackCityTask } from "./attackCityTask";
import { tileToTileCoords, unitToIdAndName } from "@/core/serialization/channel";
import { TileCoords, UnitIdAndName } from "@/shared";

export type FormArmyTaskOptions = AiTaskOptions & {
  targetCity: CityCore;
  requiredStrength: number;
  priority: number;
};

export type FormArmyTaskSerialized = {
  targetCity: TileCoords;
  requiredStrength: number;
  state: FormArmyState;
  gatheringPoint: TileCoords | null;
  armyUnits: UnitIdAndName[];
  currentStrength: number;
};

type FormArmyState = 
  | "planning"
  | "gathering"
  | "forming"
  | "ready"
  | "completed";

type ArmyUnit = {
  unit: UnitCore;
  role: "frontline" | "ranged" | "support";
};

export class FormArmyTask extends AiTask<FormArmyTaskOptions, FormArmyTaskSerialized> {
  readonly type = "formArmy";
  
  private state: FormArmyState = "planning";
  private gatheringPoint: TileCore | null = null;
  private armyUnits: ArmyUnit[] = [];
  private currentStrength = 0;
  private gatheredUnits = new Set<UnitCore>();
  
  tick() {
    // Check if target city still exists and is enemy
    if (!this.options.targetCity.tile.city || 
        !this.ai.player.isEnemyWith(this.options.targetCity.player)) {
      return this.fail("Target city no longer valid");
    }
    
    switch (this.state) {
      case "planning":
        return this.planArmy();
      case "gathering":
        return this.gatherUnits();
      case "forming":
        return this.waitForFormation();
      case "ready":
        return this.transitionToAttack();
      case "completed":
        // Do nothing - waiting for attack task to complete
        return;
    }
  }
  
  private planArmy() {
    // Find a good gathering point
    this.gatheringPoint = this.findGatheringPoint();
    if (!this.gatheringPoint) {
      return this.fail("No suitable gathering point");
    }
    
    // Select units for the army
    this.selectArmyUnits();
    
    if (this.armyUnits.length === 0) {
      return this.fail("No units available for army");
    }
    
    this.state = "gathering";
  }
  
  private findGatheringPoint(): TileCore | null {
    const target = this.options.targetCity.tile;
    
    // Find the closest friendly city to the target
    let bestCity: CityCore | null = null;
    let bestDistance = Infinity;
    
    for (const city of this.ai.player.cities) {
      const distance = city.tile.getDistanceTo(target);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestCity = city;
      }
    }
    
    if (bestCity) {
      // Gather at the friendly city
      return bestCity.tile;
    }
    
    // If no cities, find a safe tile between units and target
    const availableUnits = Array.from(this.ai.units.freeByTrait.military);
    if (availableUnits.length === 0) return null;
    
    // Calculate center of mass of available units
    let sumX = 0;
    let sumY = 0;
    for (const unit of availableUnits) {
      sumX += unit.tile.x;
      sumY += unit.tile.y;
    }
    
    const centerX = Math.round(sumX / availableUnits.length);
    const centerY = Math.round(sumY / availableUnits.length);
    
    // Find tile closest to center
    const map = this.ai.player.game.map;
    if (centerX >= 0 && centerX < map.width && centerY >= 0 && centerY < map.height) {
      return map.tiles[centerX][centerY];
    }
    
    return availableUnits[0].tile;
  }
  
  private selectArmyUnits() {
    const maxDistance = 20; // Don't recruit units too far away
    
    // Find available military units
    const candidates: { unit: UnitCore; distance: number; score: number }[] = [];
    
    for (const unit of this.ai.units.freeByTrait.military) {
      if (unit.parent) continue; // Skip units in transports
      if (unit.health < 30) continue; // Skip heavily damaged units
      
      const distance = unit.tile.getDistanceTo(this.gatheringPoint!);
      if (distance > maxDistance) continue;
      
      // Score based on strength and distance
      const score = unit.definition.strength - distance * 0.5;
      
      candidates.push({ unit, distance, score });
    }
    
    // Sort by score (best units first)
    candidates.sort((a, b) => b.score - a.score);
    
    // Select units until we have enough strength
    for (const candidate of candidates) {
      if (this.currentStrength >= this.options.requiredStrength * 1.2) break;
      
      const role = this.determineUnitRole(candidate.unit);
      this.armyUnits.push({ unit: candidate.unit, role });
      this.currentStrength += candidate.unit.definition.strength;
      this.ai.units.assign(candidate.unit, "army");
      
      // Create movement task to gathering point
      this.addTask(
        new MoveUnitTask(this.ai, {
          unit: candidate.unit,
          tile: this.gatheringPoint!,
          priority: this.options.priority,
          onComplete: () => {
            this.gatheredUnits.add(candidate.unit);
          },
        })
      );
    }
    
    // Debug log
    console.log(`[FormArmyTask] Selected ${this.armyUnits.length} units for army, total strength: ${this.currentStrength}, required: ${this.options.requiredStrength}`);
    if (this.armyUnits.length === 0) {
      console.log(`  No units available from ${candidates.length} candidates`);
    }
  }
  
  private determineUnitRole(unit: UnitCore): "frontline" | "ranged" | "support" {
    // Units with higher action points are ranged
    if (unit.definition.actionPoints && unit.definition.actionPoints > 1) {
      return "ranged";
    }
    
    // Default to frontline
    return "frontline";
  }
  
  private gatherUnits() {
    // Remove dead units
    this.armyUnits = this.armyUnits.filter(au => au.unit.health > 0);
    
    if (this.armyUnits.length === 0) {
      return this.fail("Army eliminated before gathering");
    }
    
    // Check how many units have gathered
    const gatheredCount = this.gatheredUnits.size;
    const totalCount = this.armyUnits.length;
    
    // If most units have gathered, move to forming state
    if (gatheredCount >= totalCount * 0.7) {
      this.state = "forming";
    }
  }
  
  private waitForFormation() {
    // Wait for remaining units to arrive or timeout
    const gatheredCount = this.gatheredUnits.size;
    const totalCount = this.armyUnits.length;
    
    // Check if we have enough strength even with missing units
    let gatheredStrength = 0;
    for (const armyUnit of this.armyUnits) {
      if (this.gatheredUnits.has(armyUnit.unit)) {
        gatheredStrength += armyUnit.unit.definition.strength;
      }
    }
    
    // If we have enough strength or all units gathered, ready to attack
    if (gatheredStrength >= this.options.requiredStrength || 
        gatheredCount === totalCount ||
        this.tasks.every(t => t.result !== null)) {
      this.state = "ready";
    }
  }
  
  private transitionToAttack() {
    // Create attack task with the formed army
    const attackUnits = this.armyUnits
      .filter(au => this.gatheredUnits.has(au.unit))
      .map(au => au.unit);
    
    this.addTask(
      new AttackCityTask(this.ai, {
        targetCity: this.options.targetCity,
        attackingUnits: attackUnits,
        priority: this.options.priority,
        onComplete: () => {
          // Release units when attack completes
          for (const unit of attackUnits) {
            this.ai.units.unassign(unit);
          }
          // Mark this task as complete when attack finishes
          this.complete();
        },
        onFail: () => {
          // Release units when attack fails
          for (const unit of attackUnits) {
            this.ai.units.unassign(unit);
          }
          // Mark this task as failed when attack fails
          this.fail("Attack failed");
        },
      })
    );
    
    // Don't complete yet - wait for the attack task to finish
    this.state = "completed";
  }
  
  cleanup() {
    // Release any units still assigned
    for (const armyUnit of this.armyUnits) {
      this.ai.units.unassign(armyUnit.unit);
    }
  }
  
  serialize(): FormArmyTaskSerialized {
    return {
      targetCity: tileToTileCoords(this.options.targetCity.tile),
      requiredStrength: this.options.requiredStrength,
      state: this.state,
      gatheringPoint: this.gatheringPoint ? tileToTileCoords(this.gatheringPoint) : null,
      armyUnits: this.armyUnits.map(au => unitToIdAndName(au.unit)!).filter(u => u !== null) as UnitIdAndName[],
      currentStrength: this.currentStrength,
    };
  }
}