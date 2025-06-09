import { CityCore } from "@/core/city";
import { UnitCore } from "@/core/unit";
import { TileCore } from "@/core/tile";
import { AiTask, AiTaskOptions } from "./task";
import { ReinforcementTask } from "./reinforcementTask";
import { MoveUnitTask } from "./moveUnitTask";
import { tileToTileCoords, unitToIdAndName } from "@/core/serialization/channel";
import { TileCoords, UnitIdAndName } from "@/shared";
import { simulateCombat } from "@/core/combat";
import { LandForm } from "@/shared";

export type DefendCityTaskOptions = AiTaskOptions & {
  city: CityCore;
  priority: number;
};

export type DefendCityTaskSerialized = {
  city: TileCoords;
  state: DefendCityState;
  assignedUnits: UnitIdAndName[];
  threatLevel: number;
  requiredDefense: number;
};

type DefendCityState = 
  | "assessing"
  | "positioning" 
  | "reinforcing"
  | "defending"
  | "completed";

export class DefendCityTask extends AiTask<DefendCityTaskOptions, DefendCityTaskSerialized> {
  readonly type = "defendCity";
  
  private state: DefendCityState = "assessing";
  private assignedUnits: UnitCore[] = [];
  private threatLevel = 0;
  private requiredDefense = 0;
  private enemyUnits: UnitCore[] = [];
  
  init() {
    // Assign existing garrison units
    const garrisonUnits = this.options.city.tile.units.filter(
      u => u.player === this.ai.player && u.isMilitary
    );
    
    for (const unit of garrisonUnits) {
      if (this.ai.units.assignments.has(unit)) continue;
      this.assignedUnits.push(unit);
      this.ai.units.assign(unit, "defense");
    }
  }
  
  tick() {
    // Check if city still exists and is ours
    if (!this.options.city.tile.city || this.options.city.tile.city.player !== this.ai.player) {
      return this.complete();
    }
    
    switch (this.state) {
      case "assessing":
        return this.assessThreats();
      case "positioning":
        return this.positionGarrison();
      case "reinforcing":
        return this.checkReinforcements();
      case "defending":
        return this.activeDefense();
    }
  }
  
  private assessThreats() {
    this.enemyUnits = [];
    this.threatLevel = 0;
    
    // Check tiles around city for threats
    const checkRadius = 5;
    for (const tile of this.options.city.tile.getTilesInRange(checkRadius)) {
      const enemyUnitsOnTile = tile.units.filter(u => 
        this.ai.player.isEnemyWith(u.player)
      );
      
      if (enemyUnitsOnTile.length > 0) {
        this.enemyUnits.push(...enemyUnitsOnTile);
        
        // Calculate threat based on unit strength and distance
        const distance = tile.getDistanceTo(this.options.city.tile);
        const distanceFactor = 1 + (checkRadius - distance) * 0.3;
        
        for (const enemy of enemyUnitsOnTile) {
          this.threatLevel += enemy.definition.strength * distanceFactor;
        }
      }
    }
    
    // Calculate required defense force
    this.requiredDefense = Math.ceil(10 + this.threatLevel * 0.8);
    
    // Get current defense strength
    const currentDefense = this.assignedUnits.reduce(
      (sum, unit) => sum + unit.definition.strength,
      0
    );
    
    if (this.enemyUnits.length === 0) {
      // No immediate threats
      if (this.assignedUnits.length > 1) {
        // Release some units if we have too many
        const unitsToRelease = this.assignedUnits.slice(1);
        for (const unit of unitsToRelease) {
          this.ai.units.unassign(unit);
        }
        this.assignedUnits = this.assignedUnits.slice(0, 1);
      }
      this.state = "defending";
    } else if (currentDefense < this.requiredDefense) {
      // Need reinforcements
      this.state = "reinforcing";
      this.requestReinforcements();
    } else {
      // Have enough units, position them
      this.state = "positioning";
    }
  }
  
  private requestReinforcements() {
    const currentDefense = this.assignedUnits.reduce(
      (sum, unit) => sum + unit.definition.strength,
      0
    );
    
    const needed = this.requiredDefense - currentDefense;
    
    this.addTask(
      new ReinforcementTask(this.ai, {
        target: this.options.city.tile,
        requiredStrength: needed,
        priority: this.options.priority + this.threatLevel,
        onUnitArrived: (unit) => {
          this.assignedUnits.push(unit);
          this.ai.units.assign(unit, "defense");
        },
      })
    );
  }
  
