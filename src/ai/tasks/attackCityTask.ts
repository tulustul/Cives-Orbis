import { CityCore } from "@/core/city";
import { UnitCore } from "@/core/unit";
import { TileCore } from "@/core/tile";
import { AiTask, AiTaskOptions } from "./task";
import { MoveUnitTask } from "./moveUnitTask";
import { NavalTransportTask } from "./navalTransportTask";
import { tileToTileCoords, unitToIdAndName } from "@/core/serialization/channel";
import { TileCoords, UnitIdAndName } from "@/shared";
import { LandForm, SeaLevel } from "@/shared";
import { AreasGraph } from "@/core/areasGraph";

export type AttackCityTaskOptions = AiTaskOptions & {
  targetCity: CityCore;
  attackingUnits: UnitCore[];
  priority: number;
};

export type AttackCityTaskSerialized = {
  targetCity: TileCoords;
  state: AttackCityState;
  attackingUnits: UnitIdAndName[];
  approach: "land" | "naval" | "combined";
  siegePositions: Map<number, TileCoords>;
};

type AttackCityState = 
  | "planning"
  | "approaching"
  | "positioning"
  | "sieging"
  | "maintaining"
  | "capturing"
  | "retreating"
  | "completed";

export class AttackCityTask extends AiTask<AttackCityTaskOptions, AttackCityTaskSerialized> {
  readonly type = "attackCity";
  
  private state: AttackCityState = "planning";
  private approach: "land" | "naval" | "combined" = "land";
  private siegePositions = new Map<UnitCore, TileCore>();
  private maintainPressureCounter = 0;
  
  tick() {
    // Check if target city still exists and is enemy
    if (!this.options.targetCity.tile.city || 
        !this.ai.player.isEnemyWith(this.options.targetCity.player)) {
      return this.complete();
    }
    
    // Remove dead units
    this.options.attackingUnits = this.options.attackingUnits.filter(u => u.health > 0);
    if (this.options.attackingUnits.length === 0) {
      return this.fail("All attacking units eliminated");
    }
    
    switch (this.state) {
      case "planning":
        return this.planApproach();
      case "approaching":
        return this.approachTarget();
      case "positioning":
        return this.positionForSiege();
      case "sieging":
        return this.executeSiege();
      case "maintaining":
        return this.maintainPressure();
      case "capturing":
        return this.captureCity();
      case "retreating":
        return this.executeRetreat();
    }
  }
  
  private planApproach() {
    
    // Check if we need naval transport
    const needsNavalTransport = this.checkNavalTransportNeeded();
    
    if (needsNavalTransport) {
      // Check if we have any naval units in the army
      const navalUnits = this.options.attackingUnits.filter(u => u.isNaval);
      this.approach = navalUnits.length > 0 ? "combined" : "naval";
    } else {
      this.approach = "land";
    }
    
    this.state = "approaching";
  }
  
  private checkNavalTransportNeeded(): boolean {
    const target = this.options.targetCity.tile;
    
    // Use areas graph to check if land path exists
    const areasGraph = new AreasGraph();
    areasGraph.buildFromTilesMap(this.ai.player.game.map);
    
    // Check if any attacking unit can reach target by land
    for (const unit of this.options.attackingUnits) {
      if (!unit.isLand) continue;
      
      const unitArea = unit.tile.passableArea;
      const targetArea = target.passableArea;
      
      if (!unitArea || !targetArea) continue;
      
      // If same area or connected areas, land path exists
      if (unitArea === targetArea) return false;
      
      const path = areasGraph.findPath(unitArea.id, targetArea.id);
      if (path && path.length > 0) return false;
    }
    
    return true;
  }
  
  private approachTarget() {
    const target = this.options.targetCity.tile;
    
    if (this.approach === "naval" || this.approach === "combined") {
      // Handle naval approach
      this.handleNavalApproach();
    } else {
      // Simple land approach
      for (const unit of this.options.attackingUnits) {
        if (unit.tile.getDistanceTo(target) > 3) {
          this.addTask(
            new MoveUnitTask(this.ai, {
              unit,
              tile: target,
              priority: this.options.priority,
            })
          );
        }
      }
    }
    
    // Check if units are close enough to start positioning
    const avgDistance = this.options.attackingUnits.reduce(
      (sum, unit) => sum + unit.tile.getDistanceTo(target),
      0
    ) / this.options.attackingUnits.length;
    
    if (avgDistance <= 3) {
      this.state = "positioning";
    }
  }
  
