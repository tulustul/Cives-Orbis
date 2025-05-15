import { moveAlongPath } from "@/core/movement";
import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { findPath } from "@/core/pathfinding";
import { AISystem } from "./ai-system";
import { dataManager } from "@/core/data/dataManager";
import { StrategicAI } from "./ai-strategic";
import { CityAI } from "./ai-city";
import { sumYields } from "@/core/yields";
import { ResourceDefinition } from "@/core/data/types";
import { CityCore } from "@/core/city";
import { LandForm } from "@/shared";
import { TransportAI } from "./ai-transport";

/**
 * Resource evaluation types for city placement
 */
enum ResourceValue {
  STRATEGIC = 3, // Resources needed for units or critical buildings
  LUXURY = 2, // Resources that provide bonuses but aren't critical
  BASIC = 1, // Common resources with lower value
  NONE = 0, // No resource
}

/**
 * Score weightings for different city placement factors
 */
interface CityPlacementWeights {
  food: number; // Weight for food yields
  production: number; // Weight for production yields
  knowledge: number; // Weight for knowledge yields
  resourceValue: number; // Weight for resource values
  waterAccess: number; // Weight for water access
  defensiveValue: number; // Weight for defensive position
  distance: number; // Weight for distance from existing cities
  expansionValue: number; // Weight for potential city expansion
}

/**
 * City spot evaluation result
 */
interface CitySpotEvaluation {
  tile: TileCore;
  totalScore: number;
  foodScore: number;
  productionScore: number;
  knowledgeScore: number;
  resourceScore: number;
  waterScore: number;
  defenseScore: number;
  distanceScore: number;
  expansionScore: number;
}

export class SettlingAI extends AISystem {
  // Track potential city spots
  private evaluatedCitySpots = new Map<number, CitySpotEvaluation>();
  private strategicCityTargets: TileCore[] = []; // Locations we specifically want to target
  private defaultCitySpotCache = new Map<number, TileCore>(); // Cache for default search method

  // Track transport requests for settlers
  private settlerTransportRequests = new Map<number, number>(); // Map of settler ID -> transport request ID

  // Minimum distance between cities (to avoid overcrowding)
  private MIN_CITY_DISTANCE = 4;

  // Maximum search radius from existing cities
  private MAX_SEARCH_RADIUS = 10;

  // Weights used for evaluating city placement
  private baseWeights: CityPlacementWeights = {
    food: 1.2,
    production: 1.0,
    knowledge: 0.7,
    resourceValue: 1.5,
    waterAccess: 0.8,
    defensiveValue: 0.6,
    distance: 0.5,
    expansionValue: 1.0,
  };

  plan() {
    this.operations = [];

    // Get current strategic focus to adapt settling strategy
    const strategicAI = this.ai.systems.find(
      (system) => system instanceof StrategicAI,
    ) as StrategicAI | undefined;
    const strategicFocus = strategicAI
      ? strategicAI.getStrategicFocus()
      : "balanced";

    // Update strategic targets based on game state
    this.updateStrategicTargets();

    // Clean up transport requests for settlers that no longer exist
    this.cleanupTransportRequests();

    // Evaluate current situation
    const shouldSettleMoreCities = this.shouldSettleMoreCities();

    // Process cities for settler production
    if (shouldSettleMoreCities) {
      this.processCities();
    }

    // Process existing settlers
    this.processSettlers(strategicFocus);

    return this.operations;
  }

  /**
   * Clean up transport requests for settlers that no longer exist
   */
  private cleanupTransportRequests() {
    // Get transport AI system
    const transportAI = this.ai.systems.find(
      (system) => system instanceof TransportAI,
    ) as TransportAI | undefined;

    if (!transportAI) return;

    // Check each settler in our transport requests map
    const settlerIds = Array.from(this.settlerTransportRequests.keys());
    for (const settlerId of settlerIds) {
      const settler = this.player.units.find((unit) => unit.id === settlerId);

      // If settler no longer exists, cancel the transport request
      if (!settler) {
        const requestId = this.settlerTransportRequests.get(settlerId)!;
        transportAI.cancelRequest(requestId);
        this.settlerTransportRequests.delete(settlerId);
      }
    }
  }

