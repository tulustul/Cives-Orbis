import { TileCore } from "@/core/tile";
import { LandForm, SeaLevel } from "@/shared";
import { AISystem } from "./ai-system";
import { SettleTask } from "./tasks/settleTask";
import { AiTask } from "./tasks/task";

type SettleCandidate = {
  tile: TileCore;
  score: number;
};

const MIN_CITY_DISTANCE = 6;
const ANY_CITY_DISTANCE_PENALTY_FACTOR = 0.05;
const EMPIRE_CENTER_DISTANCE_PENALTY_FACTOR = 0.01;
const CONCURRENT_TASKS = 1;

export class SettlingAI extends AISystem {
  private tasks: SettleTask[] = [];

  *plan(): Generator<AiTask<any, any>> {
    this.tasks = this.tasks.filter((op) => op.result === null);

    this.handleStartingSettler();

    if (!this.ai.features.knowSettlers) {
      return;
    }

    if (this.tasks.length < CONCURRENT_TASKS) {
      yield* this.generateSettleOperations();
    }
  }

  private *generateSettleOperations(): Generator<SettleTask> {
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

      if (this.ai.tiles.isExcluded(tile, "settling")) {
        continue;
      }

      if (this.isTooCloseToTargets(tile)) {
        continue;
      }

      let score =
        tile.sweetSpotValue - this.ai.mapAnalysis.heatMap.getThreatLevel(tile);

      score *= this.calculateTileScorePenalty(tile);

      candidateTiles.push({ tile, score });
    }

    candidateTiles.sort((a, b) => b.score - a.score);

    const availableSlots = 3 - this.tasks.length;
    for (let i = 0; i < Math.min(availableSlots, candidateTiles.length); i++) {
      const tile = candidateTiles[i].tile;
      const settleOperation = new SettleTask(this.ai, {
        tile,
        onFail: () => {
          this.ai.tiles.exclude(tile, "settling");
        },
      });
      this.tasks.push(settleOperation);
      yield settleOperation;
    }
  }

  private isTooCloseToTargets(tile: TileCore): boolean {
    for (const settlingTile of this.ai.tiles.byAssignment.settling) {
      if (settlingTile.getDistanceTo(tile) < MIN_CITY_DISTANCE) {
        return true;
      }
    }

    // for (const target of this.tasks) {
    //   const distance = tile.getDistanceTo(target.options.tile);

    //   if (distance < MIN_CITY_DISTANCE) {
    //     return true;
    //   }
    // }

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
