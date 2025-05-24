import { AIPlayer } from "./ai-player";
import { AISystem } from "./ai-system";
import { AiOperation } from "./types";
import { PlayerCore } from "@/core/player";
import { VictoryType } from "./utils";

export type StategicFocus = "conquest" | "economic" | "scientific" | "balanced";

/**
 * Represents the high-level strategic AI that coordinates other AI subsystems
 * and manages long-term planning and victory condition assessment.
 */
export class StrategicAI extends AISystem {
  // Track the current strategic focus for this AI player
  strategicFocus: StategicFocus = "balanced";

  // Track potential threats from other players
  private threatAssessments = new Map<PlayerCore, number>();

  // Victory progress tracking
  private victoryProgress = new Map<VictoryType, number>();

  constructor(ai: AIPlayer) {
    super(ai);
    this.initializeVictoryTracking();
  }

  /**
   * Initialize victory condition tracking
   */
  private initializeVictoryTracking() {
    // Initialize with 0 progress for each victory type
    this.victoryProgress.set(VictoryType.conquest, 0);
    this.victoryProgress.set(VictoryType.science, 0);
    this.victoryProgress.set(VictoryType.cultural, 0);
    this.victoryProgress.set(VictoryType.economic, 0);
  }

  /**
   * Main planning method for the Strategic AI
   */
  plan(): AiOperation[] {
    this.operations = [];

    // Analyze the current game state
    this.assessThreats();
    this.updateVictoryProgress();
    this.determineStrategicFocus();

    // Update AI priorities based on current focus
    this.updateAIPriorities();

    return this.operations;
  }

  /**
   * Assess threats from other players
   */
  private assessThreats() {
    this.threatAssessments.clear();

    for (const player of this.player.game.players) {
      if (player === this.player) continue;

      let threatLevel = 0;

      // Evaluate military threat
      const militaryPower = player.units.reduce(
        (sum, unit) => sum + (unit.isMilitary ? unit.definition.strength : 0),
        0,
      );

      // Evaluate scientific threat
      const techCount = player.knowledge.discoveredTechs.size;

      // Evaluate economic threat
      const cityCount = player.cities.length;
      const totalPopulation = player.cities.reduce(
        (sum, city) => sum + city.population.total,
        0,
      );

      // Calculate overall threat
      threatLevel =
        militaryPower * 0.5 +
        techCount * 10 +
        cityCount * 15 +
        totalPopulation * 2;

      // Adjust based on distance (not implemented yet)
      // TODO: Add distance modifier when border calculations are available

      this.threatAssessments.set(player, threatLevel);
    }
  }

  /**
   * Update tracking of progress toward different victory conditions
   */
  private updateVictoryProgress() {
    // Conquest progress (percentage of players eliminated or percentage of total cities controlled)
    const totalCities = this.player.game.players.reduce(
      (sum, p) => sum + p.cities.length,
      0,
    );
    const conquestProgress =
      (this.player.cities.length / Math.max(1, totalCities)) * 100;
    this.victoryProgress.set(VictoryType.conquest, conquestProgress);

    // Science progress (percentage of technology tree researched)
    const discoveredTechs = this.player.knowledge.discoveredTechs.size;
    // FIXME: Add proper totalTechs calculation when available
    const totalTechs = 30; // Placeholder
    const scienceProgress = (discoveredTechs / Math.max(1, totalTechs)) * 100;
    this.victoryProgress.set(VictoryType.science, scienceProgress);

    // Cultural progress (placeholder - would need culture system)
    this.victoryProgress.set(VictoryType.cultural, 0);

    // Economic progress (placeholder based on total income)
    const economicScore = 0; // Placeholder
    this.victoryProgress.set(VictoryType.economic, economicScore > 0 ? 50 : 0); // Placeholder
  }

  /**
   * Determine the best strategic focus based on current game state
   */
  private determineStrategicFocus() {
    // Get current progress for each victory type
    const conquestProgress =
      this.victoryProgress.get(VictoryType.conquest) || 0;
    const scienceProgress = this.victoryProgress.get(VictoryType.science) || 0;
    const economicProgress =
      this.victoryProgress.get(VictoryType.economic) || 0;

    // Get highest threat value
    const maxThreat = Math.max(...Array.from(this.threatAssessments.values()));

    // Determine strategic focus based on progress and threats
    if (maxThreat > 200 && this.player.cities.length > 0) {
      // High threat - focus on military
      this.strategicFocus = "conquest";
    } else if (
      scienceProgress > conquestProgress &&
      scienceProgress > economicProgress
    ) {
      // Science is our best path to victory
      this.strategicFocus = "scientific";
    } else if (
      economicProgress > conquestProgress &&
      this.player.cities.length >= 3
    ) {
      // Economic focus for established empires
      this.strategicFocus = "economic";
    } else if (conquestProgress > 40) {
      // We're already on a good conquest path
      this.strategicFocus = "conquest";
    } else {
      // Default to balanced approach in early game
      this.strategicFocus = "balanced";
    }
  }

  /**
   * Update priorities in the AI player based on strategic focus
   */
  private updateAIPriorities() {
    const priorities = this.ai.priorities;

    switch (this.strategicFocus) {
      case "conquest":
        priorities.military = 2.0;
        priorities.expansion = 1.0;
        priorities.economy = 0.8;
        break;

      case "scientific":
        priorities.economy = 1.5;
        priorities.expansion = 1.2;
        priorities.military = 0.7;
        break;

      case "economic":
        priorities.economy = 2.0;
        priorities.expansion = 1.5;
        priorities.military = 0.5;
        break;

      case "balanced":
      default:
        priorities.expansion = 1.2;
        priorities.economy = 1.2;
        priorities.military = 1.0;
        break;
    }
  }

  /**
   * Get the current highest threat player
   */
  getHighestThreatPlayer(): PlayerCore | null {
    let highestThreat = 0;
    let highestThreatPlayer: PlayerCore | null = null;

    for (const [player, threat] of this.threatAssessments.entries()) {
      if (threat > highestThreat) {
        highestThreat = threat;
        highestThreatPlayer = player;
      }
    }

    return highestThreatPlayer;
  }

  /**
   * Get threat level for a specific player
   */
  getThreatLevel(player: PlayerCore): number {
    return this.threatAssessments.get(player) || 0;
  }

  /**
   * Get progress toward a specific victory type
   */
  getVictoryProgress(victoryType: VictoryType): number {
    return this.victoryProgress.get(victoryType) || 0;
  }
}