  /**
   * Evaluate if the AI should settle more cities
   */
  private shouldSettleMoreCities(): boolean {
    // Calculate current city count
    const cityCount = this.player.cities.length;

    // Don't settle more cities if we already have too many settlers
    const settlerCount = this.player.units.filter((unit) =>
      unit.definition.actions.includes("foundCity"),
    ).length;

    // If we already have a reasonable number of settlers, don't produce more
    if (settlerCount >= Math.max(2, Math.ceil(cityCount / 3))) {
      return false;
    }

    // Base the decision on economic capacity
    const economicCapacity = this.getEconomicCapacity();
    const recommendedCities = this.getRecommendedCityCount();

    // If we're below the recommended city count and can support more cities
    return cityCount < recommendedCities && economicCapacity > 0.7;
  }

  /**
   * Calculate economic capacity for supporting new cities
   */
  private getEconomicCapacity(): number {
    // Simple economic model based on total yields vs. city count
    const cityCount = this.player.cities.length;
    if (cityCount === 0) return 1.0; // Always expand when no cities

    // Sum up available yields
    let totalFood = 0;
    let totalProduction = 0;

    for (const city of this.player.cities) {
      for (const tile of city.workers.workedTiles) {
        totalFood += tile.yields.food;
        totalProduction += tile.yields.production;
      }
    }

    // Calculate capacity - higher is better
    const avgFood = totalFood / cityCount;
    const avgProduction = totalProduction / cityCount;

    // Simple capacity model - adjust based on testing
    return Math.min(1.0, (avgFood * 0.7 + avgProduction * 0.3) / 10);
  }

  /**
   * Calculate recommended city count based on map size and game progress
   */
  private getRecommendedCityCount(): number {
    // Basic formula based on game turns and map size
    const mapSize = this.player.game.map.width * this.player.game.map.height;
    const mapSizeFactor = Math.sqrt(mapSize) / 20; // Normalize based on map size

    // Calculate progress through the game (0-1)
    const currentTurn = this.player.game.turn;
    const estimatedGameLength = 250; // Adjust based on game settings
    const gameProgress = Math.min(1.0, currentTurn / estimatedGameLength);

    // Calculate recommended city count
    // Early game: fewer cities, late game: more cities, capped by map size
    const baseCityCount = 3 + Math.floor(gameProgress * 7); // 3 to 10 cities
    return Math.min(Math.round(baseCityCount * mapSizeFactor), 15);
  }

  private processCities() {
    const settler = dataManager.units.get("unit_settler")!;
    const cityAI = this.ai.systems.find(
      (system) => system instanceof CityAI,
    ) as CityAI | undefined;

    // Evaluate cities for settler production
    const cityEvaluations = this.player.citiesWithoutProduction
      .filter((city) => city.production.canProduce(settler))
      .map((city) => {
        // Consider city specialization if CityAI is available
        const specialization = cityAI
          ? cityAI.getCitySpecialization(city.id)
          : "general";

        // Calculate priority based on specialization
        let priority = 100; // Base priority

        // Production-focused cities get higher priority for settlers
        if (specialization === "production") {
          priority += 30;
        } else if (specialization === "growth" || specialization === "food") {
          priority += 10;
        } else if (specialization === "defense") {
          priority -= 20; // Defense-focused cities should focus on military
        }

        // Adjust based on city's current population relative to other cities
        const populationPercentile = this.getPopulationPercentile(city);
        if (populationPercentile > 0.7) {
          priority += 20; // Larger cities are better at producing settlers
        } else if (populationPercentile < 0.3) {
          priority -= 20; // Smaller cities should focus on growth
        }

        // Check if there's a good spot nearby
        const newCityLocation = this.findCityLocation(city.tile);
        if (!newCityLocation) {
          priority -= 50; // No good spots nearby, lower priority
        }

        return { city, priority, location: newCityLocation };
      })
      .filter((cityEval) => cityEval.location !== null) // Only consider if there's a valid spot
      .sort((a, b) => b.priority - a.priority); // Sort by priority

    // Choose the best city to produce a settler
    if (cityEvaluations.length > 0) {
      const bestCity = cityEvaluations[0];
      this.operations.push({
        group: "city-produce",
        entityId: bestCity.city.id,
        focus: "expansion",
        priority: bestCity.priority,
        perform: () => {
          bestCity.city.production.produce(settler);
        },
      });
    }
  }

