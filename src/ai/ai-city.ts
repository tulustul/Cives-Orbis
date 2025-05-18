import { CityCore } from "@/core/city";
import { ProductDefinition } from "@/core/data/types";
import { AISystem } from "./ai-system";
import { BuildingDefinition } from "./utils";

/**
 * Enum for different city specializations
 */
enum CitySpecialization {
  GENERAL = "general", // Balanced focus
  GROWTH = "growth", // Focus on population growth
  PRODUCTION = "production", // Focus on production output
  SCIENCE = "science", // Focus on knowledge generation
  DEFENSE = "defense", // Focus on defense and military
  ECONOMY = "economy", // Focus on resource generation
}

/**
 * Building category types for evaluation
 */
enum BuildingCategory {
  FOOD = "food", // Buildings that increase food output
  PRODUCTION = "production", // Buildings that increase production output
  SCIENCE = "science", // Buildings that increase knowledge output
  DEFENSE = "defense", // Buildings that increase defense
  ECONOMY = "economy", // Buildings that increase resource generation
  UTILITY = "utility", // Buildings with other utility functions
}

/**
 * Information about a city's AI management
 */
type CityAIInfo = {
  cityId: number;
  specialization: CitySpecialization;
  buildingsNeeded: Map<BuildingCategory, number>; // Priority score for each building category
  lastEvaluatedTurn: number;
};

export class CityAI extends AISystem {
  // Store information about AI management for each city
  private cityInfo = new Map<number, CityAIInfo>();

  // Building category keywords for classification
  private buildingCategoryKeywords = {
    [BuildingCategory.FOOD]: [
      "farm",
      "granary",
      "food",
      "growth",
      "irrigation",
    ],
    [BuildingCategory.PRODUCTION]: [
      "workshop",
      "factory",
      "production",
      "forge",
      "industry",
    ],
    [BuildingCategory.SCIENCE]: [
      "library",
      "university",
      "academy",
      "science",
      "knowledge",
      "research",
    ],
    [BuildingCategory.DEFENSE]: [
      "wall",
      "fortress",
      "barracks",
      "defense",
      "military",
    ],
    [BuildingCategory.ECONOMY]: [
      "market",
      "trade",
      "economy",
      "gold",
      "wealth",
      "bank",
      "commerce",
    ],
    [BuildingCategory.UTILITY]: ["monument", "temple", "palace", "wonder"],
  };

  plan() {
    this.operations = [];

    // Update city specializations
    this.updateCitySpecializations();

    // Process each city without production
    for (const city of this.player.citiesWithoutProduction) {
      this.processCityProduct(city);
    }

    return this.operations;
  }

  /**
   * Update city specializations based on current game state
   */
  private updateCitySpecializations() {
    // Process each city
    for (const city of this.player.cities) {
      // Create or update city info
      if (!this.cityInfo.has(city.id)) {
        this.cityInfo.set(city.id, {
          cityId: city.id,
          specialization: CitySpecialization.GENERAL,
          buildingsNeeded: new Map(),
          lastEvaluatedTurn: 0,
        });
      }

      // Only re-evaluate periodically to avoid thrashing
      const info = this.cityInfo.get(city.id)!;
      const currentTurn = this.player.game.turn;

      if (currentTurn - info.lastEvaluatedTurn >= 5) {
        // Determine best specialization for this city
        info.specialization = this.determineCitySpecialization(
          city,
          this.ai.strategicAI.strategicFocus,
        );
        // Update buildings needed
        info.buildingsNeeded = this.evaluateCityBuildingNeeds(
          city,
          info.specialization,
        );
        info.lastEvaluatedTurn = currentTurn;
      }

      // Cancel idle products periodically to reassess
      if (
        city.production.product?.entityType === "idleProduct" &&
        Math.random() > 0.8
      ) {
        city.production.cancelProduction();
      }
    }
  }