  private handleNavalApproach() {
    const target = this.options.targetCity.tile;
    
    // Group units by whether they need transport
    const landUnits = this.options.attackingUnits.filter(u => u.isLand);
    const navalUnits = this.options.attackingUnits.filter(u => u.isNaval);
    
    // Transport land units
    for (const unit of landUnits) {
      const unitArea = unit.tile.passableArea;
      const targetArea = target.passableArea;
      
      if (unitArea !== targetArea) {
        this.addTask(
          new NavalTransportTask(this.ai, {
            unit,
            to: target,
          })
        );
      }
    }
    
    // Naval units can move directly
    for (const unit of navalUnits) {
      this.addTask(
        new MoveUnitTask(this.ai, {
          unit,
          tile: target,
          priority: this.options.priority,
        })
      );
    }
  }
  
  private positionForSiege() {
    const target = this.options.targetCity.tile;
    
    // Find good siege positions around the city
    const siegePositions = this.findSiegePositions(target);
    
    // Assign units to positions
    let posIndex = 0;
    for (const unit of this.options.attackingUnits) {
      if (siegePositions.length === 0) break;
      
      const position = siegePositions[posIndex % siegePositions.length];
      this.siegePositions.set(unit, position);
      posIndex++;
      
      // Move unit to position if not already there
      if (unit.tile !== position) {
        this.addTask(
          new MoveUnitTask(this.ai, {
            unit,
            tile: position,
              priority: this.options.priority + 20,
          })
        );
      }
    }
    
    // Check if most units are in position
    let inPosition = 0;
    for (const [unit, position] of this.siegePositions) {
      if (unit.tile === position || unit.tile.neighbours.includes(target)) {
        inPosition++;
      }
    }
    
    if (inPosition >= this.options.attackingUnits.length * 0.7) {
      this.state = "sieging";
    }
  }
  
  private findSiegePositions(city: TileCore): TileCore[] {
    const positions: TileCore[] = [];
    
    // First priority: adjacent tiles
    for (const tile of city.neighbours) {
      if (tile.passableArea === city.passableArea || 
          (tile.seaLevel !== SeaLevel.none && city.coast)) {
        positions.push(tile);
      }
    }
    
    // Second priority: tiles 2 away for ranged units
    for (const tile of city.getTilesInRange(2)) {
      if (tile.getDistanceTo(city) === 2) {
        // Good for ranged units
        if (tile.landForm === LandForm.hills) {
          positions.push(tile);
        }
      }
    }
    
    return positions;
  }
  
  private executeSiege() {
    const target = this.options.targetCity.tile;
    
    // Check if we should retreat
    if (this.shouldRetreat()) {
      this.state = "retreating";
      return;
    }
    
    // Attack with units adjacent to city
    let attacked = false;
    for (const unit of this.options.attackingUnits) {
      if (unit.actionPointsLeft === 0) continue;
      
      // If adjacent to city, attack
      if (unit.tile.neighbours.includes(target)) {
        // Check for defenders
        const defenders = target.units.filter(u => 
          this.ai.player.isEnemyWith(u.player)
        );
        
        if (defenders.length > 0) {
          // Attack the city (defenders will be engaged automatically)
          this.addTask(
            new MoveUnitTask(this.ai, {
              unit,
              tile: target,
              priority: this.options.priority + 100,
            })
          );
          attacked = true;
        } else {
          // No defenders, capture city
          this.state = "capturing";
          return;
        }
      }
    }
    
    if (!attacked) {
      // No attacks possible this turn, maintain pressure
      this.state = "maintaining";
    }
  }
  
  private shouldRetreat(): boolean {
    // Calculate our strength vs enemy strength
    let ourStrength = 0;
    let ourHealth = 0;
    for (const unit of this.options.attackingUnits) {
      ourStrength += unit.definition.strength;
      ourHealth += unit.health;
    }
    
    const avgHealth = ourHealth / this.options.attackingUnits.length;
    
    // Retreat if average health too low
    if (avgHealth < 30) return true;
    
    // Retreat if too few units left
    if (this.options.attackingUnits.length < 2) return true;
    
    // Check enemy reinforcements
    const nearbyEnemies = this.countNearbyEnemies();
    if (nearbyEnemies > ourStrength * 1.5) return true;
    
    return false;
  }
  
