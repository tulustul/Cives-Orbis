import { UnitCore } from "@/core/unit";
import { CityCore } from "@/core/city";
import { TileCore } from "@/core/tile";
import { AISystem } from "./ai-system";
import { AiOrder } from "./types";
import { findPath } from "@/core/pathfinding";
import { SeaLevel } from "@/shared";

export class IdleUnitsAI extends AISystem {
  *plan(): Generator<AiOrder> {
    // Process all units that have no assignment
    for (const unit of this.ai.player.units) {
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

  private handleIdleUnit(unit: UnitCore): AiOrder | null {
    // Handle based on unit traits
    if (unit.isExplorer) {
      return this.handleIdleExplorer(unit);
    } else if (unit.definition.traits.includes("worker")) {
      return this.handleIdleWorker(unit);
    } else if (unit.isMilitary) {
      return this.handleIdleMilitary(unit);
    } else if (unit.isTransport) {
      return this.handleIdleTransport(unit);
    }

    // Unknown unit type - send to nearest city
    return this.returnToNearestCity(unit);
  }

  private handleIdleExplorer(unit: UnitCore): AiOrder | null {
    // Check if the area is fully explored
    const area = unit.tile.passableArea;
    if (!area) {
      return this.destroyUnit(unit, "No passable area");
    }

    const unexploredInArea = this.countUnexploredTilesInArea(area);

    // If area is tiny and fully explored, destroy the explorer
    if (area.area < 10 && unexploredInArea === 0) {
      return this.destroyUnit(unit, "Tiny area fully explored");
    }

    // If area is mostly explored and isolated, destroy the explorer
    if (unexploredInArea < area.area * 0.1 && this.isAreaIsolated(area)) {
      return this.destroyUnit(unit, "Isolated area mostly explored");
    }

    // Otherwise, return to nearest city to await reassignment
    return this.returnToNearestCity(unit);
  }

  private handleIdleWorker(unit: UnitCore): AiOrder | null {
    // Check if there are any improvements needed in the empire
    const hasWorkToDo = this.ai.player.cities.some((city) => {
      // Simple check - see if city has unimproved tiles
      const unimprovedTiles = Array.from(city.tile.getTilesInRange(2)).filter(
        (t: TileCore) => t.areaOf === city && !t.improvement,
      );
      return unimprovedTiles.length > 0;
    });

    if (!hasWorkToDo) {
      // No work available, consider destroying if we have too many workers
      const workerCount = Array.from(this.ai.player.units).filter((u) =>
        u.definition.traits.includes("worker"),
      ).length;
      const cityCount = this.ai.player.cities.length;

      if (workerCount > cityCount * 2) {
        return this.destroyUnit(unit, "Excess worker");
      }
    }

    // Return to nearest city that needs improvements
    const cityNeedingWork = this.findNearestCityNeedingWork(unit);
    if (cityNeedingWork) {
      return this.moveToCity(unit, cityNeedingWork);
    }

    return this.returnToNearestCity(unit);
  }

  private handleIdleMilitary(unit: UnitCore): AiOrder | null {
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

    // Too many military units and no threats
    const militaryCount = Array.from(this.ai.player.units).filter(
      (u) => u.isMilitary,
    ).length;
    const cityCount = this.ai.player.cities.length;

    if (militaryCount > cityCount * 3) {
      return this.destroyUnit(unit, "Excess military");
    }

    return this.returnToNearestCity(unit);
  }

  private handleIdleTransport(unit: UnitCore): AiOrder | null {
    // Check if any units need transport
    const hasTransportDemand = this.ai.player.units.some(
      (u) =>
        u.isLand &&
        u.tile.passableArea !== this.ai.player.empireCenter?.passableArea,
    );

    if (!hasTransportDemand) {
      // No transport needed, check if we have too many transports
      const transportCount = Array.from(this.ai.player.units).filter(
        (u) => u.isTransport,
      ).length;
      const navalExplorationNeeded = Array.from(
        this.ai.player.knownPassableAreas.values(),
      ).filter((area) => area.type === "water" && area.area > 50).length;

      if (transportCount > Math.max(2, navalExplorationNeeded)) {
        return this.destroyUnit(unit, "Excess transport");
      }
    }

    // Return to nearest coastal city
    const coastalCity = this.findNearestCoastalCity(unit);
    if (coastalCity) {
      return this.moveToCity(unit, coastalCity);
    }

    return null;
  }

  private returnToNearestCity(unit: UnitCore): AiOrder | null {
    const nearestCity = this.findNearestCity(unit);
    if (!nearestCity) {
      // No cities at all - this shouldn't happen but destroy unit if it does
      return this.destroyUnit(unit, "No cities exist");
    }

    return this.moveToCity(unit, nearestCity);
  }

  private moveToCity(unit: UnitCore, city: CityCore): AiOrder {
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

  private findNearestCity(unit: UnitCore): CityCore | null {
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

  private findNearestCityNeedingWork(unit: UnitCore): CityCore | null {
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

  private findNearestUndefendedCity(unit: UnitCore): CityCore | null {
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

  private findNearestBorderCity(unit: UnitCore): CityCore | null {
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

  private findNearestCoastalCity(unit: UnitCore): CityCore | null {
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
