import { TileCore } from "./tile";
import { UnitCore } from "./unit";
import { getMoveCost, getMoveResult, MoveResult } from "./movement";

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
  const tilesToVisit = new Map<TileCore, number>();
  const cameFrom = new Map<TileCore, [number, number, TileCore | null]>();
  const costsSoFar = new Map<TileCore, number>();

  const turnCost = 1 / unit.definition.actionPoints;
  tilesToVisit.set(start, 0);
  costsSoFar.set(start, 0);
  cameFrom.set(start, [0, unit.actionPointsLeft, null]);

  while (tilesToVisit.size) {
    let nextTile!: TileCore;
    let minEstimatedCost = Infinity;

    for (const [tile, estimatedCost] of tilesToVisit.entries()) {
      if (estimatedCost < minEstimatedCost) {
        minEstimatedCost = estimatedCost;
        nextTile = tile;
      }
    }

    let [turn, actionPointsLeft] = cameFrom.get(nextTile)!;

    if (!actionPointsLeft) {
      actionPointsLeft = unit.definition.actionPoints;
      turn++;
    }

    visitedTiles.add(nextTile);
    tilesToVisit.delete(nextTile);

    if (nextTile === end) {
      return reconstructPath(cameFrom, end);
    }

    for (const neighbour of nextTile.neighbours) {
      if (!visitedTiles.has(neighbour)) {
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
          moveCost = 1; // ??
        }

        const costSoFar = costsSoFar.get(nextTile)! + moveCost;

        if (
          !costsSoFar.has(neighbour) ||
          costSoFar < costsSoFar.get(neighbour)!
        ) {
          costsSoFar.set(neighbour, costSoFar);
          tilesToVisit.set(
            neighbour,
            costSoFar + getEuclideanDistance(neighbour, end) * turnCost,
          );
          cameFrom.set(neighbour, [turn, newActionPointsLeft, nextTile]);
        }
      }
    }
  }

  return null;
}

function getEuclideanDistance(start: TileCore, end: TileCore) {
  return Math.sqrt(
    (start.x - end.x) * (start.x - end.x) +
      (start.y - end.y) * (start.y - end.y),
  );
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
