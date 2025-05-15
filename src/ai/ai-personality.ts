import { AiPriorities, AIPlayer } from "./ai-player";
import { PlayerCore } from "@/core/player";

/**
 * Personality traits that define AI behavior patterns
 */
export enum PersonalityTrait {
  AGGRESSIVE = "aggressive", // More focused on military and conquest
  DEFENSIVE = "defensive", // More focused on defense and building tall
  SCIENTIFIC = "scientific", // Prioritizes knowledge and technology
  EXPANSIONIST = "expansionist", // Focuses on rapid expansion and many cities
  ECONOMIC = "economic", // Focuses on resource gathering and economies of scale
  DIPLOMATIC = "diplomatic", // Values relations with other players (future feature)
  BALANCED = "balanced", // No strong tendencies in any direction
}

/**
 * Modifier strengths used for personality trait impact
 */
export enum TraitStrength {
  MINOR = 0.25, // Slight leaning toward a trait
  MODERATE = 0.5, // Noticeable leaning toward a trait
  STRONG = 0.75, // Strong bias toward a trait
  EXTREME = 1.0, // Extremely biased toward a trait
}

/**
 * Personality profile containing trait values
 */
export interface PersonalityProfile {
  aggressive: number; // 0-1 scale, higher = more aggressive
  defensive: number; // 0-1 scale, higher = more defensive
  scientific: number; // 0-1 scale, higher = more scientific focus
  expansionist: number; // 0-1 scale, higher = more expansionist
  economic: number; // 0-1 scale, higher = more economic focus
  diplomatic: number; // 0-1 scale, higher = more diplomatic (future feature)

  // Optional name for this personality type
  name?: string;
}

/**
 * Predefined personality profiles
 */
export const PersonalityProfiles: Record<string, PersonalityProfile> = {
  // Balanced personality with slight randomization
  BALANCED: {
    name: "Balanced",
    aggressive: 0.5,
    defensive: 0.5,
    scientific: 0.5,
    expansionist: 0.5,
    economic: 0.5,
    diplomatic: 0.5,
  },

  // Militaristic conqueror
  WARMONGER: {
    name: "Warmonger",
    aggressive: 0.9,
    defensive: 0.3,
    scientific: 0.4,
    expansionist: 0.7,
    economic: 0.4,
    diplomatic: 0.1,
  },

  // Defensive isolationist
  TURTLE: {
    name: "Turtle",
    aggressive: 0.2,
    defensive: 0.9,
    scientific: 0.6,
    expansionist: 0.2,
    economic: 0.6,
    diplomatic: 0.5,
  },

  // Science-focused civilization
  SCIENTIST: {
    name: "Scientist",
    aggressive: 0.3,
    defensive: 0.6,
    scientific: 0.9,
    expansionist: 0.5,
    economic: 0.7,
    diplomatic: 0.6,
  },

  // Wide empire builder
  EXPANSIONIST: {
    name: "Expansionist",
    aggressive: 0.6,
    defensive: 0.3,
    scientific: 0.5,
    expansionist: 0.9,
    economic: 0.6,
    diplomatic: 0.4,
  },

  // Economy and trade focused
  MERCHANT: {
    name: "Merchant",
    aggressive: 0.2,
    defensive: 0.5,
    scientific: 0.6,
    expansionist: 0.6,
    economic: 0.9,
    diplomatic: 0.8,
  },

  // Unpredictable & chaotic behavior
  ERRATIC: {
    name: "Erratic",
    aggressive: 0.7,
    defensive: 0.3,
    scientific: 0.5,
    expansionist: 0.8,
    economic: 0.4,
    diplomatic: 0.2,
  },
};

/**
 * Manages AI personality and behavior modification
 */
export class PersonalityAI {
  private profile: PersonalityProfile;
  private player: PlayerCore;
  private aiPlayer: AIPlayer;

  // Random variance to make behavior less predictable
  private randomVariance = 0.1;

  // Decision context that influences priority modifiers
  private context = {
    isUnderThreat: false, // Is this player threatened by others?
    hasResourceShortage: false, // Is the player short on key resources?
    isAheadInTechnology: false, // Is the player ahead in tech?
    isExperiencingGrowthIssues: false, // Is the player having growth problems?
  };

  constructor(aiPlayer: AIPlayer, personalityName?: string) {
    this.aiPlayer = aiPlayer;
    this.player = aiPlayer.player;

    // Either use a predefined personality or generate a random one
    if (personalityName && PersonalityProfiles[personalityName]) {
      this.profile = { ...PersonalityProfiles[personalityName] };
    } else {
      this.profile = this.generateRandomPersonality();
    }

    // Apply initial personality to AI priorities
    this.applyPersonalityToPriorities();
  }

