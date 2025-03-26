import { UnitTrait, UnitType } from "@/core/data.interface";
import { getMoveResult, MoveResult } from "@/core/movement";
import { findPath } from "@/core/pathfinding";
import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { AISystem } from "./ai-system";
import { getUnitById } from "@/core/data-manager";
import { PassableArea } from "@/core/tiles-map";

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
        unit.definition.type === UnitType.naval && unit.definition.capacity > 0
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
        passableArea.area / TILES_PER_EXPLORER
      );
      const haveExplorers = explorels.get(passableArea.id)?.length ?? 0;

      // If we need more explorers in this area
      if (haveExplorers < explorersNeeded) {
        const product = getUnitById(
          passableArea.type === "land" ? "unit_scout" : "unit_galley"
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
      landAreasNeedingExplorers
    );

    if (inaccessibleAreas.length > 0 && navalTransports.length > 0) {
      this.planNavalExploration(inaccessibleAreas, navalTransports);
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
    unit: UnitCore
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
   * Plan naval exploration by matching explorers with transport ships
   * and setting up missions to reach inaccessible land areas
   */
  private planNavalExploration(
    inaccessibleAreas: PassableArea[],
    navalTransports: UnitCore[]
    // explorersByArea: Map<number, UnitCore[]>
  ) {
    // Get available land explorers (not already on a transport)
    const availableExplorers = this.ai.player.units.filter(
      (unit) =>
        unit.definition.trait === UnitTrait.explorer &&
        unit.definition.type === UnitType.land &&
        !unit.parent &&
        unit.tile.passableArea?.type === "land"
    );

    if (availableExplorers.length === 0) {
      // Request more explorers to be built with high priority
      this.ai.productionAi.request({
        focus: "expansion",
        priority: 120, // Higher priority for explorers needed for naval exploration
        product: getUnitById("unit_scout")!,
      });
      return;
    }

    // For each inaccessible area, find a coastal tile
    for (const area of inaccessibleAreas) {
      // Find a coastal tile in this area (a land tile adjacent to water)
      const coastalTiles = this.findCoastalTilesForArea(area);
      if (coastalTiles.length === 0) continue;

      // Sort transports by which are not already assigned tasks
      const availableTransports = navalTransports.filter(
        (transport) => !this.hasActiveOperation(transport.id)
      );
      if (availableTransports.length === 0) {
        // Request more transport ships to be built
        this.ai.productionAi.request({
          focus: "expansion",
          priority: MIN_NAVAL_EXPLORER_PRIORITY,
          product: getUnitById("unit_galley")!,
        });
        continue;
      }

      // Find the explorer closest to any available transport
      const explorer = this.findClosestExplorer(
        availableExplorers,
        availableTransports
      );
      if (!explorer) continue;

      // Find the transport closest to the explorer
      const transport = this.findClosestTransport(
        explorer,
        availableTransports
      );
      if (!transport) continue;

      // Find the coastal tile closest to the transport
      const targetCoastalTile = this.findClosestCoastalTile(
        transport,
        coastalTiles
      );
      if (!targetCoastalTile) continue;

      // Create operations to:
      // 1. Move transport to pick up explorer
      this.operations.push({
        group: "unit",
        entityId: transport.id,
        focus: "expansion",
        priority: MIN_NAVAL_EXPLORER_PRIORITY + 5,
        perform: () => {
          // Find a water tile adjacent to the explorer
          const adjacentWaterTiles = explorer.tile.neighbours.filter(
            (tile) => tile.isWater
          );
          if (adjacentWaterTiles.length > 0) {
            transport.path = findPath(transport, adjacentWaterTiles[0]);
          }
        },
      });

      // 2. Move explorer to embark on transport
      this.operations.push({
        group: "unit",
        entityId: explorer.id,
        focus: "expansion",
        priority: MIN_NAVAL_EXPLORER_PRIORITY + 5,
        perform: () => {
          // If transport is adjacent to explorer, embark
          if (explorer.tile.neighbours.includes(transport.tile)) {
            explorer.path = [[transport.tile]];
          }
        },
      });

      // 3. Move transport with explorer to target coastal tile
      this.operations.push({
        group: "unit",
        entityId: transport.id,
        focus: "expansion",
        priority: MIN_NAVAL_EXPLORER_PRIORITY + 3,
        perform: () => {
          // Only execute if explorer is on board
          if (transport.children.includes(explorer)) {
            // Find water tile adjacent to target coastal tile
            const adjacentWaterTiles = targetCoastalTile.neighbours.filter(
              (tile) => tile.isWater
            );
            if (adjacentWaterTiles.length > 0) {
              transport.path = findPath(transport, adjacentWaterTiles[0]);
            }
          }
        },
      });

      // 4. Disembark explorer onto the target land
      this.operations.push({
        group: "unit",
        entityId: explorer.id,
        focus: "expansion",
        priority: MIN_NAVAL_EXPLORER_PRIORITY + 2,
        perform: () => {
          // Only execute if explorer is on board the transport
          if (explorer.parent === transport) {
            // Check if transport is adjacent to the target coastal tile
            if (transport.tile.neighbours.includes(targetCoastalTile)) {
              // Set path to disembark
              explorer.path = [[targetCoastalTile]];
            }
          }
        },
      });

      // Remove the used explorer and transport from consideration
      availableExplorers.splice(availableExplorers.indexOf(explorer), 1);
      availableTransports.splice(availableTransports.indexOf(transport), 1);

      if (availableExplorers.length === 0 || availableTransports.length === 0) {
        break;
      }
    }
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

  /**
   * Find the explorer closest to any of the available transports
   */
  private findClosestExplorer(
    explorers: UnitCore[],
    transports: UnitCore[]
  ): UnitCore | null {
    if (explorers.length === 0 || transports.length === 0) return null;

    let closestExplorer: UnitCore | null = null;
    let shortestDistance = Infinity;

    for (const explorer of explorers) {
      for (const transport of transports) {
        const distance = explorer.tile.getDistanceTo(transport.tile);
        if (distance < shortestDistance) {
          shortestDistance = distance;
          closestExplorer = explorer;
        }
      }
    }

    return closestExplorer;
  }

  /**
   * Find the transport closest to the given explorer
   */
  private findClosestTransport(
    explorer: UnitCore,
    transports: UnitCore[]
  ): UnitCore | null {
    if (transports.length === 0) return null;

    let closestTransport: UnitCore | null = null;
    let shortestDistance = Infinity;

    for (const transport of transports) {
      const distance = explorer.tile.getDistanceTo(transport.tile);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        closestTransport = transport;
      }
    }

    return closestTransport;
  }

  /**
   * Find the coastal tile closest to the transport
   */
  private findClosestCoastalTile(
    transport: UnitCore,
    coastalTiles: TileCore[]
  ): TileCore | null {
    if (coastalTiles.length === 0) return null;

    let closestTile: TileCore | null = null;
    let shortestDistance = Infinity;

    for (const tile of coastalTiles) {
      const distance = transport.tile.getDistanceTo(tile);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        closestTile = tile;
      }
    }

    return closestTile;
  }

  /**
   * Check if there's already an active operation for this unit
   */
  private hasActiveOperation(unitId: number): boolean {
    return this.operations.some((op) => op.entityId === unitId);
  }
}
