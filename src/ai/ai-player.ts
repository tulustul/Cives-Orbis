import { PlayerCore } from "@/core/player";
import { CityAI } from "./ai-city";
import { ExploringAI } from "./ai-exploring";
import { SettlingAI } from "./ai-settling";
import { AISystem } from "./ai-system";
import { AiOrder } from "./types";
import { ProductionAI } from "./ai-production";
import { WorkerAI } from "./ai-worker";
import { TechAI } from "./ai-tech";
import { PersonalityAI } from "./ai-personality";
import { StrategicAI } from "./ai-strategic";
import { MilitaryTacticalAI } from "./ai-military-tactical";
import { NavalTransportAI } from "./ai-naval-transport";
import { IdleUnitsAI } from "./ai-idle-units";
import { AiUnitsRegistry } from "./ai-units-registry";
import { AiTask } from "./tasks/task";

export type AiPriorities = {
  expansion: number;
  economy: number;
  military: number;
  randomize: number;
  none: number;
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
  units: AiUnitsRegistry;

  // AI subsystems
  productionAi = new ProductionAI(this);
  personalityAI: PersonalityAI;
  strategicAI: StrategicAI;
  tacticalAI: MilitaryTacticalAI;
  transportAI: NavalTransportAI;
  exploringAI: ExploringAI;

  // Collection of all AI systems
  systems: AISystem[] = [];

  // AI priorities that affect orders weighting
  priorities: AiPriorities = {
    expansion: 1,
    economy: 1,
    military: 1,
    randomize: 0.2,
    none: 1,
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

  tasks: AiTask<any, any>[] = [];
  orders: AiOrder[] = [];

  constructor(
    public player: PlayerCore,
    difficulty: AIDifficulty = AIDifficulty.NORMAL,
    personalityName?: string,
  ) {
    // Set difficulty level
    this.difficulty = difficulty;
    this.applyDifficultySettings();

    this.units = new AiUnitsRegistry(this.player);

    // Initialize personality first since it affects other systems
    this.personalityAI = new PersonalityAI(this, personalityName);

    // Initialize strategic AI for high-level coordination
    this.strategicAI = new StrategicAI(this);

    // Initialize tactical AI for combat coordination
    this.tacticalAI = new MilitaryTacticalAI(this);

    // Initialize transport AI for naval transport coordination
    this.transportAI = new NavalTransportAI(this);

    this.exploringAI = new ExploringAI(this);

    // Register all AI subsystems
    this.systems = [
      this.strategicAI, // Strategic AI should run first to influence other systems
      new TechAI(this),
      new CityAI(this),
      new SettlingAI(this),
      this.exploringAI,
      new WorkerAI(this),
      // new MilitaryStrategyAI(this),
      // this.tacticalAI, // Tactical AI should run after Military AI
      this.transportAI, // Transport AI for coordinating naval transport
      this.productionAi, // Production AI should run last to collect requests
      new IdleUnitsAI(this), // Idle units AI runs last to clean up any unassigned units
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

    this.units.update();

    this.tasks = this.tasks.filter((task) => !task.result);

    this.orders = [];
    for (const system of this.systems) {
      const systemOrdersAndTasks = system.plan();
      for (const orderOrTask of systemOrdersAndTasks) {
        if (orderOrTask instanceof AiTask) {
          orderOrTask.init();
          this.tasks.push(orderOrTask);
        } else {
          this.orders.push(orderOrTask);
        }
      }
    }

    for (const task of this.tasks) {
      task.tickBranch();
    }

    this.processOrders(this.orders);
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

  private processOrders(orders: AiOrder[]) {
    orders = this.prioritizeOrders(orders);

    // Update priorities based on game state
    this.updatePriorities();

    for (const order of orders) {
      order.perform();
    }
  }

  private prioritizeOrders(orders: AiOrder[]): AiOrder[] {
    const ordersMap = new Map<string, AiOrder[]>();

    for (const order of orders) {
      const groupId = `${order.group}-${order.entityId}`;

      // Apply priority modifiers based on AI priorities and randomization
      order.priority *=
        this.priorities[order.focus ?? "none"] +
        Math.random() * this.priorities.randomize;

      // Group orders by entity
      if (!ordersMap.has(groupId)) {
        ordersMap.set(groupId, [order]);
      } else {
        ordersMap.get(groupId)!.push(order);
      }
    }

    // Select highest priority order for each entity
    const result: AiOrder[] = [];

    for (const order of ordersMap.values()) {
      // Calculate total priority
      const totalPriority = order.reduce((acc, op) => acc + op.priority, 0);

      // Randomly select an order weighted by priority
      const value = Math.random() * totalPriority;
      let accPriority = 0;

      for (const op of order) {
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

  serialize() {
    return {
      tasks: this.tasks.map((task) => task.serializeBranch()),
    };
  }
}
