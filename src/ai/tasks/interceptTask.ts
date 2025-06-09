import { UnitCore } from "@/core/unit";
import { TileCore } from "@/core/tile";
import { CityCore } from "@/core/city";
import { AiTask, AiTaskOptions } from "./task";
import { MoveUnitTask } from "./moveUnitTask";
import { unitToIdAndName } from "@/core/serialization/channel";
import { UnitIdAndName } from "@/shared";
import { findPath } from "@/core/pathfinding";

export type InterceptTaskOptions = AiTaskOptions & {
  target: UnitCore;
  priority: number;
};

export type InterceptTaskSerialized = {
  target: UnitIdAndName;
  state: InterceptState;
  interceptors: UnitIdAndName[];
  lastKnownPosition: { x: number; y: number } | null;
};

type InterceptState = 
  | "tracking"
  | "predicting"
  | "intercepting"
  | "engaging"
  | "completed";

export class InterceptTask extends AiTask<InterceptTaskOptions, InterceptTaskSerialized> {
  readonly type = "intercept";
  
  private state: InterceptState = "tracking";
  private interceptors: UnitCore[] = [];
  private lastKnownPosition: TileCore | null = null;
  private predictedPath: TileCore[] = [];
  
  init() {
    // Find suitable interceptors
    this.selectInterceptors();
    
    if (this.interceptors.length === 0) {
      this.fail("No interceptors available");
    }
  }
  
  tick() {
    // Check if target still exists
    if (this.options.target.health <= 0) {
      return this.complete();
    }
    
    // Remove dead interceptors
    this.interceptors = this.interceptors.filter(u => u.health > 0);
    if (this.interceptors.length === 0) {
      return this.fail("All interceptors eliminated");
    }
    
    switch (this.state) {
      case "tracking":
        return this.trackTarget();
      case "predicting":
        return this.predictTargetPath();
      case "intercepting":
        return this.moveToIntercept();
      case "engaging":
        return this.engageTarget();
    }
  }
  
  private selectInterceptors() {
    const target = this.options.target;
    const searchRadius = 15;
    
    // Find military units within reasonable distance
    const candidates: { unit: UnitCore; distance: number }[] = [];
    
    for (const unit of this.ai.units.freeByTrait.military) {
      if (unit.parent) continue; // Skip units in transports
      if (unit.actionPointsLeft === 0) continue;
      
      const distance = unit.tile.getDistanceTo(target.tile);
      if (distance > searchRadius) continue;
      
      // Prefer fast units for interception
      candidates.push({ unit, distance });
    }
    
    // Sort by distance (closest first)
    candidates.sort((a, b) => a.distance - b.distance);
    
    // Select up to 3 interceptors
    const maxInterceptors = 3;
    for (let i = 0; i < Math.min(candidates.length, maxInterceptors); i++) {
      const unit = candidates[i].unit;
      this.interceptors.push(unit);
      this.ai.units.assign(unit, "intercept");
    }
  }
  
  private trackTarget() {
    const target = this.options.target;
    
    // Update last known position
    this.lastKnownPosition = target.tile;
    
    // Check if any interceptor can see the target
    const canSeeTarget = this.interceptors.some(() => 
      this.ai.player.exploredTiles.has(target.tile)
    );
    
    if (!canSeeTarget) {
      // Lost visual, try to predict where target went
      this.state = "predicting";
    } else {
      // Can see target, move to intercept
      this.state = "intercepting";
    }
  }
  
