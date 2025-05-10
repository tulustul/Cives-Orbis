import { TileCore } from "@/core/tile";
import { TilesMapCore } from "@/core/tiles-map";
import { LandForm, SeaLevel } from "@/shared";

const MIN_WORLD_EDGE_DISTANCE = 4;

// Only this fraction of the best candidates will be used to generate starting locations
const BEST_CANDIDATES_THRESHOLD = 0.1;

export function generateStartingLocations(
  map: TilesMapCore,
  numLocations: number,
): TileCore[] {
  map.precompute();

  const startingLocations: TileCore[] = [];
  const allCandidateLocations = new Set<TileCore>();

  const mapArea = map.width * map.height;
  const minLandArea = Math.floor(mapArea * 0.02);

  for (const tile of map.tilesMap.values()) {
    if (
      !tile.passableArea ||
      tile.passableArea.area < minLandArea ||
      tile.sweetSpotValue < 5 ||
      tile.seaLevel !== SeaLevel.none ||
      tile.landForm === LandForm.mountains ||
      tile.x < MIN_WORLD_EDGE_DISTANCE ||
      tile.x > map.width - MIN_WORLD_EDGE_DISTANCE ||
      tile.y < MIN_WORLD_EDGE_DISTANCE ||
      tile.y > map.height - MIN_WORLD_EDGE_DISTANCE
    ) {
      continue;
    }

    allCandidateLocations.add(tile);
  }

  const minLocationDistance = Math.max(4, Math.ceil(mapArea ** 0.3) - 3);

  while (
    allCandidateLocations.size > 0 &&
    startingLocations.length < numLocations
  ) {
    const candidates = getCandidates(allCandidateLocations);
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const tile = candidates[randomIndex];

    enhanceLocation(tile);
    startingLocations.push(tile);

    const neightbours = tile.getTilesInRange(minLocationDistance);
    for (const neighbour of neightbours) {
      allCandidateLocations.delete(neighbour);
    }
  }

  return startingLocations;
}

function getCandidates(allCandidates: Set<TileCore>): TileCore[] {
  const candidates: TileCore[] = Array.from(allCandidates);
  candidates.sort((a, b) => {
    return a.sweetSpotValue > b.sweetSpotValue ? -1 : 1;
  });

  return candidates.slice(
    0,
    Math.ceil(candidates.length * BEST_CANDIDATES_THRESHOLD),
  );
}

function enhanceLocation(tile: TileCore) {
  // TODO
}
