import { dataManager } from "@/core/data/dataManager";
import { findPath } from "@/core/pathfinding";
import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { AISystem } from "./ai-system";
import { AiOrder } from "./types";

/**
 * Transport request status
 */
enum TransportRequestStatus {
  PENDING = "pending", // Transport request is pending processing
  AWAITING_TRANSPORT = "awaiting_transport", // Waiting for transport vessel to be available
  AWAITING_UNIT = "awaiting_unit", // Waiting for unit to reach embarkation point
  EN_ROUTE = "en_route", // Transport is in progress
  DISEMBARKING = "disembarking", // Unit is disembarking at destination
  COMPLETED = "completed", // Transport has been completed
  FAILED = "failed", // Transport has failed
}

/**
 * A request for transporting units over water
 */
interface TransportRequest {
  id: number; // Unique identifier for this transport request
  priority: number; // Priority of this transport request
  unitId: number; // ID of the unit to transport
  startTile: TileCore; // Starting tile
  destinationTile: TileCore; // Destination tile
  transportId?: number; // ID of the transport vessel assigned (if any)
  embarkationPoint?: TileCore; // Coastal tile where the unit will embark
  disembarkationPoint?: TileCore; // Coastal tile where the unit will disembark
  status: TransportRequestStatus; // Current status of this request
  createdTurn: number; // Turn when this request was created
  focus: "expansion" | "military" | "economy"; // Strategic focus of this transport
}

/**
 * Manages the transportation of land units over water
 */
export class NavalTransportAI extends AISystem {
  // All active transport requests
  private transportRequests: TransportRequest[] = [];

  // Last assigned ID
  private lastRequestId = 0;

  // Units currently being used as transports
  private assignedTransports = new Set<number>();

  // Cache of known transport vessels
  private transportVessels: UnitCore[] = [];

  private orders: AiOrder[] = [];

  *plan(): Generator<AiOrder> {
    this.orders = [];

    // Update transport vessel cache
    this.updateTransportVessels();

    // Clean up completed or failed requests
    this.cleanUpRequests();

    // Process each transport request according to its status
    for (const request of this.transportRequests) {
      switch (request.status) {
        case TransportRequestStatus.PENDING:
          this.processPendingRequest(request);
          break;

        case TransportRequestStatus.AWAITING_TRANSPORT:
          this.processAwaitingTransport(request);
          break;

        case TransportRequestStatus.AWAITING_UNIT:
          this.processAwaitingUnit(request);
          break;

        case TransportRequestStatus.EN_ROUTE:
          this.processEnRoute(request);
          break;

        case TransportRequestStatus.DISEMBARKING:
          this.processDisembarking(request);
          break;
      }
    }

    yield* this.orders;
  }

  /**
   * Create a new transport request for a unit
   */
  requestTransport(
    unit: UnitCore,
    destination: TileCore,
    priority: number = 100,
    focus: "expansion" | "military" | "economy" = "military",
  ): TransportRequest | null {
    // Check if unit can be transported (must be land unit)
    if (!unit.isLand) {
      return null;
    }

    // Check if unit is already being transported
    if (this.isUnitInTransport(unit.id)) {
      return null;
    }

    // Create the transport request
    const request: TransportRequest = {
      id: ++this.lastRequestId,
      priority,
      unitId: unit.id,
      startTile: unit.tile,
      destinationTile: destination,
      status: TransportRequestStatus.PENDING,
      createdTurn: this.player.game.turn,
      focus,
    };

    // Add to the list of active requests
    this.transportRequests.push(request);

    return request;
  }

  /**
   * Check if a unit is already being transported
   */
  private isUnitInTransport(unitId: number): boolean {
    return this.transportRequests.some(
      (request) =>
        request.unitId === unitId &&
        request.status !== TransportRequestStatus.COMPLETED &&
        request.status !== TransportRequestStatus.FAILED,
    );
  }

  /**
   * Update the cache of available transport vessels
   */
  private updateTransportVessels() {
    this.transportVessels = this.player.units.filter(
      (unit) =>
        unit.isNaval &&
        unit.isTransport &&
        !this.assignedTransports.has(unit.id),
    );
  }

