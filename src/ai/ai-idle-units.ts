import { CityCore } from "@/core/city";
import { findPath } from "@/core/pathfinding";
import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { UnitGroup } from "@/core/unitGroup";
import { SeaLevel } from "@/shared";
import { AISystem } from "./ai-system";
import { AiOrder } from "./types";

export class IdleUnitsAI extends AISystem {
  *plan(): Generator<AiOrder> {
    // Process all units that have no assignment
    for (const unit of this.ai.player.unitGroups) {
      // Skip if unit is assigned to a task
      if (this.ai.units.assignments.has(unit)) {
        continue;
      }

      const order = this.handleIdleUnit(unit);
      if (order) {
        yield order;
      }
    }

    // Also check units that are assigned but might be stuck or useless
    this.checkForUselessUnits();
  }

  private handleIdleUnit(unit: UnitGroup): AiOrder | null {
    // Handle based on unit traits
    if (unit.isExplorer) {
      return this.handleIdleExplorer(unit);
    } else if (unit.isWorker) {
      return this.handleIdleWorker(unit);
    } else if (unit.isMilitary) {
      return this.handleIdleMilitary(unit);
    } else if (unit.isTransport) {
      return this.handleIdleTransport(unit);
    }

    // Unknown unit type - send to nearest city
    return this.returnToNearestCity(unit);
  }

  private handleIdleExplorer(unit: UnitGroup): AiOrder | null {
    // Otherwise, return to nearest city to await reassignment
    return this.returnToNearestCity(unit);
  }

  private handleIdleWorker(unit: UnitGroup): AiOrder | null {
    // Check if there are any improvements needed in the empire
    const hasWorkToDo = this.ai.player.cities.some((city) => {
      // Simple check - see if city has unimproved tiles
      const unimprovedTiles = Array.from(city.tile.getTilesInRange(2)).filter(
        (t: TileCore) => t.areaOf === city && !t.improvement,
      );
      return unimprovedTiles.length > 0;
    });

    if (!hasWorkToDo) {
      return null;
    }

    // Return to nearest city that needs improvements
    const cityNeedingWork = this.findNearestCityNeedingWork(unit);
    if (cityNeedingWork) {
      return this.moveToCity(unit, cityNeedingWork);
    }

    return this.returnToNearestCity(unit);
  }

  private handleIdleMilitary(unit: UnitGroup): AiOrder | null {
    // Find the nearest city that needs garrison
    const undefendedCity = this.findNearestUndefendedCity(unit);
    if (undefendedCity) {
      return this.moveToCity(unit, undefendedCity);
    }

    // If all cities are defended, position at border cities
    const borderCity = this.findNearestBorderCity(unit);
    if (borderCity) {
      return this.moveToCity(unit, borderCity);
    }

    return this.returnToNearestCity(unit);
  }

  private handleIdleTransport(unit: UnitGroup): AiOrder | null {
    // Check if any units need transport
    const hasTransportDemand = this.ai.player.units.some(
      (u) =>
        u.isLand &&
        u.tile.passableArea !== this.ai.player.empireCenter?.passableArea,
    );

    if (!hasTransportDemand) {
      return null;
    }

    // Return to nearest coastal city
    const coastalCity = this.findNearestCoastalCity(unit);
    if (coastalCity) {
      return this.moveToCity(unit, coastalCity);
    }

    return null;
  }

  private returnToNearestCity(unit: UnitGroup): AiOrder | null {
    const nearestCity = this.findNearestCity(unit);
    if (!nearestCity) {
      return null;
    }

    return this.moveToCity(unit, nearestCity);
  }

  private moveToCity(unit: UnitGroup, city: CityCore): AiOrder {
    return {
      group: "unit",
      entityId: unit.id,
      focus: "economy",
      priority: 10, // Low priority
      perform: () => {
        const path = findPath(unit, city.tile);
        if (path) {
          unit.path = path;
          unit.setOrder("go");
        }
      },
    };
  }

  private destroyUnit(unit: UnitCore, reason: string): AiOrder {
    return {
      group: "unit",
      entityId: unit.id,
      focus: "economy",
      priority: 5,
      perform: () => {
        console.log(
          `Destroying idle ${unit.definition.id} at ${unit.tile.id}: ${reason}`,
        );
        unit.destroy();
      },
    };
  }

  private checkForUselessUnits(): void {
    // Check for units that have been assigned but haven't moved in many turns
    // This would require tracking unit positions over time, which could be added later
  }

  private countUnexploredTilesInArea(area: any): number {
    let unexplored = 0;
    for (const row of this.ai.player.game.map.tiles) {
      for (const tile of row) {
        if (
          tile.passableArea === area &&
          !this.ai.player.exploredTiles.has(tile)
        ) {
          unexplored++;
        }
      }
    }
    return unexplored;
  }

  private isAreaIsolated(area: any): boolean {
    // Check if area has no cities and no way to reach it without naval transport
    const hasCities = this.ai.player.cities.some(
      (city) => city.tile.passableArea === area,
    );
    if (hasCities) return false;

    // Check if it's a small island
    return area.type === "land" && area.area < 50;
  }

  private findNearestCity(unit: UnitGroup): CityCore | null {
    let nearest: CityCore | null = null;
    let minDistance = Infinity;

    for (const city of this.ai.player.cities) {
      const distance = unit.tile.getDistanceTo(city.tile);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = city;
      }
    }

    return nearest;
  }

  private findNearestCityNeedingWork(unit: UnitGroup): CityCore | null {
    let nearest: CityCore | null = null;
    let minDistance = Infinity;

    for (const city of this.ai.player.cities) {
      // Simple check - see if city has unimproved tiles
      const unimprovedTiles = Array.from(city.tile.getTilesInRange(2)).filter(
        (t: TileCore) => t.areaOf === city && !t.improvement,
      );

      if (unimprovedTiles.length > 0) {
        const distance = unit.tile.getDistanceTo(city.tile);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = city;
        }
      }
    }

    return nearest;
  }

  private findNearestUndefendedCity(unit: UnitGroup): CityCore | null {
    let nearest: CityCore | null = null;
    let minDistance = Infinity;

    for (const city of this.ai.player.cities) {
      const garrison = city.tile.units.filter((u) => u.isMilitary).length;
      if (garrison === 0) {
        const distance = unit.tile.getDistanceTo(city.tile);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = city;
        }
      }
    }

    return nearest;
  }

  private findNearestBorderCity(unit: UnitGroup): CityCore | null {
    // Find cities that are close to the edge of our territory
    let nearest: CityCore | null = null;
    let minDistance = Infinity;

    for (const city of this.ai.player.cities) {
      const isBorder = Array.from(city.tile.getTilesInRange(3)).some(
        (tile: TileCore) =>
          tile.areaOf && tile.areaOf.player !== this.ai.player,
      );

      if (isBorder) {
        const distance = unit.tile.getDistanceTo(city.tile);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = city;
        }
      }
    }

    return nearest;
  }

  private findNearestCoastalCity(unit: UnitGroup): CityCore | null {
    let nearest: CityCore | null = null;
    let minDistance = Infinity;

    for (const city of this.ai.player.cities) {
      const isCoastal = city.tile.neighbours.some(
        (n) => n.seaLevel !== SeaLevel.none,
      );
      if (isCoastal) {
        const distance = unit.tile.getDistanceTo(city.tile);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = city;
        }
      }
    }

    return nearest;
  }
}