  /**
   * Generate a random personality profile
   */
  private generateRandomPersonality(): PersonalityProfile {
    // Start with balanced profile
    const baseProfile: PersonalityProfile = { ...PersonalityProfiles.BALANCED };

    // Select 1-3 dominant traits
    const traitKeys: (keyof PersonalityProfile)[] = [
      "aggressive",
      "defensive",
      "scientific",
      "expansionist",
      "economic",
      "diplomatic",
    ];

    // Shuffle and select traits
    const shuffledTraits = [...traitKeys].sort(() => Math.random() - 0.5);
    const dominantTraitCount = 1 + Math.floor(Math.random() * 3); // 1-3 traits
    const dominantTraits = shuffledTraits.slice(0, dominantTraitCount);

    // Boost dominant traits and reduce others
    for (const trait of traitKeys) {
      if (dominantTraits.includes(trait)) {
        // Boost dominant traits (0.6-0.9)
        (baseProfile as any)[trait] = 0.6 + Math.random() * 0.3;
      } else {
        // Reduce other traits (0.2-0.5)
        (baseProfile as any)[trait] = 0.2 + Math.random() * 0.3;
      }
    }

    // Generate a name based on dominant traits
    baseProfile.name = dominantTraits
      .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
      .join("-");

    return baseProfile;
  }

  /**
   * Apply personality traits to AI priorities
   */
  private applyPersonalityToPriorities() {
    const priorities = this.aiPlayer.priorities;

    // Default values for reference
    const defaultPriorities: AiPriorities = {
      expansion: 1,
      economy: 1,
      military: 1,
      randomize: 0.2,
    };

    // Calculate priority modifiers from personality traits
    priorities.expansion =
      defaultPriorities.expansion * this.calculateExpansionModifier();

    priorities.economy =
      defaultPriorities.economy * this.calculateEconomyModifier();

    priorities.military =
      defaultPriorities.military * this.calculateMilitaryModifier();

    // Randomness is affected by the erratic nature of the personality
    priorities.randomize =
      defaultPriorities.randomize *
      (1 + Math.abs(this.profile.aggressive - this.profile.defensive));
  }

  /**
   * Calculate expansion priority modifier based on personality and context
   */
  private calculateExpansionModifier(): number {
    let modifier = 1.0;

    // Apply personality traits
    modifier += (this.profile.expansionist - 0.5) * 1.0; // Strong influence
    modifier += (this.profile.economic - 0.5) * 0.5; // Moderate influence
    modifier -= (this.profile.defensive - 0.5) * 0.5; // Negative influence

    // Apply contextual adjustments
    if (this.context.isUnderThreat) {
      modifier -= 0.3; // Reduce expansion when threatened
    }

    if (this.context.hasResourceShortage) {
      modifier += 0.3; // Increase expansion to find resources
    }

    // Add randomness
    modifier += (Math.random() * 2 - 1) * this.randomVariance;

    // Ensure return values are reasonable
    return Math.max(0.5, Math.min(2.0, modifier));
  }

  /**
   * Calculate economy priority modifier based on personality and context
   */
  private calculateEconomyModifier(): number {
    let modifier = 1.0;

    // Apply personality traits
    modifier += (this.profile.economic - 0.5) * 1.0; // Strong influence
    modifier += (this.profile.scientific - 0.5) * 0.3; // Minor influence
    modifier -= (this.profile.aggressive - 0.5) * 0.4; // Negative influence

    // Apply contextual adjustments
    if (this.context.isExperiencingGrowthIssues) {
      modifier += 0.4; // Prioritize economy when growth is an issue
    }

    // Add randomness
    modifier += (Math.random() * 2 - 1) * this.randomVariance;

    // Ensure return values are reasonable
    return Math.max(0.5, Math.min(2.0, modifier));
  }

  /**
   * Calculate military priority modifier based on personality and context
   */
  private calculateMilitaryModifier(): number {
    let modifier = 1.0;

    // Apply personality traits
    modifier += (this.profile.aggressive - 0.5) * 1.2; // Strong influence
    modifier += (this.profile.defensive - 0.5) * 0.8; // Moderate influence
    modifier -= (this.profile.scientific - 0.5) * 0.4; // Negative influence

    // Apply contextual adjustments
    if (this.context.isUnderThreat) {
      modifier += 0.7; // Significantly increase military when threatened
    }

    if (this.context.isAheadInTechnology) {
      modifier += 0.3; // More military when technological advantage exists
    }

    // Add randomness
    modifier += (Math.random() * 2 - 1) * this.randomVariance;

    // Ensure return values are reasonable
    return Math.max(0.5, Math.min(2.0, modifier));
  }