  /**
   * Determine the best specialization for a city based on its attributes
   */
  private determineCitySpecialization(
    city: CityCore,
    strategicFocus: string,
  ): CitySpecialization {
    // Count tiles by yield type
    let foodTiles = 0;
    let productionTiles = 0;
    let resourceTiles = 0;

    // Analyze city's workable tiles
    for (const tile of city.expansion.tiles) {
      if (tile.yields.food > 2) foodTiles++;
      if (tile.yields.production > 2) productionTiles++;
      if (tile.resource) resourceTiles++;
    }

    // Check if it's a border city that needs defense
    const isBorderCity = this.isBorderCity(city);

    // Calculate city population size relative to average
    const avgPopulation =
      this.player.cities.reduce((sum, c) => sum + c.population.total, 0) /
      Math.max(1, this.player.cities.length);
    const isSmallerThanAverage = city.population.total < avgPopulation * 0.8;

    // Calculate city priority scores
    let growthScore = foodTiles * 2 + (isSmallerThanAverage ? 20 : 0);
    let productionScore = productionTiles * 2;
    let defenseScore = isBorderCity ? 30 : 0;
    let economyScore = resourceTiles * 3;
    let scienceScore = city === this.player.cities[0] ? 20 : 0; // First city gets science bonus

    // Adjust based on strategic focus
    if (strategicFocus === "conquest") {
      productionScore += 15;
      defenseScore += 10;
    } else if (strategicFocus === "scientific") {
      scienceScore += 15;
      growthScore += 5;
    } else if (strategicFocus === "economic") {
      economyScore += 15;
      growthScore += 5;
    }

    // Determine highest score
    const scores = [
      { type: CitySpecialization.GROWTH, score: growthScore },
      { type: CitySpecialization.PRODUCTION, score: productionScore },
      { type: CitySpecialization.DEFENSE, score: defenseScore },
      { type: CitySpecialization.ECONOMY, score: economyScore },
      { type: CitySpecialization.SCIENCE, score: scienceScore },
    ];

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    // If the city already has a specialization, don't change it too easily
    // to avoid constant shifting of focus
    if (this.cityInfo.has(city.id)) {
      const currentSpec = this.cityInfo.get(city.id)!.specialization;
      const currentScore = scores.find((s) => s.type === currentSpec);
      const highestScore = scores[0];

      // Only change if the new best score is significantly higher
      if (currentScore && highestScore.score - currentScore.score < 10) {
        return currentSpec;
      }
    }

    return scores[0].type;
  }