  /**
   * Get the population percentile of a city compared to other cities
   */
  private getPopulationPercentile(city: CityCore): number {
    if (this.player.cities.length <= 1) return 1.0;

    // Sort cities by population
    const sortedCities = [...this.player.cities].sort(
      (a, b) => a.population.total - b.population.total,
    );

    // Find index of this city
    const index = sortedCities.findIndex((c) => c.id === city.id);

    // Calculate percentile (0-1)
    return index / (sortedCities.length - 1);
  }

  private processSettlers(strategicFocus: string) {
    // Find all settler units
    const settlers = this.player.units.filter((unit) =>
      unit.definition.actions.includes("foundCity"),
    );

    // Process each settler
    for (const settler of settlers) {
      this.processSingleSettler(settler, strategicFocus);
    }
  }

  private processSingleSettler(unit: UnitCore, strategicFocus: string) {
    this.operations.push({
      group: "unit",
      entityId: unit.id,
      focus: "expansion",
      priority: 100,
      perform: () => {
        // Check if this settler has an active transport request
        const transportRequestId = this.settlerTransportRequests.get(unit.id);
        if (transportRequestId) {
          // Get the transport AI system
          const transportAI = this.ai.systems.find(
            (system) => system instanceof TransportAI,
          ) as TransportAI | undefined;

          if (transportAI) {
            // Check transport request status
            const status = transportAI.getRequestStatus(transportRequestId);

            // If transport is completed or failed, clear the request
            if (status === "completed" || status === "failed") {
              this.settlerTransportRequests.delete(unit.id);
            } else {
              // Transport is in progress, don't override it
              return;
            }
          }
        }

        const destination = unit.getPathDestination();

        // If settler has no destination or destination is no longer valid
        if (!destination || destination.areaOf) {
          // Find the best location, considering strategic focus
          const bestCityLocation = this.findBestCityLocation(
            unit.tile,
            strategicFocus,
          );

          // If no good location found, sleep
          if (!bestCityLocation) {
            unit.order = "sleep";
            return;
          }

          // If already at best location, found city
          if (unit.tile === bestCityLocation) {
            unit.doAction("foundCity");
          } else {
            // Check if we need a transport (different landmass)
            const needsTransport = this.needsTransport(
              unit.tile,
              bestCityLocation,
            );

            if (needsTransport) {
              // Request transport with higher priority for settlers
              const requestId = this.ai.transportAI.requestTransport(
                unit,
                bestCityLocation,
                120, // Higher priority for settlers
                "expansion",
              );

              // Store the request ID if successful
              if (requestId > 0) {
                this.settlerTransportRequests.set(unit.id, requestId);
                return; // Transport AI will handle the movement
              }
            }

            // Otherwise, set path to best location
            unit.path = findPath(unit, bestCityLocation);
          }
        }

        // Move along path if one exists
        if (unit.path) {
          moveAlongPath(unit);
        }
      },
    });
  }

  /**
   * Check if a unit needs naval transport to reach a destination
   */
  private needsTransport(
    startTile: TileCore,
    destinationTile: TileCore,
  ): boolean {
    // Different passable areas indicates need for transport
    return startTile.passableArea !== destinationTile.passableArea;
  }

