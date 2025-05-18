import { PlayerCore } from "@/core/player";
import { CityAI } from "./ai-city";
import { ExploringAI } from "./ai-exploring";
import { MilitaryAI } from "./ai-military";
import { SettlingAI } from "./ai-settling";
import { AISystem } from "./ai-system";
import { AiOperation } from "./types";
import { ProductionAI } from "./ai-production";
import { WorkerAI } from "./ai-worker";
import { TechAI } from "./ai-tech";
import { PersonalityAI } from "./ai-personality";
import { StrategicAI } from "./ai-strategic";
import { TacticalAI } from "./ai-tactical";
import { TransportAI } from "./ai-transport";

export type AiPriorities = {
  expansion: number;
  economy: number;
  military: number;
  randomize: number;
};

/**
 * AI difficulty levels that affect various aspects of AI behavior
 */
export enum AIDifficulty {
  EASY = "easy", // Limited AI capabilities, player-friendly
  NORMAL = "normal", // Standard AI capabilities
  HARD = "hard", // Enhanced AI capabilities, challenging
  DEITY = "deity", // Maximum AI capabilities, very challenging
}

export class AIPlayer {
  // AI subsystems
  productionAi = new ProductionAI(this);
  personalityAI: PersonalityAI;
  strategicAI: StrategicAI;
  tacticalAI: TacticalAI;
  transportAI: TransportAI;

  // Collection of all AI systems
  systems: AISystem[] = [];

  // AI priorities that affect operations weighting
  priorities: AiPriorities = {
    expansion: 1,
    economy: 1,
    military: 1,
    randomize: 0.2,
  };

  // AI difficulty level
  difficulty: AIDifficulty;

  // Last turn the AI performed actions
  private lastTurn = -1;

  // Bonuses based on difficulty (0 at Normal, positive for higher difficulties)
  private difficultyBonuses = {
    productionMultiplier: 1.0, // Production speed bonus
    yieldMultiplier: 1.0, // Yield bonus (resources, etc.)
    unitStrengthBonus: 0.0, // Combat bonus
    techDiscount: 0.0, // Technology cost reduction
  };

  constructor(
    public player: PlayerCore,
    difficulty: AIDifficulty = AIDifficulty.NORMAL,
    personalityName?: string,
  ) {
    // Set difficulty level
    this.difficulty = difficulty;
    this.applyDifficultySettings();

    // Initialize personality first since it affects other systems
    this.personalityAI = new PersonalityAI(this, personalityName);

    // Initialize strategic AI for high-level coordination
    this.strategicAI = new StrategicAI(this);

    // Initialize tactical AI for combat coordination
    this.tacticalAI = new TacticalAI(this);

    // Initialize transport AI for naval transport coordination
    this.transportAI = new TransportAI(this);

    // Register all AI subsystems
    this.systems = [
      this.strategicAI, // Strategic AI should run first to influence other systems
      new TechAI(this),
      new CityAI(this),
      new SettlingAI(this),
      new ExploringAI(this),
      new MilitaryAI(this),
      new WorkerAI(this),
      this.tacticalAI, // Tactical AI should run after Military AI
      this.transportAI, // Transport AI for coordinating naval transport
      this.productionAi, // Production AI should run last to collect requests
    ];
  }

  /**
   * Main AI turn processing method
   */
  nextTurn() {
    // Skip if already processed this turn
    if (this.lastTurn === this.player.game.turn) {
      return;
    }

    // Store current turn
    this.lastTurn = this.player.game.turn;

    // Update AI personality context
    this.personalityAI.updateContext();

    // Move all units automatically first
    this.player.moveAllUnits();

    // Prepare all operations from AI systems
    const operations = this.prepareOperations();

    // Update priorities based on game state
    this.updatePriorities();

    // Execute all operations
    for (const op of operations) {
      op.perform();
    }
  }

  /**
   * Apply difficulty-specific bonuses and settings
   */
  private applyDifficultySettings() {
    switch (this.difficulty) {
      case AIDifficulty.EASY:
        this.difficultyBonuses.productionMultiplier = 0.9;
        this.difficultyBonuses.yieldMultiplier = 0.9;
        this.difficultyBonuses.unitStrengthBonus = -0.1;
        this.difficultyBonuses.techDiscount = -0.1;
        this.priorities.randomize = 0.3; // More random behavior
        break;

      case AIDifficulty.NORMAL:
        // Default values
        break;

      case AIDifficulty.HARD:
        this.difficultyBonuses.productionMultiplier = 1.1;
        this.difficultyBonuses.yieldMultiplier = 1.1;
        this.difficultyBonuses.unitStrengthBonus = 0.1;
        this.difficultyBonuses.techDiscount = 0.1;
        this.priorities.randomize = 0.15; // Less random behavior
        break;

      case AIDifficulty.DEITY:
        this.difficultyBonuses.productionMultiplier = 1.25;
        this.difficultyBonuses.yieldMultiplier = 1.25;
        this.difficultyBonuses.unitStrengthBonus = 0.2;
        this.difficultyBonuses.techDiscount = 0.2;
        this.priorities.randomize = 0.1; // Much less random behavior
        break;
    }
  }

  /**
   * Update AI priorities based on game state and personality
   */
  private updatePriorities() {
    // Base expansion priority on city count (more cities = less expansion focus)
    const cityCount = this.player.cities.length;

    // Adjust expansion priority inversely to city count
    if (cityCount > 0) {
      this.priorities.expansion = Math.max(0.5, Math.min(1.5, 5 / cityCount));
    } else {
      this.priorities.expansion = 1.5; // High priority if no cities
    }

    // The personality system already applies its modifiers in its update method
  }

  /**
   * Prepare and weigh operations from all AI systems
   */
  private prepareOperations(): AiOperation[] {
    const operationsMap = new Map<string, AiOperation[]>();

    // Gather operations from all systems
    for (const system of this.systems) {
      const systemOperations = system.plan();

      for (const op of systemOperations) {
        const groupId = `${op.group}-${op.entityId}`;

        // Apply priority modifiers based on AI priorities and randomization
        op.priority *=
          this.priorities[op.focus] + Math.random() * this.priorities.randomize;

        // Group operations by entity
        if (!operationsMap.has(groupId)) {
          operationsMap.set(groupId, [op]);
        } else {
          operationsMap.get(groupId)!.push(op);
        }
      }
    }

    // Select highest priority operation for each entity
    const result: AiOperation[] = [];

    for (const operations of operationsMap.values()) {
      // Calculate total priority
      const totalPriority = operations.reduce(
        (acc, op) => acc + op.priority,
        0,
      );

      // Randomly select an operation weighted by priority
      const value = Math.random() * totalPriority;
      let accPriority = 0;

      for (const op of operations) {
        accPriority += op.priority;
        if (accPriority >= value) {
          result.push(op);
          break;
        }
      }
    }

    return result;
  }

  /**
   * Get the difficulty bonus for a specific aspect
   */
  getDifficultyBonus(bonusType: keyof typeof this.difficultyBonuses): number {
    return this.difficultyBonuses[bonusType];
  }

  /**
   * Get the AI personality's dominant trait
   */
  getPersonalityTrait(): string {
    return this.personalityAI.getDominantTrait();
  }
}