  /**
   * Remove completed or failed transport requests after a certain time
   */
  private cleanUpRequests() {
    const currentTurn = this.player.game.turn;

    // Remove requests that are completed or failed and older than 10 turns
    this.transportRequests = this.transportRequests.filter((request) => {
      // Keep all active requests
      if (
        request.status !== TransportRequestStatus.COMPLETED &&
        request.status !== TransportRequestStatus.FAILED
      ) {
        return true;
      }

      // Remove old completed or failed requests
      return currentTurn - request.createdTurn < 10;
    });

    // Update assigned transports list
    this.assignedTransports.clear();
    for (const request of this.transportRequests) {
      if (
        request.transportId &&
        request.status !== TransportRequestStatus.COMPLETED &&
        request.status !== TransportRequestStatus.FAILED
      ) {
        this.assignedTransports.add(request.transportId);
      }
    }
  }

  /**
   * Get the unit object for a given ID
   */
  private getUnit(unitId: number): UnitCore | null {
    return this.player.units.find((unit) => unit.id === unitId) || null;
  }

  /**
   * Process a pending transport request - Find embarkation and disembarkation points
   */
  private processPendingRequest(request: TransportRequest) {
    const unit = this.getUnit(request.unitId);
    if (!unit) {
      request.status = TransportRequestStatus.FAILED;
      return;
    }

    // Find embarkation and disembarkation points
    const [embarkationPoint, disembarkationPoint] = this.findWaterCrossing(
      unit.tile,
      request.destinationTile,
    );

    if (!embarkationPoint || !disembarkationPoint) {
      // Can't find a water crossing
      request.status = TransportRequestStatus.FAILED;
      return;
    }

    // Update request with crossing points
    request.embarkationPoint = embarkationPoint;
    request.disembarkationPoint = disembarkationPoint;

    // Find an available transport vessel
    const transport = this.findAvailableTransport(embarkationPoint);

    if (transport) {
      // Assign transport to this request
      request.transportId = transport.id;
      this.assignedTransports.add(transport.id);

      // Wait for unit to reach embarkation point
      request.status = TransportRequestStatus.AWAITING_UNIT;

      // Move transport to embarkation point if needed
      if (transport.tile !== embarkationPoint) {
        this.orders.push({
          group: "unit",
          entityId: transport.id,
          focus: request.focus,
          priority: request.priority,
          perform: () => {
            transport.path = findPath(transport, embarkationPoint);
          },
        });
      }
    } else {
      // No transport available, request one from production
      this.requestTransportProduction();
      request.status = TransportRequestStatus.AWAITING_TRANSPORT;
    }

    // Start moving the unit to the embarkation point
    this.orders.push({
      group: "unit",
      entityId: unit.id,
      focus: request.focus,
      priority: request.priority,
      perform: () => {
        unit.path = findPath(unit, embarkationPoint);
      },
    });
  }

  /**
   * Process a request that's waiting for a transport to become available
   */
  private processAwaitingTransport(request: TransportRequest) {
    const unit = this.getUnit(request.unitId);
    if (!unit || !request.embarkationPoint) {
      request.status = TransportRequestStatus.FAILED;
      return;
    }

    // Try to find an available transport
    const transport = this.findAvailableTransport(request.embarkationPoint);

    if (transport) {
      // Assign transport to this request
      request.transportId = transport.id;
      this.assignedTransports.add(transport.id);

      // Update status
      request.status = TransportRequestStatus.AWAITING_UNIT;

      // Move transport to embarkation point if needed
      if (transport.tile !== request.embarkationPoint) {
        this.orders.push({
          group: "unit",
          entityId: transport.id,
          focus: request.focus,
          priority: request.priority,
          perform: () => {
            if (request.embarkationPoint) {
              transport.path = findPath(transport, request.embarkationPoint);
            }
          },
        });
      }
    } else {
      // Still no transport, keep requesting one
      this.requestTransportProduction();
    }

    // Continue moving the unit to the embarkation point
    if (unit.tile !== request.embarkationPoint) {
      this.orders.push({
        group: "unit",
        entityId: unit.id,
        focus: request.focus,
        priority: request.priority,
        perform: () => {
          if (request.embarkationPoint) {
            unit.path = findPath(unit, request.embarkationPoint);
          }
        },
      });
    }
  }