  /**
   * Find the best city location, considering strategic factors
   */
  private findBestCityLocation(
    startTile: TileCore,
    strategicFocus: string,
  ): TileCore | null {
    // First check if we have any strategic targets to settle
    if (this.strategicCityTargets.length > 0) {
      const validTarget = this.findClosestValidTarget(startTile);
      if (validTarget) return validTarget;
    }

    // Use advanced city placement logic
    return this.findOptimalCityLocation(startTile, strategicFocus);
  }

  /**
   * Find the closest valid strategic target
   */
  private findClosestValidTarget(startTile: TileCore): TileCore | null {
    // First check targets in the same passable area (directly accessible)
    const sameAreaTargets = this.strategicCityTargets.filter(
      (target) => target.passableArea === startTile.passableArea,
    );

    // If we have targets in the same area, find the closest one
    if (sameAreaTargets.length > 0) {
      return this.findClosestTargetInList(startTile, sameAreaTargets);
    }

    // If we don't have any targets in the same area, consider all strategic targets
    // with the understanding that we'll need naval transport to reach them
    if (this.strategicCityTargets.length > 0) {
      // Find the best target considering transport needs
      const bestTarget = this.findBestCrossWaterTarget(startTile);

      // If a valid target is found, return it
      if (bestTarget) {
        return bestTarget;
      }
    }

    return null;
  }

  /**
   * Find the closest target from a list of candidates
   */
  private findClosestTargetInList(
    startTile: TileCore,
    targets: TileCore[],
  ): TileCore | null {
    if (targets.length === 0) return null;

    // Find closest target
    let closestTarget = targets[0];
    let closestDistance = startTile.getDistanceTo(closestTarget);

    for (let i = 1; i < targets.length; i++) {
      const target = targets[i];
      const distance = startTile.getDistanceTo(target);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestTarget = target;
      }
    }

    // Ensure it's still a valid spot
    if (closestTarget.city || closestTarget.areaOf) {
      // Remove invalid target
      this.strategicCityTargets = this.strategicCityTargets.filter(
        (t) => t !== closestTarget,
      );
      return null;
    }

