import { CityCore } from "@/core/city";
import { PlayerCore } from "@/core/player";
import { HeatMap } from "./heatMap";
import { PlainCityAssessment } from "@/shared";

export type CityAssessment = PlainCityAssessment & {
  city: CityCore;
};

const MAX_ATTACK_DISTANCE = 20;

export class MapAnalysis {
  public heatMap: HeatMap;

  public attackTargets: CityAssessment[] = [];
  public defenseTargets: CityAssessment[] = [];

  constructor(private player: PlayerCore) {
    this.heatMap = new HeatMap(player);
  }

  update() {
    this.heatMap.update();
    this.computeAttackTargets();
    this.computeDefenseTargets();
  }

  private computeAttackTargets() {
    this.attackTargets = [];

    for (const city of this.player.game.citiesManager.cities) {
      if (!this.player.isEnemyWith(city.player)) continue;

      if (!this.player.exploredTiles.has(city.tile)) continue;

      const assessment = this.assessAttackTarget(city, MAX_ATTACK_DISTANCE);
      if (assessment && assessment.score > 0) {
        this.attackTargets.push(assessment);
      }
    }

    this.attackTargets.sort((a, b) => b.score - a.score);
  }

  private computeDefenseTargets() {
    this.defenseTargets = [];

    for (const city of this.player.cities) {
      const assessment = this.assessDefenseTarget(city);

      const threatRatio =
        assessment.enemyInfluence / assessment.friendlyInfluence;

      if (threatRatio > 1.0) {
        this.defenseTargets.push(assessment);
      }
    }

    this.defenseTargets.sort((a, b) => {
      const threatA = a.enemyInfluence / Math.max(1, a.friendlyInfluence);
      const threatB = b.enemyInfluence / Math.max(1, b.friendlyInfluence);
      return threatB - threatA;
    });
  }

  private assessAttackTarget(
    city: CityCore,
    maxDistance: number,
  ): CityAssessment | null {
    // Calculate distance from nearest friendly city
    let closestCityDistance = Infinity;
    for (const friendlyCity of this.player.cities) {
      const distance = city.tile.getDistanceTo(friendlyCity.tile);
      if (distance < closestCityDistance) {
        closestCityDistance = distance;
      }
    }

    if (closestCityDistance > maxDistance) {
      return null;
    }

    let empireDistance = 0;
    if (this.player.empireCenter) {
      empireDistance = city.tile.getDistanceTo(this.player.empireCenter);
    }

    const distance = (empireDistance + closestCityDistance) / 2;

    // Sample heat map around the city
    const influences = this.sampleInfluence(city);

    // Calculate effort (how hard to capture)
    const cityDefense =
      city.defense.strength * (city.defense.health / city.defense.maxHealth);
    const effort = cityDefense + influences.enemy - influences.friendly * 0.5;

    // Calculate final score
    const distancePenalty = 1 - distance / (maxDistance / 2);
    const score =
      (city.value / 3 / Math.max(1, effort)) * distancePenalty * 100;

    return {
      city,
      effort,
      value: city.value,
      score,
      distance,
      friendlyInfluence: influences.friendly,
      enemyInfluence: influences.enemy,
    };
  }

  private assessDefenseTarget(city: CityCore): CityAssessment {
    const influences = this.sampleInfluence(city);

    // No distance calculation needed for defense
    const distance = 0;

    // Effort represents how much force we need to defend
    const effort = influences.enemy;

    // Score for defense is threat level weighted by city importance
    const score =
      (influences.enemy / Math.max(1, influences.friendly)) * city.value;

    return {
      city,
      effort,
      value: city.value,
      score,
      distance,
      friendlyInfluence: influences.friendly,
      enemyInfluence: influences.enemy,
    };
  }

  private sampleInfluence(city: CityCore): {
    friendly: number;
    enemy: number;
  } {
    const influence = this.heatMap.getTileInfluence(city.tile);

    return {
      friendly: influence?.friendly.total ?? 0,
      enemy: influence?.enemy.total ?? 0,
    };
  }
}
