import { TileCore } from "./tile";
import { UnitCore } from "./unit";
import { getMoveCost, getMoveResult, MoveResult } from "./movement";
import { PriorityQueue } from "./priority-queue";
import { getHexDistance } from "./hex-distance";

export function findPath(
  unit: UnitCore,
  end: TileCore,
  start?: TileCore,
): TileCore[][] | null {
  if (!start) {
    start = unit.tile;
  }

  if (start === end) {
    return null;
  }

  const moveResult = getMoveResult(unit, start, end);
  if (moveResult === MoveResult.none) {
    return null;
  }

  const visitedTiles = new Set<TileCore>();
  const tilesToVisit = new PriorityQueue<TileCore>();
  const cameFrom = new Map<TileCore, [number, number, TileCore | null]>();
  const costsSoFar = new Map<TileCore, number>();

  const turnCost = 1 / unit.definition.actionPoints;
  const startHeuristic = getHexDistance(start, end) * turnCost;
  tilesToVisit.push(start, startHeuristic);
  costsSoFar.set(start, 0);
  cameFrom.set(start, [0, unit.actionPointsLeft, null]);

  // Main pathfinding loop - optimized for minimal allocations
  while (!tilesToVisit.isEmpty) {
    const nextTile = tilesToVisit.pop()!;

    if (visitedTiles.has(nextTile)) {
      continue;
    }

    const cameFromData = cameFrom.get(nextTile)!;
    let turn = cameFromData[0];
    let actionPointsLeft = cameFromData[1];

    if (!actionPointsLeft) {
      actionPointsLeft = unit.definition.actionPoints;
      turn++;
    }

    visitedTiles.add(nextTile);

    if (nextTile === end) {
      return reconstructPath(cameFrom, end);
    }

    // Critical hot path optimizations
    const neighbours = nextTile.neighbours;
    const neighboursLength = neighbours.length;
    const nextTileCost = costsSoFar.get(nextTile)!;

    // Use for loop instead of for...of for better performance
    for (let i = 0; i < neighboursLength; i++) {
      const neighbour = neighbours[i];
      
      if (visitedTiles.has(neighbour)) {
        continue;
      }

      const moveResult = getMoveResult(unit, nextTile, neighbour);

      if (moveResult === MoveResult.none) {
        continue;
      }

      if (moveResult === MoveResult.attack && neighbour !== end) {
        continue;
      }

      let moveCost = getMoveCost(unit, moveResult, nextTile, neighbour);
      const newActionPointsLeft = Math.max(0, actionPointsLeft - moveCost);

      moveCost *= turnCost;

      if (!newActionPointsLeft) {
        moveCost = 1;
      }

      const costSoFar = nextTileCost + moveCost;
      const neighbourCost = costsSoFar.get(neighbour);

      if (neighbourCost === undefined || costSoFar < neighbourCost) {
        costsSoFar.set(neighbour, costSoFar);
        const heuristic = getHexDistance(neighbour, end) * turnCost;
        const fCost = costSoFar + heuristic;
        tilesToVisit.push(neighbour, fCost);
        cameFrom.set(neighbour, [turn, newActionPointsLeft, nextTile]);
      }
    }
  }

  return null;
}

function reconstructPath(
  cameFrom: Map<TileCore, [number, number, TileCore | null]>,
  target: TileCore,
): TileCore[][] {
  let lastTile = target;
  let lastTurn: number | null = null;

  let turnPath: TileCore[] = [target];
  const path: TileCore[][] = [turnPath];
  while (true) {
    const [turn, _, tile] = cameFrom.get(lastTile)!;
    if (!tile || !cameFrom.has(tile)) {
      return path;
    }
    if (turn !== lastTurn) {
      lastTurn = turn;
      turnPath = [];
      path.unshift(turnPath);
    }
    turnPath.unshift(tile!);
    lastTile = tile!;
  }
}