  private positionGarrison() {
    // Find good defensive positions around the city
    const defensivePositions: TileCore[] = [];
    
    // First priority: city tile itself
    defensivePositions.push(this.options.city.tile);
    
    // Second priority: adjacent tiles with defensive bonuses
    for (const tile of this.options.city.tile.neighbours) {
      if (tile.landForm === LandForm.hills || tile.forest) {
        defensivePositions.push(tile);
      }
    }
    
    // Third priority: choke points (tiles that enemies must pass through)
    const enemyDirection = this.getGeneralEnemyDirection();
    if (enemyDirection) {
      for (const tile of this.options.city.tile.neighbours) {
        const towardsEnemy = tile.getDistanceTo(enemyDirection) < 
          this.options.city.tile.getDistanceTo(enemyDirection);
        if (towardsEnemy) {
          defensivePositions.push(tile);
        }
      }
    }
    
    // Position units
    let positionIndex = 0;
    for (const unit of this.assignedUnits) {
      if (unit.tile === this.options.city.tile) continue; // Already in city
      
      const targetPosition = defensivePositions[positionIndex % defensivePositions.length];
      positionIndex++;
      
      this.addTask(
        new MoveUnitTask(this.ai, {
          unit,
          tile: targetPosition,
          priority: this.options.priority + 50,
        })
      );
    }
    
    this.state = "defending";
  }
  
  private getGeneralEnemyDirection(): TileCore | null {
    if (this.enemyUnits.length === 0) return null;
    
    // Find the average position of enemy units
    let sumX = 0;
    let sumY = 0;
    for (const enemy of this.enemyUnits) {
      sumX += enemy.tile.x;
      sumY += enemy.tile.y;
    }
    
    const avgX = Math.round(sumX / this.enemyUnits.length);
    const avgY = Math.round(sumY / this.enemyUnits.length);
    
    // Find closest tile to average position
    const map = this.ai.player.game.map;
    if (avgX >= 0 && avgX < map.width && avgY >= 0 && avgY < map.height) {
      return map.tiles[avgX][avgY];
    }
    
    return this.enemyUnits[0].tile;
  }
  
  private checkReinforcements() {
    // Check if we have enough defense now
    const currentDefense = this.assignedUnits.reduce(
      (sum, unit) => sum + unit.definition.strength,
      0
    );
    
    if (currentDefense >= this.requiredDefense || this.tasks.length === 0) {
      this.state = "positioning";
    }
  }
  
  private activeDefense() {
    // Remove dead units
    this.assignedUnits = this.assignedUnits.filter(u => u.health > 0);
    
    // Check for immediate threats adjacent to city
    const adjacentEnemies = this.options.city.tile.neighbours
      .flatMap(tile => tile.units)
      .filter(u => this.ai.player.isEnemyWith(u.player));
    
    if (adjacentEnemies.length > 0) {
      // Attack adjacent enemies
      for (const unit of this.assignedUnits) {
        if (unit.actionPointsLeft === 0) continue;
        
        // Find best target
        let bestTarget: UnitCore | null = null;
        let bestScore = -Infinity;
        
        for (const enemy of adjacentEnemies) {
          if (!unit.tile.neighbours.includes(enemy.tile)) continue;
          
          const combatResult = simulateCombat(unit, enemy.tile);
          if (!combatResult) continue;
          
          const score = combatResult.defender.damage - combatResult.attacker.damage;
          if (score > bestScore) {
            bestScore = score;
            bestTarget = enemy;
          }
        }
        
        if (bestTarget) {
          this.addTask(
            new MoveUnitTask(this.ai, {
              unit,
              tile: bestTarget.tile,
              priority: this.options.priority + 100,
            })
          );
        }
      }
    }
    
    // Reassess threats periodically
    this.state = "assessing";
  }
  
  cleanup() {
    // Release all assigned units
    for (const unit of this.assignedUnits) {
      this.ai.units.unassign(unit);
    }
  }
  
  serialize(): DefendCityTaskSerialized {
    return {
      city: tileToTileCoords(this.options.city.tile),
      state: this.state,
      assignedUnits: this.assignedUnits.map(u => unitToIdAndName(u)!).filter(u => u !== null) as UnitIdAndName[],
      threatLevel: this.threatLevel,
      requiredDefense: this.requiredDefense,
    };
  }
}