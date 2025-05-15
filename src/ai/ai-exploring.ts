import { UnitTrait, UnitType } from "@/shared";
import { getMoveResult, MoveResult } from "@/core/movement";
import { findPath } from "@/core/pathfinding";
import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { AISystem } from "./ai-system";
import { PassableArea } from "@/core/tiles-map";
import { dataManager } from "@/core/data/dataManager";

const TILES_PER_EXPLORER = 300;
const MIN_EXPLORER_AREA = 10;
const MIN_NAVAL_EXPLORER_PRIORITY = 90;

export class ExploringAI extends AISystem {
  assignedTiles = new Set<TileCore>();

  plan() {
    this.assignedTiles.clear();
    this.operations = [];

    const edgeOfUnknown = this.getEdgeOfUnknown();

    // Track explorers by their current passable area
    const explorels = new Map<number, UnitCore[]>();
    // Track naval transport units (galleys)
    const navalTransports = this.ai.player.units.filter(
      (unit) =>
        unit.definition.type === UnitType.naval && unit.definition.capacity > 0,
    );

    // Map explorers to their current areas
    for (const unit of this.ai.player.units) {
      if (
        unit.definition.trait === UnitTrait.explorer &&
        unit.tile.passableArea
      ) {
        if (!explorels.has(unit.tile.passableArea.id)) {
          explorels.set(unit.tile.passableArea.id, []);
        }
        explorels.get(unit.tile.passableArea.id)!.push(unit);
      }
    }

    // Track land areas that are unexplored or under-explored
    const landAreasNeedingExplorers: PassableArea[] = [];

    // Check for areas that need explorers
    for (const passableArea of this.ai.player.knownPassableAreas.values()) {
      if (passableArea.area < MIN_EXPLORER_AREA) {
        continue;
      }
      const explorersNeeded = Math.floor(
        passableArea.area / TILES_PER_EXPLORER,
      );
      const haveExplorers = explorels.get(passableArea.id)?.length ?? 0;

      // If we need more explorers in this area
      if (haveExplorers < explorersNeeded) {
        const product = dataManager.units.get(
          passableArea.type === "land" ? "unit_scout" : "unit_galley",
        )!;

        // Request a unit to be produced
        this.ai.productionAi.request({
          focus: "expansion",
          priority: 100,
          product,
          passableArea,
        });

        // Track land areas needing explorers for possible naval transport
        if (passableArea.type === "land" && haveExplorers === 0) {
          landAreasNeedingExplorers.push(passableArea);
        }
      }
    }

    // Handle naval exploration for newly discovered land areas
    const inaccessibleAreas = this.findInaccessibleLandAreas(
      landAreasNeedingExplorers,
    );

    if (inaccessibleAreas.length > 0 && navalTransports.length > 0) {
      this.planNavalExploration(inaccessibleAreas);
    }

    // Standard exploration for units already in their target areas
    for (const explorers of explorels.values()) {
      for (const explorer of explorers) {
        // Skip units that are being transported
        if (explorer.parent) {
          continue;
        }

        const target = this.findTargetTile(edgeOfUnknown, explorer);
        if (target) {
          this.assignedTiles.add(target);
          this.operations.push({
            group: "unit",
            entityId: explorer.id,
            focus: "expansion",
            priority: 100,
            perform: () => {
              explorer.path = findPath(explorer, target);
            },
          });
        }
      }
    }
    return this.operations;
  }

  private findTargetTile(
    edgeOfUnknown: Set<TileCore>,
    unit: UnitCore,
  ): TileCore | null {
    let closestTile: TileCore | null = null;
    let closestDistance = Infinity;

    for (const tile of edgeOfUnknown) {
      if (this.assignedTiles.has(tile)) {
        continue;
      }
      const distance = unit.tile.getDistanceTo(tile);
      if (
        distance < closestDistance &&
        getMoveResult(unit, unit.tile, tile) === MoveResult.move
      ) {
        closestDistance = distance;
        closestTile = tile;
      }
    }

    return closestTile;
  }

  private getEdgeOfUnknown() {
    const edge = new Set<TileCore>();
    for (const exploredTile of this.ai.player.exploredTiles) {
      for (const neighbour of exploredTile.neighbours) {
        if (
          !neighbour.isMapEdge &&
          !this.ai.player.exploredTiles.has(neighbour)
        ) {
          edge.add(exploredTile);
        }
      }
    }
    return edge;
  }

