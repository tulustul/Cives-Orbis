import { Tile } from './tile.interface';
import { Unit } from './unit';

export function findPath(unit: Unit, start: Tile, end: Tile): Tile[][] | null {
  const visitedTiles = new Set<Tile>();
  const tilesToVisit = new Map<Tile, number>();
  const cameFrom = new Map<Tile, [number, number, Tile | null]>();
  const costsSoFar = new Map<Tile, number>();

  const turnCost = 1 / unit.definition.actionPoints;
  tilesToVisit.set(start, 0);
  costsSoFar.set(start, 0);
  cameFrom.set(start, [0, unit.definition.actionPoints, null]);

  while (tilesToVisit.size) {
    let nextTile!: Tile;
    let minEstimatedCost = Infinity;

    for (const [tile, estimatedCost] of tilesToVisit.entries()) {
      if (estimatedCost < minEstimatedCost) {
        minEstimatedCost = estimatedCost;
        nextTile = tile;
      }
    }

    let [turn, actionPointsLeft, ..._] = cameFrom.get(nextTile)!;

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
        let moveCost = nextTile.neighboursCosts.get(neighbour)!;
        if (moveCost === Infinity) {
          continue;
        }

        let newActionPointsLeft = Math.max(0, actionPointsLeft - moveCost);

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
            costSoFar + getEuclideanDistance(neighbour, end) * turnCost
          );
          cameFrom.set(neighbour, [turn, newActionPointsLeft, nextTile]);
        }
      }
    }
  }

  return null;
}

function getEuclideanDistance(start: Tile, end: Tile) {
  return Math.sqrt(
    (start.x - end.x) * (start.x - end.x) +
      (start.y - end.y) * (start.y - end.y)
  );
}

function reconstructPath(
  cameFrom: Map<Tile, [number, number, Tile | null]>,
  target: Tile
): Tile[][] {
  let lastTile = target;
  let lastTurn: number | null = null;

  let turnPath: Tile[] = [target];
  const path: Tile[][] = [turnPath];
  while (cameFrom.has(lastTile)) {
    const [turn, _, tile] = cameFrom.get(lastTile)!;
    if (turn !== lastTurn) {
      lastTurn = turn;
      turnPath = [];
      path.unshift(turnPath);
    }
    if (tile) {
      turnPath.unshift(tile!);
    }
    lastTile = tile!;
  }
  return path;
}
