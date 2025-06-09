import { PassableArea, TilesMapCore } from "./tiles-map";
import { PriorityQueue } from "./priority-queue";

type AreaConnection = {
  area: PassableArea;
  distance: number;
};

export class AreasGraph {
  private connections = new Map<number, AreaConnection[]>();

  constructor() {}

  /**
   * Builds the connections graph between passable areas.
   * Two areas are connected if any of their tiles are immediate neighbors.
   */
  buildFromTilesMap(tilesMap: TilesMapCore) {
    this.connections.clear();

    // Initialize connections for each area
    for (const area of tilesMap.passableAreas.values()) {
      this.connections.set(area.id, []);
    }

    // For each tile, check its neighbors to find area connections
    const processedPairs = new Set<string>();

    for (let x = 0; x < tilesMap.width; x++) {
      for (let y = 0; y < tilesMap.height; y++) {
        const tile = tilesMap.tiles[x][y];
        if (!tile.passableArea) continue;

        const fromArea = tile.passableArea;

        // Check all neighbors
        for (const neighbor of tile.neighbours) {
          if (!neighbor.passableArea) continue;
          if (neighbor.passableArea === fromArea) continue;

          const toArea = neighbor.passableArea;

          // Create a unique key for this area pair to avoid duplicate connections
          const pairKey = fromArea.id < toArea.id 
            ? `${fromArea.id}-${toArea.id}` 
            : `${toArea.id}-${fromArea.id}`;

          if (processedPairs.has(pairKey)) continue;
          processedPairs.add(pairKey);

          // Add bidirectional connection
          const fromConnections = this.connections.get(fromArea.id)!;
          const toConnections = this.connections.get(toArea.id)!;

          // Distance between areas is 1 since they're direct neighbors
          fromConnections.push({ area: toArea, distance: 1 });
          toConnections.push({ area: fromArea, distance: 1 });
        }
      }
    }
  }

  /**
   * Finds the shortest path between two areas using Dijkstra's algorithm.
   * Returns null if no path exists.
   * 
   * @param fromAreaId - The ID of the starting area
   * @param toAreaId - The ID of the destination area
   * @returns Array of area IDs representing the path, or null if no path exists
   */
  findPath(fromAreaId: number, toAreaId: number): number[] | null {
    if (fromAreaId === toAreaId) {
      return [fromAreaId];
    }

    const connections = this.connections;
    if (!connections.has(fromAreaId) || !connections.has(toAreaId)) {
      return null;
    }

    // Dijkstra's algorithm
    const distances = new Map<number, number>();
    const previous = new Map<number, number>();
    const visited = new Set<number>();
    const queue = new PriorityQueue<number>();

    // Initialize
    for (const areaId of connections.keys()) {
      distances.set(areaId, Infinity);
    }
    distances.set(fromAreaId, 0);
    queue.push(fromAreaId, 0);

    while (!queue.isEmpty) {
      const currentId = queue.pop()!;
      
      if (currentId === toAreaId) {
        // Reconstruct path
        const path: number[] = [];
        let current: number | undefined = toAreaId;
        
        while (current !== undefined) {
          path.unshift(current);
          current = previous.get(current);
        }
        
        return path;
      }

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const currentDistance = distances.get(currentId)!;
      const currentConnections = connections.get(currentId)!;

      for (const connection of currentConnections) {
        const neighborId = connection.area.id;
        if (visited.has(neighborId)) continue;

        const newDistance = currentDistance + connection.distance;
        const oldDistance = distances.get(neighborId)!;

        if (newDistance < oldDistance) {
          distances.set(neighborId, newDistance);
          previous.set(neighborId, currentId);
          queue.push(neighborId, newDistance);
        }
      }
    }

    return null; // No path found
  }

  /**
   * Gets all areas directly connected to the given area.
   */
  getConnectedAreas(areaId: number): PassableArea[] {
    const connections = this.connections.get(areaId);
    if (!connections) return [];
    
    return connections.map(conn => conn.area);
  }

  /**
   * Checks if two areas are directly connected (neighbors).
   */
  areDirectlyConnected(areaId1: number, areaId2: number): boolean {
    const connections = this.connections.get(areaId1);
    if (!connections) return false;
    
    return connections.some(conn => conn.area.id === areaId2);
  }

  /**
   * Gets the number of connections for a given area.
   */
  getConnectionCount(areaId: number): number {
    return this.connections.get(areaId)?.length ?? 0;
  }

  /**
   * Finds all areas within a certain distance from the given area.
   */
  findAreasWithinDistance(fromAreaId: number, maxDistance: number): number[] {
    const result: number[] = [];
    const distances = new Map<number, number>();
    const visited = new Set<number>();
    const queue = new PriorityQueue<number>();

    // Initialize
    distances.set(fromAreaId, 0);
    queue.push(fromAreaId, 0);

    while (!queue.isEmpty) {
      const currentId = queue.pop()!;
      
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const currentDistance = distances.get(currentId)!;
      if (currentDistance <= maxDistance) {
        result.push(currentId);
      }

      const currentConnections = this.connections.get(currentId);
      if (!currentConnections) continue;

      for (const connection of currentConnections) {
        const neighborId = connection.area.id;
        if (visited.has(neighborId)) continue;

        const newDistance = currentDistance + connection.distance;
        if (newDistance <= maxDistance) {
          const oldDistance = distances.get(neighborId) ?? Infinity;
          if (newDistance < oldDistance) {
            distances.set(neighborId, newDistance);
            queue.push(neighborId, newDistance);
          }
        }
      }
    }

    return result;
  }
}