  /**
   * Find land areas that are not accessible from the current land areas
   * where the player has units. These require naval transportation.
   */
  private findInaccessibleLandAreas(landAreas: PassableArea[]): PassableArea[] {
    if (landAreas.length === 0) return [];

    // Get all land areas where we currently have units
    const occupiedLandAreaIds = new Set<number>();
    for (const unit of this.ai.player.units) {
      if (
        unit.tile.passableArea?.type === "land" &&
        !unit.parent // Not being transported
      ) {
        occupiedLandAreaIds.add(unit.tile.passableArea.id);
      }
    }

    // If we don't have any land areas yet, all land areas are inaccessible
    if (occupiedLandAreaIds.size === 0) {
      return landAreas;
    }

    // Return areas that aren't in our occupied set
    return landAreas.filter((area) => !occupiedLandAreaIds.has(area.id));
  }

  /**
   * Plan naval exploration by using the TransportAI to transport explorers
   * to inaccessible land areas
   */
  private planNavalExploration(inaccessibleAreas: PassableArea[]) {
    // Get available land explorers (not already on a transport)
    const availableExplorers = this.ai.player.units.filter(
      (unit) =>
        unit.definition.trait === UnitTrait.explorer &&
        unit.definition.type === UnitType.land &&
        !unit.parent &&
        unit.tile.passableArea?.type === "land",
    );

    if (availableExplorers.length === 0) {
      // Request more explorers to be built with high priority
      this.ai.productionAi.request({
        focus: "expansion",
        priority: 120, // Higher priority for explorers needed for naval exploration
        product: dataManager.units.get("unit_scout")!,
      });
      return;
    }

    // For each inaccessible area, find a coastal tile
    for (const area of inaccessibleAreas) {
      // Find a coastal tile in this area (a land tile adjacent to water)
      const coastalTiles = this.findCoastalTilesForArea(area);
      if (coastalTiles.length === 0) continue;

      // If no available explorers, break
      if (availableExplorers.length === 0) break;

      // Find the best coastal tile as a target
      const bestCoastalTile = this.findBestCoastalTile(coastalTiles);
      if (!bestCoastalTile) continue;

      // Take the closest available explorer
      const explorer = availableExplorers[0];

      // Request transport to the target coastal tile using the TransportAI
      this.ai.transportAI.requestTransport(
        explorer,
        bestCoastalTile,
        MIN_NAVAL_EXPLORER_PRIORITY + 20,
        "expansion",
      );

      // Remove the used explorer from consideration
      availableExplorers.splice(0, 1);
    }
  }

  /**
   * Find the best coastal tile among candidates, considering resource richness
   * and exploration potential
   */
  private findBestCoastalTile(coastalTiles: TileCore[]): TileCore | null {
    if (coastalTiles.length === 0) return null;

    // Score each coastal tile based on its potential
    const scoredTiles = coastalTiles.map((tile) => {
      let score = 0;

      // Check for resources in range
      const tilesInRange = Array.from(tile.getTilesInRange(3));
      const resourcesCount = tilesInRange.filter((t) => t.resource).length;
      score += resourcesCount * 5;

      // Bonus for unexplored tiles in range
      const unexploredCount = tilesInRange.filter(
        (t) => !this.player.exploredTiles.has(t),
      ).length;
      score += unexploredCount * 2;

      // Bonus for good terrain
      if (tile.yields.food > 1) score += 3;
      if (tile.yields.production > 1) score += 3;

      return { tile, score };
    });

    // Sort by score descending
    scoredTiles.sort((a, b) => b.score - a.score);

    return scoredTiles[0].tile;
  }

  /**
   * Find coastal tiles (land tiles adjacent to water) for a given area
   */
  private findCoastalTilesForArea(area: PassableArea): TileCore[] {
    const coastalTiles: TileCore[] = [];

    // Iterate through all tiles to find ones in this area
    for (const tile of this.ai.player.exploredTiles) {
      if (tile.passableArea?.id === area.id && tile.isLand) {
        // Check if any neighbor is water
        const hasWaterNeighbor = tile.neighbours.some((n) => n.isWater);
        if (hasWaterNeighbor) {
          coastalTiles.push(tile);
        }
      }
    }

    return coastalTiles;
  }
}