    return closestTarget;
  }

  /**
   * Find the best target that requires crossing water
   */
  private findBestCrossWaterTarget(startTile: TileCore): TileCore | null {
    // Filter out invalid targets
    const validTargets = this.strategicCityTargets.filter(
      (target) => !target.city && !target.areaOf,
    );

    if (validTargets.length === 0) return null;

    // Find target with the highest score
    let bestTarget: TileCore | null = null;
    let bestScore = -Infinity;

    for (const target of validTargets) {
      // Get score for this target (based on its value and distance)
      const evaluation = this.evaluateCitySpot(target, this.baseWeights);

      // Simple scoring - adjust depending on what's important
      const score =
        evaluation.totalScore - startTile.getDistanceTo(target) * 0.5;

      if (score > bestScore) {
        bestScore = score;
        bestTarget = target;
      }
    }

    return bestTarget;
  }

  /**
   * Apply advanced logic to find the optimal city location
   */
  private findOptimalCityLocation(
    startTile: TileCore,
    strategicFocus: string,
  ): TileCore | null {
    // Adapt weights based on strategic focus
    const weights = this.getWeightsForStrategy(strategicFocus);

    // First, search explored tiles on the same landmass
    let localCandidates = this.findLocalCandidates(startTile, weights);

    // Also consider tiles on other landmasses if we have naval capabilities
    let remoteCandidates = this.findRemoteCandidates(weights);

    // Combine both sets of evaluations
    let allEvaluations = [...localCandidates];

    // Only include remote candidates if they're significantly better than local ones
    if (remoteCandidates.length > 0) {
      // Best local score
      const bestLocalScore =
        localCandidates.length > 0 ? localCandidates[0].totalScore : 0;

      // Filter remote candidates that are significantly better than local ones
      const betterRemoteCandidates = remoteCandidates.filter(
        (eval_) => eval_.totalScore > bestLocalScore * 1.25, // At least 25% better
      );

      allEvaluations = [...localCandidates, ...betterRemoteCandidates];
    }

    // Sort all evaluations by score
    allEvaluations.sort((a, b) => b.totalScore - a.totalScore);

    // Cache evaluations for future reference
    allEvaluations.forEach((eval_) => {
      this.evaluatedCitySpots.set(eval_.tile.id, eval_);
    });

    return allEvaluations.length > 0 ? allEvaluations[0].tile : null;
  }

  /**
   * Find candidate city locations on the same landmass
   */
  private findLocalCandidates(
    startTile: TileCore,
    weights: CityPlacementWeights,
  ): CitySpotEvaluation[] {
    // Search all tiles in range
    const searchRadius = this.MAX_SEARCH_RADIUS;
    const candidates = startTile.getTilesInRange(searchRadius);

    // Skip if no candidates
    if (candidates.size === 0) return [];

    // Filter valid tiles (same passable area, not already claimed)
    const validCandidates = Array.from(candidates).filter((tile) => {
      // Must be in same passable area
      if (startTile.passableArea !== tile.passableArea) return false;

      // Must not already have a city
      if (tile.city) return false;

      // Must not be in an area claimed by another city
      if (tile.areaOf && tile.areaOf.player !== this.player) return false;

      // Check minimum distance from existing cities
      for (const city of this.player.cities) {
        if (tile.getDistanceTo(city.tile) < this.MIN_CITY_DISTANCE) {
          return false;
        }
      }

      return true;
    });

    if (validCandidates.length === 0) return [];

    // Calculate score for each candidate
    const evaluations: CitySpotEvaluation[] = validCandidates.map((tile) => {
      return this.evaluateCitySpot(tile, weights);
    });

    // Sort by total score
    evaluations.sort((a, b) => b.totalScore - a.totalScore);

    return evaluations;
  }

  /**
   * Find candidate city locations on other landmasses
   */
  private findRemoteCandidates(
    weights: CityPlacementWeights,
  ): CitySpotEvaluation[] {
    // Get all explored tiles
    const exploredTiles = Array.from(this.player.exploredTiles);

    // Filter out water and tiles already evaluated by findLocalCandidates
    const validCandidates = exploredTiles.filter((tile) => {
      // Must be land
      if (!tile.isLand) return false;

      // Must not already have a city
      if (tile.city) return false;

      // Must not be in an area claimed by another city
      if (tile.areaOf && tile.areaOf.player !== this.player) return false;

      // Check minimum distance from existing cities
      for (const city of this.player.cities) {
        if (tile.getDistanceTo(city.tile) < this.MIN_CITY_DISTANCE) {
          return false;
        }
      }

      return true;
    });

    // Limit evaluation to a reasonable number of tiles (up to 50)
    // Prioritize tiles with resources
    const tilesWithResources = validCandidates.filter((tile) => tile.resource);
    const tilesWithoutResources = validCandidates.filter(
      (tile) => !tile.resource,
    );

    // Combine and limit
    const tilesToEvaluate = [
      ...tilesWithResources,
      ...tilesWithoutResources.slice(
        0,
        Math.max(0, 50 - tilesWithResources.length),
      ),
    ];

    // Calculate score for each candidate
    const evaluations: CitySpotEvaluation[] = tilesToEvaluate.map((tile) => {
      const evaluation = this.evaluateCitySpot(tile, weights);

      // Add a small bonus for cross-ocean colonies (strategic value)
      if (
        this.player.cities.length > 0 &&
        !this.player.cities.some(
          (city) => city.tile.passableArea === tile.passableArea,
        )
      ) {
        evaluation.totalScore *= 1.1; // 10% bonus for a colony on a new continent
      }

      return evaluation;
    });

    // Sort by total score
    evaluations.sort((a, b) => b.totalScore - a.totalScore);

    // Only return the top candidates
    return evaluations.slice(0, 5);
  }

  /**
   * Evaluate a tile as a potential city location
   */
  private evaluateCitySpot(
    tile: TileCore,
    weights: CityPlacementWeights,
  ): CitySpotEvaluation {
    // Get all tiles in city working range (typically 2)
    const workableTiles = tile.getTilesInRange(2);

    // Calculate resource scores
    let foodTotal = 0;
    let productionTotal = 0;
    let knowledgeTotal = 0;
    let resourceScore = 0;
    let uniqueResourceTypes = new Set<string>();

    // Calculate yields and resources
    for (const workableTile of workableTiles) {
      // Sum yields
      foodTotal += workableTile.yields.food;
      productionTotal += workableTile.yields.production;
      knowledgeTotal += workableTile.yields.knowledge;

      // Calculate resource value
      if (workableTile.resource) {
        resourceScore += this.getResourceValue(workableTile.resource.def);
        uniqueResourceTypes.add(workableTile.resource.def.name);
      }
    }

    // Add bonus for resource diversity
    resourceScore += uniqueResourceTypes.size * 2;

    // Calculate water access score
    const waterScore = this.calculateWaterAccess(tile);

    // Calculate defensive value
    const defenseScore = this.calculateDefensiveValue(tile);

    // Calculate distance from existing cities
    const distanceScore = this.calculateDistanceScore(tile);

    // Calculate expansion potential
    const expansionScore = this.calculateExpansionScore(tile);

    // Calculate weighted scores
    const foodScore = foodTotal * weights.food;
    const productionScore = productionTotal * weights.production;
    const knowledgeScore = knowledgeTotal * weights.knowledge;
    const weightedResourceScore = resourceScore * weights.resourceValue;
    const weightedWaterScore = waterScore * weights.waterAccess;
    const weightedDefenseScore = defenseScore * weights.defensiveValue;
    const weightedDistanceScore = distanceScore * weights.distance;
    const weightedExpansionScore = expansionScore * weights.expansionValue;

    // Calculate total score
    const totalScore =
      foodScore +
      productionScore +
      knowledgeScore +
      weightedResourceScore +
      weightedWaterScore +
      weightedDefenseScore +
      weightedDistanceScore +
      weightedExpansionScore;

    return {
      tile,
      totalScore,
      foodScore,
      productionScore,
      knowledgeScore,
      resourceScore: weightedResourceScore,
      waterScore: weightedWaterScore,
      defenseScore: weightedDefenseScore,
      distanceScore: weightedDistanceScore,
      expansionScore: weightedExpansionScore,
    };
  }

  /**
   * Get weighted value of a resource
   */
  private getResourceValue(resource: ResourceDefinition): number {
    // Check if resource is strategic
    if (
      resource.categories.includes("strategic") ||
      resource.name.toLowerCase().includes("iron") ||
      resource.name.toLowerCase().includes("horse")
    ) {
      return ResourceValue.STRATEGIC;
    }

    // Check if resource is luxury
    if (
      resource.categories.includes("luxury") ||
      resource.name.toLowerCase().includes("gold") ||
      resource.name.toLowerCase().includes("silk") ||
      resource.name.toLowerCase().includes("gem")
    ) {
      return ResourceValue.LUXURY;
    }

    // Otherwise it's a basic resource
    return ResourceValue.BASIC;
  }

  /**
   * Calculate water access score
   */
  private calculateWaterAccess(tile: TileCore): number {
    // Check for freshwater (rivers, lakes)
    const hasFreshwater = tile.riverParts.length > 0;

    // Check for coast (for naval access)
    const isCoastal = tile.neighbours.some((t) => t.isWater);

    return (hasFreshwater ? 5 : 0) + (isCoastal ? 3 : 0);
  }

  /**
   * Calculate defensive value of a tile
   */
  private calculateDefensiveValue(tile: TileCore): number {
    let score = 0;

    // Higher defense bonus is better
    score += (tile.landForm === LandForm.hills ? 1 : 0) * 2;

    // Choke points (tiles with few land connections) are good defensively
    const landNeighbors = tile.neighbours.filter((t) => !t.isWater);
    if (landNeighbors.length <= 3) {
      score += 4 - landNeighbors.length; // Fewer connections = better choke point
    }

    // Water borders are good for defense
    const waterNeighbors = tile.neighbours.filter((t) => t.isWater);
    score += waterNeighbors.length * 0.5;

    return score;
  }

  /**
   * Calculate distance score from existing cities
   */
  private calculateDistanceScore(tile: TileCore): number {
    if (this.player.cities.length === 0) return 10; // First city gets max score

    let minDistance = Infinity;

    // Find distance to closest city
    for (const city of this.player.cities) {
      const distance = tile.getDistanceTo(city.tile);
      minDistance = Math.min(minDistance, distance);
    }

    // Score based on optimal distance
    // Too close is bad, too far is risky, sweet spot in the middle
    if (minDistance < this.MIN_CITY_DISTANCE) {
      return 0; // Too close
    } else if (minDistance <= 6) {
      return 10; // Ideal range
    } else if (minDistance <= 10) {
      return Math.max(0, 10 - (minDistance - 6)); // Decreasing score as distance increases
    } else {
      return 0; // Too far
    }
  }

  /**
   * Calculate expansion potential score
   */
  private calculateExpansionScore(tile: TileCore): number {
    // Check tiles in range 3 for expansion quality
    const expansionTiles = tile.getTilesInRange(3);

    // Count good expansion tiles
    let goodTileCount = 0;

    for (const expansionTile of expansionTiles) {
      // Skip tiles that are already in a city area
      if (expansionTile.areaOf) continue;

      // Calculate tile quality based on yields
      const yields = sumYields(expansionTile.yields);

      // Count if it's a good tile (adjust threshold as needed)
      if (yields >= 3 || expansionTile.resource) {
        goodTileCount++;
      }
    }

    return Math.min(10, goodTileCount / 2);
  }

  /**
   * Get adapted weights based on strategic focus
   */
  private getWeightsForStrategy(strategicFocus: string): CityPlacementWeights {
    // Start with base weights
    const weights = { ...this.baseWeights };

    // Adjust based on strategic focus
    switch (strategicFocus) {
      case "conquest":
        weights.production *= 1.5;
        weights.defensiveValue *= 1.3;
        weights.resourceValue *= 1.2;
        weights.food *= 0.8;
        break;

      case "scientific":
        weights.knowledge *= 1.5;
        weights.food *= 1.2;
        weights.expansionValue *= 1.2;
        weights.defensiveValue *= 0.7;
        break;

      case "economic":
        weights.resourceValue *= 1.5;
        weights.expansionValue *= 1.3;
        weights.waterAccess *= 1.2;
        weights.defensiveValue *= 0.7;
        break;

      case "balanced":
      default:
        // Already balanced
        break;
    }

    return weights;
  }

  /**
   * Update strategic target locations based on game state
   */
  private updateStrategicTargets() {
    // Clear old targets that are no longer valid
    this.strategicCityTargets = this.strategicCityTargets.filter((target) => {
      // Remove if already settled or claimed
      return !target.city && !target.areaOf;
    });

    // If we don't have enough targets, find new ones
    if (this.strategicCityTargets.length < 3) {
      this.identifyStrategicLocations();
    }
  }

  /**
   * Identify strategic locations that should be prioritized for settling
   */
  private identifyStrategicLocations() {
    // Get all explored tiles
    const exploredTiles = Array.from(this.player.exploredTiles);

    // Find strategic resource locations
    const strategicResourceTiles = exploredTiles.filter(
      (tile) =>
        tile.resource &&
        tile.resource.def.categories.includes("strategic") &&
        !tile.city &&
        !tile.areaOf,
      // TODO && this.player.knowledge.isResourceKnown(tile.resource.def),
    );

    // Find strategic choke points
    const chokePointTiles = this.identifyChokePoints(exploredTiles);

    // Add new strategic targets
    for (const tile of [...strategicResourceTiles, ...chokePointTiles]) {
      // Check if it's a valid city location
      if (this.isValidCityLocation(tile)) {
        this.strategicCityTargets.push(tile);
      }
    }

    // Limit to most valuable targets
    if (this.strategicCityTargets.length > 5) {
      // Evaluate and sort by score
      const evaluations = this.strategicCityTargets.map((tile) => {
        return this.evaluateCitySpot(tile, this.baseWeights);
      });

      evaluations.sort((a, b) => b.totalScore - a.totalScore);

      // Keep only the top 5
      this.strategicCityTargets = evaluations.slice(0, 5).map((e) => e.tile);
    }
  }

  /**
   * Identify strategic choke points on the map
   */
  private identifyChokePoints(exploredTiles: TileCore[]): TileCore[] {
    const chokePoints: TileCore[] = [];

    for (const tile of exploredTiles) {
      // Skip water tiles
      if (tile.isWater) continue;

      // Skip tiles that already have cities or are claimed
      if (tile.city || tile.areaOf) continue;

      // Check if this is a land bridge or narrow pass
      const landNeighbors = tile.neighbours.filter((t) => !t.isWater);

      // If there are only 1-2 land connections, this might be a choke point
      if (landNeighbors.length <= 2) {
        // Verify if this connects two larger land areas
        const connectedAreas = new Set<number>();
        for (const neighbor of landNeighbors) {
          const neighborLandNeighbors = neighbor.neighbours.filter(
            (t) => !t.isWater,
          );

          // If neighbor has more land connections, it's part of a larger area
          if (neighborLandNeighbors.length > 2) {
            connectedAreas.add(neighbor.id);
          }
        }

        // If this connects distinct areas, it's a choke point
        if (connectedAreas.size >= 2) {
          chokePoints.push(tile);
        }
      }
    }

    return chokePoints;
  }

  /**
   * Verify if a tile is valid for city placement
   */
  private isValidCityLocation(tile: TileCore): boolean {
    // Cannot place on water
    if (tile.isWater) return false;

    // Cannot place where there's already a city
    if (tile.city) return false;

    // Cannot place in an area claimed by another player
    if (tile.areaOf && tile.areaOf.player !== this.player) return false;

    // Check minimum distance from existing cities
    for (const city of this.player.cities) {
      if (tile.getDistanceTo(city.tile) < this.MIN_CITY_DISTANCE) {
        return false;
      }
    }

    return true;
  }

  /**
   * Fallback method to find city location based on sweet spot value
   */
  private findCityLocation(startTile: TileCore): TileCore | null {
    // Check if we have a cached result
    if (this.defaultCitySpotCache.has(startTile.id)) {
      const cachedTile = this.defaultCitySpotCache.get(startTile.id)!;
      // Verify that cached tile is still valid
      if (!cachedTile.city && !cachedTile.areaOf) {
        return cachedTile;
      }
      // Clear invalid cache entry
      this.defaultCitySpotCache.delete(startTile.id);
    }

    const tiles = startTile.getTilesInRange(5);

    let bestSweetSpotValue = 0;
    let bestTile: TileCore | null = null;

    for (const tile of tiles) {
      if (startTile.passableArea !== tile.passableArea) {
        continue;
      }

      if (tile.sweetSpotValue > bestSweetSpotValue) {
        bestSweetSpotValue = tile.sweetSpotValue;
        bestTile = tile;
      }
    }

    // Cache the result
    if (bestTile) {
      this.defaultCitySpotCache.set(startTile.id, bestTile);
    }

    return bestTile;
  }
}