  /**
   * Process a request that's waiting for the unit to reach the embarkation point
   */
  private processAwaitingUnit(request: TransportRequest) {
    const unit = this.getUnit(request.unitId);
    const transport = request.transportId
      ? this.getUnit(request.transportId)
      : null;

    if (
      !unit ||
      !transport ||
      !request.embarkationPoint ||
      !request.disembarkationPoint
    ) {
      request.status = TransportRequestStatus.FAILED;
      return;
    }

    // Check if both the unit and transport are at the embarkation point
    const unitAtEmbarkation =
      unit.tile === request.embarkationPoint ||
      unit.tile.getDistanceTo(request.embarkationPoint) <= 1;
    const transportAtEmbarkation =
      transport.tile === request.embarkationPoint ||
      transport.tile.getDistanceTo(request.embarkationPoint) <= 1;

    if (unitAtEmbarkation && transportAtEmbarkation) {
      // Both are at the embarkation point, embark the unit on the transport
      this.orders.push({
        group: "unit",
        entityId: unit.id,
        focus: request.focus,
        priority: request.priority + 10, // Higher priority for embarking
        perform: () => {
          // Move to transport's tile to embark
          unit.path = [[transport.tile]];
        },
      });

      // Check if unit is now a child of the transport
      if (transport.children.includes(unit)) {
        // Unit has embarked, start the journey
        request.status = TransportRequestStatus.EN_ROUTE;
      }
    } else {
      // Continue moving both to the embarkation point
      if (!unitAtEmbarkation) {
        this.orders.push({
          group: "unit",
          entityId: unit.id,
          focus: request.focus,
          priority: request.priority,
          perform: () => {
            if (request.embarkationPoint) {
              unit.path = findPath(unit, request.embarkationPoint);
            }
          },
        });
      }

      if (!transportAtEmbarkation) {
        this.orders.push({
          group: "unit",
          entityId: transport.id,
          focus: request.focus,
          priority: request.priority,
          perform: () => {
            if (request.embarkationPoint) {
              transport.path = findPath(transport, request.embarkationPoint);
            }
          },
        });
      }
    }
  }

  /**
   * Process a request where the transport is en route to the destination
   */
  private processEnRoute(request: TransportRequest) {
    const transport = request.transportId
      ? this.getUnit(request.transportId)
      : null;
    const unit = this.getUnit(request.unitId);

    if (!transport || !unit || !request.disembarkationPoint) {
      request.status = TransportRequestStatus.FAILED;
      return;
    }

    // Verify unit is on transport
    if (!transport.children.includes(unit)) {
      request.status = TransportRequestStatus.FAILED;
      return;
    }

    // Check if transport is at disembarkation point
    if (
      transport.tile === request.disembarkationPoint ||
      transport.tile.getDistanceTo(request.disembarkationPoint) <= 1
    ) {
      // We've arrived, move to disembarkation stage
      request.status = TransportRequestStatus.DISEMBARKING;
    } else {
      // Keep moving to disembarkation point
      this.orders.push({
        group: "unit",
        entityId: transport.id,
        focus: request.focus,
        priority: request.priority,
        perform: () => {
          if (request.disembarkationPoint) {
            transport.path = findPath(transport, request.disembarkationPoint);
          }
        },
      });
    }
  }

  /**
   * Process a request where the unit is disembarking at the destination
   */
  private processDisembarking(request: TransportRequest) {
    const transport = request.transportId
      ? this.getUnit(request.transportId)
      : null;
    const unit = this.getUnit(request.unitId);

    if (!transport || !unit || !request.disembarkationPoint) {
      request.status = TransportRequestStatus.FAILED;
      return;
    }

    // Check if unit is still on transport
    if (transport.children.includes(unit)) {
      // Order unit to disembark
      this.orders.push({
        group: "unit",
        entityId: unit.id,
        focus: request.focus,
        priority: request.priority + 10, // Higher priority for disembarking
        perform: () => {
          unit.path = [[request.disembarkationPoint!]];
        },
      });
    } else {
      // Unit has disembarked, move to final destination
      this.orders.push({
        group: "unit",
        entityId: unit.id,
        focus: request.focus,
        priority: request.priority,
        perform: () => {
          unit.path = findPath(unit, request.destinationTile);
        },
      });

      // Mark as completed
      request.status = TransportRequestStatus.COMPLETED;

      // Free up the transport
      if (request.transportId) {
        this.assignedTransports.delete(request.transportId);
      }
    }
  }