  private countNearbyEnemies(): number {
    const target = this.options.targetCity.tile;
    let enemyStrength = 0;
    
    for (const tile of target.getTilesInRange(3)) {
      const enemies = tile.units.filter(u => 
        this.ai.player.isEnemyWith(u.player)
      );
      
      for (const enemy of enemies) {
        const distance = tile.getDistanceTo(target);
        const factor = 1 / (distance + 1);
        enemyStrength += enemy.definition.strength * factor;
      }
    }
    
    return enemyStrength;
  }
  
  private maintainPressure() {
    this.maintainPressureCounter++;
    
    // Keep units in position
    for (const [unit, position] of this.siegePositions) {
      if (unit.tile !== position && !unit.tile.neighbours.includes(this.options.targetCity.tile)) {
        this.addTask(
          new MoveUnitTask(this.ai, {
            unit,
            tile: position,
              priority: this.options.priority,
          })
        );
      }
    }
    
    // Rotate damaged units
    const damagedUnits = this.options.attackingUnits.filter(u => u.health < 50);
    const healthyUnits = this.options.attackingUnits.filter(u => u.health >= 80);
    
    if (damagedUnits.length > 0 && healthyUnits.length > damagedUnits.length) {
      // Pull back damaged units
      for (const damaged of damagedUnits) {
        const safePosition = this.findSafePosition(damaged.tile);
        if (safePosition) {
          this.addTask(
            new MoveUnitTask(this.ai, {
              unit: damaged,
              tile: safePosition,
              priority: this.options.priority + 10,
            })
          );
        }
      }
    }
    
    // After maintaining for a few turns, try attacking again
    if (this.maintainPressureCounter >= 3) {
      this.maintainPressureCounter = 0;
      this.state = "sieging";
    }
  }
  
  private findSafePosition(from: TileCore): TileCore | null {
    // Find a tile away from enemies
    for (const tile of from.neighbours) {
      const hasEnemies = tile.units.some(u => 
        this.ai.player.isEnemyWith(u.player)
      );
      
      if (!hasEnemies) {
        return tile;
      }
    }
    
    return null;
  }
  
  private captureCity() {
    const target = this.options.targetCity.tile;
    
    // Move a unit into the city
    for (const unit of this.options.attackingUnits) {
      if (unit.tile.neighbours.includes(target)) {
        this.addTask(
          new MoveUnitTask(this.ai, {
            unit,
            tile: target,
              priority: this.options.priority + 200,
          })
        );
        break;
      }
    }
    
    this.state = "completed";
    this.complete();
  }
  
  private executeRetreat() {
    // Find safe retreat location
    const retreatTarget = this.findRetreatLocation();
    
    if (!retreatTarget) {
      return this.fail("No retreat path available");
    }
    
    // Move all units to retreat location
    for (const unit of this.options.attackingUnits) {
      this.addTask(
        new MoveUnitTask(this.ai, {
          unit,
          tile: retreatTarget,
          priority: this.options.priority + 150,
        })
      );
    }
    
    this.fail("Retreated from siege");
  }
  
  private findRetreatLocation(): TileCore | null {
    // Retreat to nearest friendly city
    let nearestCity: CityCore | null = null;
    let nearestDistance = Infinity;
    
    for (const city of this.ai.player.cities) {
      const distance = city.tile.getDistanceTo(this.options.targetCity.tile);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestCity = city;
      }
    }
    
    return nearestCity?.tile || null;
  }
  
  serialize(): AttackCityTaskSerialized {
    const siegePositionsMap = new Map<number, TileCoords>();
    for (const [unit, tile] of this.siegePositions) {
      siegePositionsMap.set(unit.id, tileToTileCoords(tile));
    }
    
    return {
      targetCity: tileToTileCoords(this.options.targetCity.tile),
      state: this.state,
      attackingUnits: this.options.attackingUnits.map(u => unitToIdAndName(u)!).filter(u => u !== null) as UnitIdAndName[],
      approach: this.approach,
      siegePositions: siegePositionsMap,
    };
  }
}