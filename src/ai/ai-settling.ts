import { TileCore } from "@/core/tile";
import { LandForm, SeaLevel } from "@/shared";
import { AISystem } from "./ai-system";
import { AiOperation, AiOperationState } from "./operations/baseOperation";
import { SettleOperation } from "./operations/settleOperation";

type SettleCandidate = {
  tile: TileCore;
  score: number;
};

const MIN_CITY_DISTANCE = 6;
const ANY_CITY_DISTANCE_PENALTY_FACTOR = 0.05;
const EMPIRE_CENTER_DISTANCE_PENALTY_FACTOR = 0.01;

export class SettlingAI extends AISystem {
  private operations: SettleOperation[] = [];

  *plan(): Generator<AiOperation> {
    this.operations = this.operations.filter(
      (op) => op.state === AiOperationState.active,
    );

    if (this.operations.length < 3) {
      yield* this.generateSettleOperations();
    }

    this.handleStartingSettler();
  }

  private *generateSettleOperations(): Generator<SettleOperation> {
    const candidateTiles: SettleCandidate[] = [];

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

    const availableSlots = 3 - this.operations.length;
    for (let i = 0; i < Math.min(availableSlots, candidateTiles.length); i++) {
      const settleOperation = new SettleOperation(this.ai, {
        tile: candidateTiles[i].tile,
      });
      this.operations.push(settleOperation);
      yield settleOperation;
    }
  }

  private isTooCloseToTargets(tile: TileCore): boolean {
    for (const target of this.operations) {
      const distance = tile.getDistanceTo(target.options.tile);

      if (distance < MIN_CITY_DISTANCE) {
        return true;
      }
    }

    for (const city of this.player.cities) {
      const distance = tile.getDistanceTo(city.tile);
      if (distance < MIN_CITY_DISTANCE) {
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
      ANY_CITY_DISTANCE_PENALTY_FACTOR * anyCityMinDistance -
      EMPIRE_CENTER_DISTANCE_PENALTY_FACTOR * empireCenterDistance
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
      settler.doAction("foundCity");
    }
  }
}
