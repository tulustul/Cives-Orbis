import { TileCore } from "./tile";

export function getHexDistance(start: TileCore, end: TileCore): number {
  // Convert offset coordinates to axial coordinates for hex distance calculation
  // This assumes odd-row offset coordinates (odd rows are shifted right)
  const startQ = start.x - Math.floor((start.y + (start.y % 2)) / 2);
  const startR = start.y;

  const endQ = end.x - Math.floor((end.y + (end.y % 2)) / 2);
  const endR = end.y;

  // Calculate distance using axial coordinates
  const dq = endQ - startQ;
  const dr = endR - startR;

  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
}

export function getHexDistanceManhattan(
  start: TileCore,
  end: TileCore,
): number {
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);

  // For hex grids, Manhattan distance approximation
  return dx + Math.max(0, (dy - dx) / 2);
}

export function getEuclideanDistance(start: TileCore, end: TileCore): number {
  return Math.sqrt(
    (start.x - end.x) * (start.x - end.x) +
      (start.y - end.y) * (start.y - end.y),
  );
}