  /**
   * Find embarkation and disembarkation points for a water crossing
   * Returns [embarkationPoint, disembarkationPoint] or [null, null] if no crossing is possible
   */
  private findWaterCrossing(
    start: TileCore,
    destination: TileCore,
  ): [TileCore | null, TileCore | null] {
    // Check if both tiles are in the same land mass
    if (start.passableArea === destination.passableArea) {
      // No water crossing needed, land path exists
      return [null, null];
    }

    // Find coastal tiles near the start point
    const startCoastalTiles = this.findCoastalTiles(start, 5);

    // Find coastal tiles near the destination
    const destinationCoastalTiles = this.findCoastalTiles(destination, 5);

    if (
      startCoastalTiles.length === 0 ||
      destinationCoastalTiles.length === 0
    ) {
      // No coastal tiles found, can't cross
      return [null, null];
    }

    // Find the best pair of coastal tiles
    let bestEmbarkation: TileCore | null = null;
    let bestDisembarkation: TileCore | null = null;
    let bestScore = Infinity;

    for (const embarkTile of startCoastalTiles) {
      for (const disembarkTile of destinationCoastalTiles) {
        // Calculate the total distance: start→embark + embark→disembark + disembark→destination
        const startToEmbark = start.getDistanceTo(embarkTile);
        const waterCrossing = embarkTile.getDistanceTo(disembarkTile);
        const disembarkToDest = disembarkTile.getDistanceTo(destination);

        const totalScore = startToEmbark + waterCrossing + disembarkToDest;

        if (totalScore < bestScore) {
          bestScore = totalScore;
          bestEmbarkation = embarkTile;
          bestDisembarkation = disembarkTile;
        }
      }
    }

    return [bestEmbarkation, bestDisembarkation];
  }

  /**
   * Find coastal tiles near a given tile
   */
  private findCoastalTiles(tile: TileCore, radius: number): TileCore[] {
    const result: TileCore[] = [];
    const allTiles = Array.from(tile.getTilesInRange(radius));

    // Only consider tiles in the same passable area as the start
    const sameLandmass = allTiles.filter(
      (t) => t.passableArea === tile.passableArea,
    );

    // Find coastal tiles (land tiles adjacent to water)
    for (const t of sameLandmass) {
      if (t.isLand && t.neighbours.some((n) => n.isWater)) {
        result.push(t);
      }
    }

    return result;
  }

  /**
   * Find an available transport vessel that can reach the embarkation point
   */
  private findAvailableTransport(embarkationPoint: TileCore): UnitCore | null {
    if (this.transportVessels.length === 0) {
      return null;
    }

    // Sort transports by distance to embarkation point
    const sortedTransports = [...this.transportVessels].sort((a, b) => {
      const distA = a.tile.getDistanceTo(embarkationPoint);
      const distB = b.tile.getDistanceTo(embarkationPoint);
      return distA - distB;
    });

    // Check if any transport can reach the embarkation point (share water passable area)
    for (const transport of sortedTransports) {
      // Skip transports that are already full
      if (transport.children.length >= transport.definition.capacity!) {
        continue;
      }

      // Check if this transport can navigate to the embarkation point
      // This is a simple check - ideally we'd do pathfinding
      const transportWaterArea = this.getWaterPassableAreaNear(transport.tile);
      const embarkWaterArea = this.getWaterPassableAreaNear(embarkationPoint);

      if (
        transportWaterArea &&
        embarkWaterArea &&
        transportWaterArea === embarkWaterArea
      ) {
        return transport;
      }
    }

    return null;
  }

  /**
   * Get the water passable area near a tile
   */
  private getWaterPassableAreaNear(tile: TileCore): number | null {
    // If the tile is water, get its passable area
    if (tile.isWater && tile.passableArea) {
      return tile.passableArea.id;
    }

    // Otherwise, look for adjacent water tiles
    for (const neighbor of tile.neighbours) {
      if (neighbor.isWater && neighbor.passableArea) {
        return neighbor.passableArea.id;
      }
    }

    return null;
  }

  /**
   * Request production of a new transport vessel
   */
  private requestTransportProduction() {
    // Get transport unit definition
    const galleyDef = dataManager.units.get("unit_galley");
    if (!galleyDef) return;

    // Find a coastal city to build it
    const coastalCities = this.player.cities.filter((city) =>
      Array.from(city.expansion.tiles).some((tile) =>
        tile.neighbours.some((n) => n.isWater),
      ),
    );

    if (coastalCities.length === 0) return;

    // Request transport production
    this.ai.productionAi.request({
      focus: "military",
      priority: 120, // High priority for transport ships
      product: galleyDef,
    });
  }

  /**
   * Cancel a transport request
   */
  cancelRequest(requestId: number): boolean {
    const index = this.transportRequests.findIndex(
      (req) => req.id === requestId,
    );
    if (index === -1) return false;

    const request = this.transportRequests[index];
    request.status = TransportRequestStatus.FAILED;

    // Free up the transport
    if (request.transportId) {
      this.assignedTransports.delete(request.transportId);
    }

    return true;
  }

  /**
   * Get the status of a transport request
   */
  getRequestStatus(requestId: number): TransportRequestStatus | null {
    const request = this.transportRequests.find((req) => req.id === requestId);
    return request ? request.status : null;
  }
}