  /**
   * Check if a city is on a border and potentially needs defense
   */
  private isBorderCity(city: CityCore): boolean {
    // Get all tiles owned by the player
    const ownedTiles = new Set<number>();
    for (const c of this.player.cities) {
      for (const tile of c.expansion.tiles) {
        ownedTiles.add(tile.id);
      }
    }

    // Check if this city has tiles adjacent to non-owned tiles
    for (const tile of city.expansion.tiles) {
      for (const neighbor of tile.neighbours) {
        // Skip water tiles
        if (neighbor.isWater) continue;

        // If we find a land tile not owned by us, this is potentially a border
        if (!ownedTiles.has(neighbor.id) && !neighbor.isWater) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Evaluate which building categories a city needs based on its specialization
   */
  private evaluateCityBuildingNeeds(
    city: CityCore,
    specialization: CitySpecialization,
  ): Map<BuildingCategory, number> {
    const needs = new Map<BuildingCategory, number>();

    // Set base priorities for all categories
    needs.set(BuildingCategory.FOOD, 10);
    needs.set(BuildingCategory.PRODUCTION, 10);
    needs.set(BuildingCategory.SCIENCE, 10);
    needs.set(BuildingCategory.DEFENSE, 10);
    needs.set(BuildingCategory.ECONOMY, 10);
    needs.set(BuildingCategory.UTILITY, 5);

    // Adjust based on specialization
    switch (specialization) {
      case CitySpecialization.GROWTH:
        needs.set(BuildingCategory.FOOD, 30);
        needs.set(BuildingCategory.UTILITY, 15);
        break;

      case CitySpecialization.PRODUCTION:
        needs.set(BuildingCategory.PRODUCTION, 30);
        needs.set(BuildingCategory.FOOD, 15);
        break;

      case CitySpecialization.DEFENSE:
        needs.set(BuildingCategory.DEFENSE, 30);
        needs.set(BuildingCategory.PRODUCTION, 20);
        break;

      case CitySpecialization.ECONOMY:
        needs.set(BuildingCategory.ECONOMY, 30);
        needs.set(BuildingCategory.FOOD, 15);
        break;

      case CitySpecialization.SCIENCE:
        needs.set(BuildingCategory.SCIENCE, 30);
        needs.set(BuildingCategory.FOOD, 15);
        break;
    }

    // Adjust based on city conditions

    // If city is small, prioritize growth
    if (city.population.total < 3) {
      needs.set(
        BuildingCategory.FOOD,
        Math.max(needs.get(BuildingCategory.FOOD)!, 25),
      );
    }

    // If city has lots of resources, boost economy
    const resourceCount = Array.from(city.expansion.tiles).filter(
      (t) => t.resource,
    ).length;
    if (resourceCount >= 3) {
      needs.set(
        BuildingCategory.ECONOMY,
        Math.max(needs.get(BuildingCategory.ECONOMY)!, 20),
      );
    }

    // If this is the capital, boost science
    if (city === this.player.cities[0]) {
      needs.set(
        BuildingCategory.SCIENCE,
        Math.max(needs.get(BuildingCategory.SCIENCE)!, 20),
      );
      needs.set(
        BuildingCategory.UTILITY,
        Math.max(needs.get(BuildingCategory.UTILITY)!, 15),
      );
    }

    return needs;
  }

  /**
   * Categorize a building based on its attributes
   */
  private categorizeBuilding(building: any): BuildingCategory {
    // First check based on yields
    if (building.yields) {
      if (building.yields.food > 0) return BuildingCategory.FOOD;
      if (building.yields.production > 0) return BuildingCategory.PRODUCTION;
      if (building.yields.knowledge > 0) return BuildingCategory.SCIENCE;
    }

    // Check defense buildings
    if (building.defense && building.defense > 0) {
      return BuildingCategory.DEFENSE;
    }

    // Check based on name keywords
    const name = building.name.toLowerCase();

    for (const [category, keywords] of Object.entries(
      this.buildingCategoryKeywords,
    )) {
      for (const keyword of keywords) {
        if (name.includes(keyword)) {
          return category as BuildingCategory;
        }
      }
    }

    // Default to utility
    return BuildingCategory.UTILITY;
  }

  /**
   * Process production for a city
   */
  private processCityProduct(city: CityCore) {
    const cityInfo = this.cityInfo.get(city.id);
    if (!cityInfo) return;

    // Get available buildings
    const buildings = city.production.availableBuildings.filter(
      (b) => !city.production.disabledProducts.has(b),
    );

    // If we have buildings to choose from, evaluate them
    if (buildings.length) {
      // Score each building
      const buildingScores = buildings.map((building) => {
        const category = this.categorizeBuilding(building);
        const need = cityInfo.buildingsNeeded.get(category) || 5;

        // Calculate base score from need
        let score = need;

        // Adjust based on production cost
        const buildingDef = building as unknown as BuildingDefinition;
        if (buildingDef.cost) {
          score = (score * 20) / Math.max(10, buildingDef.cost.value);
        }

        // Adjust for buildings that enable new units or other buildings
        if (buildingDef.enables && buildingDef.enables.length > 0) {
          score += 10;
        }

        return { building, score };
      });

      // Sort by score descending
      buildingScores.sort((a, b) => b.score - a.score);

      // Choose the highest scoring building
      const product = buildingScores[0].building;

      this.operations.push({
        group: "city-produce",
        entityId: city.id,
        focus: "economy",
        priority: 100,
        perform: () => city.production.produce(product),
      });
    }
    // Otherwise, choose an idle product
    else if (city.production.availableIdleProducts.length > 0) {
      // Filter idle products
      const idleProducts = city.production.availableIdleProducts;
      let chosenProduct: ProductDefinition;

      // Choose based on specialization
      if (cityInfo.specialization === CitySpecialization.GROWTH) {
        // Find growth-related products
        const growthProducts = idleProducts.filter((p) =>
          p.name.toLowerCase().includes("growth"),
        );
        chosenProduct =
          growthProducts.length > 0
            ? growthProducts[Math.floor(Math.random() * growthProducts.length)]
            : idleProducts[Math.floor(Math.random() * idleProducts.length)];
      } else {
        // Just pick a random one
        chosenProduct =
          idleProducts[Math.floor(Math.random() * idleProducts.length)];
      }

      this.operations.push({
        group: "city-produce",
        entityId: city.id,
        focus: "economy",
        priority: 10,
        perform: () => city.production.produce(chosenProduct),
      });
    }
  }

  /**
   * Get the city specialization for external systems
   */
  getCitySpecialization(cityId: number): string {
    return (
      this.cityInfo.get(cityId)?.specialization || CitySpecialization.GENERAL
    );
  }
}