  /**
   * Update the AI's context based on current game state
   */
  updateContext() {
    // Check if player is under threat
    this.context.isUnderThreat = this.calculateThreatLevel() > 0.6;

    // Check for resource shortages
    this.context.hasResourceShortage = this.checkResourceShortages();

    // Check technology position
    this.context.isAheadInTechnology = this.checkTechnologyPosition();

    // Check growth issues
    this.context.isExperiencingGrowthIssues = this.checkGrowthIssues();

    // After updating context, reapply personality to adjust priorities
    this.applyPersonalityToPriorities();
  }

  /**
   * Calculate threat level from other players
   */
  private calculateThreatLevel(): number {
    // Default implementation - no threat
    let threatLevel = 0;

    // Count enemy military units near cities and borders
    const enemyPlayers = this.player.game.players.filter(
      (p) => p !== this.player && this.player.isEnemyWith(p),
    );

    if (enemyPlayers.length === 0) {
      return 0; // No enemies, no threat
    }

    // Get all enemy units
    const enemyUnits = enemyPlayers.flatMap((p) => p.units);

    // Check proximity to cities
    for (const city of this.player.cities) {
      // Count enemy units near this city
      let nearbyEnemyPower = 0;
      for (const enemyUnit of enemyUnits) {
        const distance = city.tile.getDistanceTo(enemyUnit.tile);
        if (distance <= 5) {
          // Units are more threatening when closer
          const proximityFactor = Math.max(0, 6 - distance) / 5;
          nearbyEnemyPower += enemyUnit.definition.strength * proximityFactor;
        }
      }

      // Normalize and add to threat level
      const cityThreat = Math.min(1.0, nearbyEnemyPower / 50);
      threatLevel = Math.max(threatLevel, cityThreat);
    }

    return threatLevel;
  }

  /**
   * Check if player has resource shortages
   */
  private checkResourceShortages(): boolean {
    // Count strategic resources
    // const strategicResources = Array.from(this.player.availableResources.values())
    //   .filter(r => r.def.tags?.includes("strategic"));

    // // Missing strategic resources is considered a shortage
    // return strategicResources.length < 2;
    return false;
  }

  /**
   * Check if player is ahead in technology
   */
  private checkTechnologyPosition(): boolean {
    // Count discovered techs for this player
    const ownTechCount = this.player.knowledge.discoveredTechs.size;

    // Check other players' tech counts
    const otherPlayersAvgTechs =
      this.player.game.players
        .filter((p) => p !== this.player)
        .reduce((sum, p) => sum + p.knowledge.discoveredTechs.size, 0) /
      Math.max(1, this.player.game.players.length - 1);

    // Ahead if 20% more techs than average
    return ownTechCount > otherPlayersAvgTechs * 1.2;
  }

  /**
   * Check if player is experiencing growth issues
   */
  private checkGrowthIssues(): boolean {
    // Check if cities are growing
    // const averageGrowthTime = this.player.cities.reduce(
    //   (sum, city) => sum + (city.population.growthCounter?.turnsLeft || 100),
    //   0
    // ) / Math.max(1, this.player.cities.length);

    // // Growth issues if average turns to growth is high
    // return averageGrowthTime > 15;
    return false;
  }

  /**
   * Get the current personality profile for external systems
   */
  getPersonalityProfile(): PersonalityProfile {
    return { ...this.profile };
  }

  /**
   * Get dominant personality trait
   */
  getDominantTrait(): PersonalityTrait {
    const traits: [PersonalityTrait, number][] = [
      [PersonalityTrait.AGGRESSIVE, this.profile.aggressive],
      [PersonalityTrait.DEFENSIVE, this.profile.defensive],
      [PersonalityTrait.SCIENTIFIC, this.profile.scientific],
      [PersonalityTrait.EXPANSIONIST, this.profile.expansionist],
      [PersonalityTrait.ECONOMIC, this.profile.economic],
      [PersonalityTrait.DIPLOMATIC, this.profile.diplomatic],
    ];

    // Sort by trait value (descending)
    traits.sort((a, b) => b[1] - a[1]);

    // Return the highest trait
    return traits[0][0];
  }
}