  private predictTargetPath() {
    if (!this.lastKnownPosition) {
      return this.fail("Lost target");
    }
    
    const target = this.options.target;
    
    // Simple prediction: assume target is moving towards nearest enemy city
    const enemyCities: CityCore[] = [];
    for (const player of this.ai.player.game.players) {
      if (this.ai.player.isEnemyWith(player)) {
        enemyCities.push(...player.cities);
      }
    }
    
    if (enemyCities.length === 0) {
      // No cities to predict, just go to last known position
      this.predictedPath = [this.lastKnownPosition];
    } else {
      // Find closest enemy city to target
      let closestCity = enemyCities[0];
      let closestDistance = this.lastKnownPosition.getDistanceTo(closestCity.tile);
      
      for (const city of enemyCities) {
        const distance = this.lastKnownPosition.getDistanceTo(city.tile);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestCity = city;
        }
      }
      
      // Predict path from last known position to city
      const path = findPath(
        { tile: this.lastKnownPosition, player: target.player } as UnitCore,
        closestCity.tile
      );
      
      this.predictedPath = (path && path.length > 0) ? path : [this.lastKnownPosition];
    }
    
    this.state = "intercepting";
  }
  
  private moveToIntercept() {
    const target = this.options.target;
    
    // If we can see the target, update position
    if (this.ai.player.exploredTiles.has(target.tile)) {
      this.lastKnownPosition = target.tile;
    }
    
    // Calculate intercept points for each interceptor
    for (const interceptor of this.interceptors) {
      const interceptPoint = this.calculateInterceptPoint(interceptor);
      
      if (!interceptPoint) continue;
      
      // Check if already adjacent to target
      if (interceptor.tile.neighbours.includes(target.tile)) {
        this.state = "engaging";
        continue;
      }
      
      // Move towards intercept point
      this.addTask(
        new MoveUnitTask(this.ai, {
          unit: interceptor,
          tile: interceptPoint,
          priority: this.options.priority + 50,
        })
      );
    }
    
    // Check if any interceptor is adjacent to target
    const anyAdjacent = this.interceptors.some(unit =>
      unit.tile.neighbours.includes(target.tile)
    );
    
    if (anyAdjacent) {
      this.state = "engaging";
    }
  }
  
  private calculateInterceptPoint(interceptor: UnitCore): TileCore | null {
    const target = this.options.target;
    
    // If we can see the target, intercept directly
    if (this.ai.player.exploredTiles.has(target.tile)) {
      return target.tile;
    }
    
    // Otherwise use predicted path
    if (this.predictedPath.length > 0) {
      // Find the point on predicted path we can reach fastest
      let bestPoint = this.predictedPath[0];
      let bestTime = Infinity;
      
      for (const point of this.predictedPath) {
        const distance = interceptor.tile.getDistanceTo(point);
        const targetDistance = this.lastKnownPosition ? 
          this.lastKnownPosition.getDistanceTo(point) : 0;
        
        // Estimate time to reach this point
        const interceptorTime = distance / interceptor.definition.actionPoints;
        const targetTime = targetDistance / target.definition.actionPoints;
        
        if (interceptorTime < targetTime && interceptorTime < bestTime) {
          bestTime = interceptorTime;
          bestPoint = point;
        }
      }
      
      return bestPoint;
    }
    
    return this.lastKnownPosition;
  }
  
  private engageTarget() {
    const target = this.options.target;
    
    // Attack with all adjacent interceptors
    for (const interceptor of this.interceptors) {
      if (!interceptor.tile.neighbours.includes(target.tile)) continue;
      if (interceptor.actionPointsLeft === 0) continue;
      
      this.addTask(
        new MoveUnitTask(this.ai, {
          unit: interceptor,
          tile: target.tile,
          priority: this.options.priority + 100,
        })
      );
    }
    
    // If target survived, go back to intercepting
    if (target.health > 0) {
      this.state = "intercepting";
    } else {
      this.complete();
    }
  }
  
  cleanup() {
    // Release all interceptors
    for (const unit of this.interceptors) {
      this.ai.units.unassign(unit);
    }
  }
  
  serialize(): InterceptTaskSerialized {
    return {
      target: unitToIdAndName(this.options.target),
      state: this.state,
      interceptors: this.interceptors.map(unitToIdAndName),
      lastKnownPosition: this.lastKnownPosition ? {
        x: this.lastKnownPosition.x,
        y: this.lastKnownPosition.y
      } : null,
    };
  }
}