import { AISystem } from "./ai-system";
import { AiOperation } from "./types";
import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { dataManager } from "@/core/data/dataManager";
import { findPath } from "@/core/pathfinding";
import { LandForm, SeaLevel } from "@/shared";

interface SettlingTarget {
  tile: TileCore;
  score: number;
  assignedSettler?: UnitCore;
}

export class SettlingAI extends AISystem {
  private targetLocations: SettlingTarget[] = [];

  private readonly MIN_CITY_DISTANCE = 6;

  private readonly ANY_CITY_DISTANCE_PENALTY_FACTOR = 0.05;
  private readonly EMPIRE_CENTER_DISTANCE_PENALTY_FACTOR = 0.01;

  plan(): AiOperation[] {
    this.operations = [];

    this.validateTargets();

    if (this.targetLocations.length < 3) {
      this.findNewTargets();
    }

    this.handleStartingSettler();

    this.planSettlersMovement();

    this.requestSettlerProduction();

    return this.operations;
  }

  private validateTargets(): void {
    this.targetLocations = this.targetLocations.filter((target) => {
      if (target.tile.areaOf) {
        if (target.assignedSettler) {
          target.assignedSettler = undefined;
        }
        return false;
      }

      return true;
    });
  }

  private findNewTargets(): void {
    const candidateTiles: SettlingTarget[] = [];

    if (this.player.cities.length === 0) {
      return;
    }

    for (const tile of this.player.exploredTiles) {
      if (
        tile.areaOf ||
        tile.landForm === LandForm.mountains ||
        tile.seaLevel !== SeaLevel.none
      ) {
        continue;
      }

      if (this.isTooCloseToTargets(tile)) {
        continue;
      }

      let score = tile.sweetSpotValue;

      score *= this.calculateTileScorePenalty(tile);

      candidateTiles.push({ tile, score });
    }

    candidateTiles.sort((a, b) => b.score - a.score);

    const availableSlots = 3 - this.targetLocations.length;
    for (let i = 0; i < Math.min(availableSlots, candidateTiles.length); i++) {
      this.targetLocations.push(candidateTiles[i]);
    }
  }

  private isTooCloseToTargets(tile: TileCore): boolean {
    for (const target of this.targetLocations) {
      const distance = tile.getDistanceTo(target.tile);

      if (distance < this.MIN_CITY_DISTANCE) {
        return true;
      }
    }

    for (const city of this.player.cities) {
      const distance = tile.getDistanceTo(city.tile);
      if (distance < this.MIN_CITY_DISTANCE) {
        return true;
      }
    }

    return false;
  }

  private calculateTileScorePenalty(tile: TileCore): number {
    if (this.player.cities.length === 0) {
      return 1;
    }

    const anyCityMinDistance = this.getAnyCityDistance(tile);

    let empireCenterDistance = 0;
    if (this.player.empireCenter) {
      empireCenterDistance = tile.getDistanceTo(this.player.empireCenter);
    }

    return (
      1 -
      this.ANY_CITY_DISTANCE_PENALTY_FACTOR * anyCityMinDistance -
      this.EMPIRE_CENTER_DISTANCE_PENALTY_FACTOR * empireCenterDistance
    );
  }

  private getAnyCityDistance(tile: TileCore): number {
    let minDistance = Infinity;

    for (const city of this.player.cities) {
      const distance = tile.getDistanceTo(city.tile);
      minDistance = Math.min(minDistance, distance);
    }

    return minDistance;
  }

  private handleStartingSettler(): void {
    if (this.player.cities.length > 0) {
      return;
    }

    const settlers = this.ai.units.freeByTrait.settler;

    if (settlers.size > 0) {
      const settler = Array.from(settlers)[0];

      this.operations.push({
        group: "unit",
        focus: "expansion",
        entityId: settler.id,
        priority: 100,
        perform: () => {
          if (settler.canDoAction("foundCity")) {
            settler.doAction("foundCity");
          }
        },
      });
    }
  }

  private planSettlersMovement(): void {
    const settlers = this.ai.units.freeByTrait.settler;

    for (const settler of settlers) {
      let hasTarget = false;
      for (const target of this.targetLocations) {
        if (target.assignedSettler === settler) {
          hasTarget = true;
          break;
        }
      }

      if (!hasTarget) {
        const availableTargets = this.targetLocations.filter(
          (t) => !t.assignedSettler,
        );

        if (availableTargets.length > 0) {
          availableTargets[0].assignedSettler = settler;
        }
      }
    }

    for (const target of this.targetLocations) {
      if (target.assignedSettler) {
        const settler = target.assignedSettler;

        if (settler.tile === target.tile) {
          if (settler.canDoAction("foundCity")) {
            this.operations.push({
              group: "unit",
              focus: "expansion",
              entityId: settler.id,
              priority: 100,
              perform: () => {
                settler.doAction("foundCity");
              },
            });
          }
        } else {
          this.operations.push({
            group: "unit",
            focus: "expansion",
            entityId: settler.id,
            priority: 50,
            perform: () => {
              // Set the unit's order to move to the target
              if (settler.order !== "go" || !settler.path) {
                settler.path = findPath(settler, target.tile);
                settler.setOrder("go");
              }
            },
          });
        }
      }
    }
  }

  private requestSettlerProduction(): void {
    const unassignedTargets = this.targetLocations.filter(
      (t) => !t.assignedSettler,
    );

    const settlerDefinition = dataManager.units.get("unit_settler");

    if (unassignedTargets.length > 0 && settlerDefinition) {
      this.ai.productionAi.request({
        focus: "expansion",
        priority: this.player.cities.length < 3 ? 100 : 50,
        product: settlerDefinition,
      });
    }
  }
}
