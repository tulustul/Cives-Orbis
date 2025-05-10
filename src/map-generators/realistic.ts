import { Climate, LandForm, SeaLevel, TileDirection } from "@/shared";
import { TilesMapCore } from "@/core/tiles-map";
import alea from "alea";
import { createNoise2D, NoiseFunction2D } from "simplex-noise";
import { randomNormal } from "@/core/random";
import { ResourceDeposit } from "@/core/resources";
import { TileCore } from "@/core/tile";
import { getTileInDirection } from "@/core/hex-math";
import { MapGenerator } from "./types";
import {
  findCoastline,
  placeRiverBetweenTiles,
  POSSIBLE_BORDER_PATHS,
} from "./utils";
import { dataManager } from "@/core/data/dataManager";
import {
  areWetlandsPossible,
  isForestable,
  isResourcePossible,
} from "@/core/tile-utils";

interface TileMetadata {
  height: number;
  humidity: number;
  temperature: number;
  distanceToCoast: number;
}

export class RealisticMapGenerator implements MapGenerator {
  private map!: TilesMapCore;

  private width!: number;

  private height!: number;

  private seed: string | undefined;

  private uniformity!: number;

  private seaLevel!: number;

  private resources!: number;

  private startingLocations: TileCore[] = [];

  private metadata = new Map<TileCore, TileMetadata>();

  constructor(private startingLocationsCount: number) {}

  getStartingLocations() {
    return this.startingLocations;
  }

  generate(
    width: number,
    height: number,
    seed: string | undefined = undefined,
    uniformity: number = 0.5,
    seaLevel = 0,
    resources = 0.2,
  ) {
    this.map = new TilesMapCore(width, height);
    this.width = width;
    this.height = height;
    this.seed = seed;
    this.uniformity = uniformity;
    this.seaLevel = seaLevel;
    this.resources = resources;

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const metadata: TileMetadata = {
          height: 0,
          humidity: 0,
          temperature: 0,
          distanceToCoast: 0,
        };
        this.metadata.set(this.map.tiles[x][y], metadata);
      }
    }

    this.generateHeightmap();

    this.generateMountainRanges();

    this.generateTemperature();

    this.generateHumidity();

    this.assignTiles();

    this.fixShallowWater();

    this.adjustHeightmap();

    this.placeRivers();

    this.placeWetlands();

    this.placeResources();

    this.findStartingPositions();

    return this.map;
  }

  private generateHeightmap() {
    const size = Math.max(this.width, this.height);
    const noiseLayersCount = Math.floor(Math.pow(size, 0.4));

    const noiseScales: number[][] = [];
    for (let i = 0; i < noiseLayersCount; i++) {
      noiseScales.push([Math.pow(0.6, i + 4), 1 + this.uniformity * i]);
    }
    const maxValue = noiseScales.reduce(
      (total, scaleAndIntensity) => total + scaleAndIntensity[1],
      0,
    );
    const seaLevel = maxValue * this.seaLevel;

    const coastlineNoise = new ComplexNoise(noiseScales, this.seed);

    const heightmapNoise = new ComplexNoise(
      [
        [0.015, 0.2],
        [0.06, 0.4],
        [0.4, 1],
      ],
      this.seed,
    );

    for (const [tile, value, _] of this.getNoisedTiles(coastlineNoise)) {
      let height = 0;

      // Adjust horizontal map edges to be more likely sea.
      // const distanceToEdge = Math.min(tile.x, this.width - tile.x);
      // const edgeThrehold = this.width * 0.1;
      // if (distanceToEdge < edgeThrehold) {
      //   value -=
      //     (maxValue / 2) *
      //     Math.cos((Math.PI / 2 / edgeThrehold) * distanceToEdge);
      // }

      if (value > seaLevel) {
        // height = value;
        tile.seaLevel = SeaLevel.none;
        height = heightmapNoise.at(tile.x, tile.y) / 2;
      }

      this.metadata.get(tile)!.height = height;
    }
  }

  private generateTemperature() {
    // First pass: Generate base temperature based on latitude (longitude in our implementation)
    for (const [tile, value, longitude] of this.getNoisedTiles(
      new ComplexNoise(
        [
          [0.012, 1],
          [0.07, 1],
        ],
        this.seed,
      ),
    )) {
      const base = (1 - longitude) / 2;
      const noise = ((value + 1) / 2) * (1 - longitude);
      const metadata = this.metadata.get(tile)!;

      // Initialize base temperature
      metadata.temperature = Math.max(base, Math.min(1, base + noise));

      // Water has a moderating effect on temperature
      if (tile.seaLevel !== SeaLevel.none) {
        // Water warms cold areas and cools warm areas
        if (metadata.temperature < 0.4) {
          metadata.temperature = Math.min(0.4, metadata.temperature + 0.1);
        } else if (metadata.temperature > 0.7) {
          metadata.temperature = Math.max(0.7, metadata.temperature - 0.1);
        }
      }

      // Elevation affects temperature
      if (tile.landForm === LandForm.mountains) {
        // Mountains are significantly colder
        metadata.temperature -= 0.2;
      } else if (tile.landForm === LandForm.hills) {
        // Hills are slightly colder
        metadata.temperature -= 0.1;
      }

      // Clamp temperature to valid range
      metadata.temperature = Math.max(0, Math.min(1, metadata.temperature));
    }

    // Second pass: Add influence from nearby water bodies for coastal moderation
    const temperatureSnapshot = new Map<TileCore, number>();

    // Create a snapshot of current temperatures
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const tile = this.map.tiles[x][y];
        const metadata = this.metadata.get(tile)!;
        temperatureSnapshot.set(tile, metadata.temperature);
      }
    }

    // Apply coastal temperature moderation
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const tile = this.map.tiles[x][y];
        if (tile.seaLevel !== SeaLevel.none) continue; // Skip water tiles

        const metadata = this.metadata.get(tile)!;

        // Only apply coastal effects to land tiles near water
        if (metadata.distanceToCoast <= 3) {
          let waterNeighbors = 0;
          let averageWaterTemp = 0;

          // Look for water tiles in the vicinity
          for (const neighbor of tile.neighbours) {
            if (neighbor.seaLevel !== SeaLevel.none) {
              waterNeighbors++;
              averageWaterTemp += temperatureSnapshot.get(neighbor)!;
            }
          }

          // If there are water tiles nearby, moderate the temperature
          if (waterNeighbors > 0) {
            averageWaterTemp /= waterNeighbors;

            // Moderate temperature based on distance to coast
            const moderationStrength = 0.5 / (metadata.distanceToCoast + 1);
            metadata.temperature =
              metadata.temperature * (1 - moderationStrength) +
              averageWaterTemp * moderationStrength;
          }
        }
      }
    }
  }

  private generateHumidity() {
    // First pass: Initialize humidity
    for (const [tile, value, longitude] of this.getNoisedTiles(
      new ComplexNoise(
        [
          [0.025, 1],
          [0.2, 1],
        ],
        this.seed,
      ),
    )) {
      const x = longitude * 10;
      const base = x < Math.PI * 1.5 ? (Math.cos(x) + 1) / 2 - 0.5 : 0;
      const noise = (value + 1) / 2;
      const metadata = this.metadata.get(tile)!;
      // Initialize with base humidity
      metadata.humidity = Math.max(0, Math.min(1, base * 0.4 + noise));

      // Water bodies have maximum humidity
      if (tile.seaLevel !== SeaLevel.none) {
        metadata.humidity = 1.0;
      }
    }

    // Second pass: Simulate humidity transport from water to land
    // We'll do multiple passes to simulate wind carrying moisture inland
    const windStrength = 1 - 15 / this.width; // How much humidity is retained when moving one tile
    const windPasses = 4; // Number of simulation passes

    for (let pass = 0; pass < windPasses; pass++) {
      // Create a copy of the current humidity values to avoid affecting the simulation within one pass
      const humiditySnapshot = new Map<TileCore, number>();

      for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
          const tile = this.map.tiles[x][y];
          const metadata = this.metadata.get(tile)!;
          humiditySnapshot.set(tile, metadata.humidity);
        }
      }

      // Apply wind effects - predominant wind direction is from sea to land
      for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
          const tile = this.map.tiles[x][y];
          if (tile.seaLevel !== SeaLevel.none) {
            continue;
          } // Skip water tiles

          const metadata = this.metadata.get(tile)!;
          let newHumidity = humiditySnapshot.get(tile)!;

          // Check neighbors for humidity contribution
          let contributingNeighbors = 0;
          let humidityContribution = 0;

          for (const neighbor of tile.neighbours) {
            const neighborHumidity = humiditySnapshot.get(neighbor)!;

            // Water bodies and tiles with higher humidity contribute moisture
            if (neighborHumidity > newHumidity) {
              contributingNeighbors++;

              // Calculate how much humidity this neighbor contributes
              let contribution =
                (neighborHumidity - newHumidity) * windStrength;

              // Mountains and hills block humidity transfer
              if (tile.landForm === LandForm.mountains) {
                // Mountains block most moisture
                contribution = 0;
              } else if (tile.landForm === LandForm.hills) {
                // Hills block some moisture
                contribution *= 0.2;
              }

              humidityContribution += contribution;
            }
          }

          if (contributingNeighbors > 0) {
            // Average the contribution and add to current humidity
            newHumidity += humidityContribution / contributingNeighbors;

            // Land consumes some moisture based on climate and features
            const consumptionRate = 0.05; // Base consumption

            // Apply consumption
            newHumidity = Math.max(
              0,
              Math.min(1, newHumidity * (1 - consumptionRate)),
            );

            metadata.humidity = newHumidity;
          }
        }
      }
    }

    // Final pass: Mountains create rain shadows (dry areas) on their lee side
    // This would depend on prevailing wind direction, which we're assuming is
    // from sea to land in our simplified model
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const tile = this.map.tiles[x][y];
        const metadata = this.metadata.get(tile)!;

        // Check for mountains blocking moisture
        if (tile.landForm === LandForm.mountains) {
          // Find tiles in the "shadow" of this mountain (1-2 tiles beyond)
          for (const neighbor of tile.neighbours) {
            if (neighbor.seaLevel === SeaLevel.none) {
              const neighborMetadata = this.metadata.get(neighbor)!;

              // If this is land, create a rain shadow effect
              // Reduce humidity in the shadow of the mountain
              if (neighborMetadata.distanceToCoast > metadata.distanceToCoast) {
                neighborMetadata.humidity *= 0.6; // Significant reduction

                // The effect continues beyond, but weakens
                for (const secondNeighbor of neighbor.neighbours) {
                  if (secondNeighbor.seaLevel === SeaLevel.none) {
                    const secondMetadata = this.metadata.get(secondNeighbor)!;
                    if (
                      secondMetadata.distanceToCoast >
                      neighborMetadata.distanceToCoast
                    ) {
                      secondMetadata.humidity *= 0.75; // Weaker reduction
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  private assignTiles() {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const tile = this.map.tiles[x][y];
        const metadata = this.metadata.get(tile)!;
        if (metadata.height > 1) {
          tile.landForm = LandForm.mountains;
        } else if (metadata.height > 0.25) {
          tile.landForm = LandForm.hills;
        }

        // Skip climate assignment for water tiles
        if (tile.seaLevel !== SeaLevel.none) {
          continue;
        }

        // Temperature-based climates first (cold regions)
        if (metadata.temperature < 0.2) {
          if (metadata.temperature < 0.07) {
            tile.climate = Climate.arctic;
          } else {
            tile.climate = Climate.tundra;
          }
          continue;
        }

        // For the remaining regions, use both temperature and humidity
        // to determine the climate

        // Very dry areas are deserts regardless of temperature
        if (metadata.humidity < 0.45) {
          tile.climate = Climate.desert;
          continue;
        }

        // Moderately dry areas are savanna
        if (metadata.humidity < 0.55) {
          tile.climate = Climate.savanna;
          continue;
        }

        // Temperature and humidity combined effects
        if (metadata.temperature < 0.5) {
          // Cooler temperatures with moderate to high humidity = temperate
          tile.climate = Climate.temperate;
        } else {
          // Hot temperatures with high humidity = tropical
          if (metadata.humidity > 0.8) {
            tile.climate = Climate.tropical;
          } else {
            // Hot but only moderately humid
            tile.climate = Climate.savanna;
          }
        }

        // Create extreme desert areas in rain shadows of mountains
        // Already handled by the humidity generation, but we can enhance it here
        if (metadata.humidity < 0.15 && metadata.temperature > 0.4) {
          tile.climate = Climate.desert;
        }
      }
    }

    for (const [tile, value, _] of this.getNoisedTiles(
      new ComplexNoise(
        [
          [0.015, 1],
          [0.06, 1],
          [0.3, 1],
        ],
        this.seed,
      ),
    )) {
      const bonus = tile.climate === Climate.tropical ? 0.3 : 0;
      if (value + bonus > -0.2 && isForestable(tile)) {
        tile.forest = true;
      }
    }
  }

  private generateMountainRanges() {
    // Create mountain ranges using noise with directional bias
    const mountainNoise = new ComplexNoise(
      [
        [0.01, 1.5], // Large scale mountain chains
        [0.06, 0.8], // Medium scale variations
        [0.15, 0.5], // Small scale details - increased for more variation
      ],
      this.seed + "_mountains",
    );

    // Secondary noise for branch formations
    const branchNoise = new ComplexNoise(
      [
        [0.08, 1.0],
        [0.2, 0.6],
      ],
      this.seed + "_branches",
    );

    // Generate ridgeline paths for mountain ranges
    const ridgeCount = Math.floor(Math.max(this.width, this.height) / 3.5);
    const ridgeStartPoints: [number, number][] = [];

    // Generate starting points for ridges
    for (let i = 0; i < ridgeCount; i++) {
      ridgeStartPoints.push([
        Math.floor(Math.random() * this.width),
        Math.floor(Math.random() * this.height),
      ]);
    }

    // For each ridge starting point, create a mountain range
    for (const [startX, startY] of ridgeStartPoints) {
      if (this.map.tiles[startX][startY].seaLevel !== SeaLevel.none) {
        continue; // Skip if starting in water
      }

      // Choose a random angle for the ridge direction
      const angle = Math.random() * Math.PI * 2;
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);

      // Ridge length based on map size - longer but thinner ridges
      const ridgeLength =
        Math.floor((Math.random() * Math.min(this.width, this.height)) / 2) + 7;

      // Create the ridge
      let curX = startX;
      let curY = startY;

      for (let step = 0; step < ridgeLength; step++) {
        // Significantly more direction noise for less straight lines
        const noiseAngle =
          (mountainNoise.at(curX / this.width, curY / this.height) * Math.PI) /
            2 +
          Math.sin(step * 0.4) * 0.7;

        // Apply the angle change with more variation
        const adjustedDirX =
          dirX * Math.cos(noiseAngle) - dirY * Math.sin(noiseAngle);
        const adjustedDirY =
          dirX * Math.sin(noiseAngle) + dirY * Math.cos(noiseAngle);

        // Move along the ridge with smaller steps for more granularity
        curX += adjustedDirX * 1.0;
        curY += adjustedDirY * 1.0;

        const tileX = Math.floor(curX);
        const tileY = Math.floor(curY);

        // Check bounds
        if (
          tileX < 0 ||
          tileX >= this.width ||
          tileY < 0 ||
          tileY >= this.height
        ) {
          break;
        }

        const tile = this.map.tiles[tileX][tileY];
        if (tile.seaLevel !== SeaLevel.none) {
          continue; // Skip water tiles
        }

        // Increase height along the ridge
        const metadata = this.metadata.get(tile)!;
        const heightIncrease =
          2.0 * (1 - step / ridgeLength) * (0.7 + 0.3 * Math.random());
        metadata.height += heightIncrease;

        // Sharper falloff for thinner ranges
        for (const neighbor of tile.neighbours) {
          if (neighbor.seaLevel === SeaLevel.none) {
            const neighborMetadata = this.metadata.get(neighbor)!;
            neighborMetadata.height += heightIncrease * 0.1;
          }
        }

        // Occasionally create branches (thinner offshoots)
        if (step > 3 && Math.random() < 0.2) {
          this.createMountainBranch(
            tileX,
            tileY,
            angle + ((Math.random() * 2 - 1) * Math.PI) / 2,
            Math.floor(ridgeLength / 3) + 2,
            heightIncrease * 0.7,
            branchNoise,
          );
        }
      }
    }
  }

  private createMountainBranch(
    startX: number,
    startY: number,
    direction: number,
    length: number,
    startHeight: number,
    noise: ComplexNoise,
  ) {
    const dirX = Math.cos(direction);
    const dirY = Math.sin(direction);

    let curX = startX;
    let curY = startY;

    for (let step = 0; step < length; step++) {
      // Even more noise for branches to make them irregular
      const noiseAngle =
        noise.at(curX / this.width, curY / this.height) * Math.PI * 0.7;

      // Apply directional changes
      const adjustedDirX =
        dirX * Math.cos(noiseAngle) - dirY * Math.sin(noiseAngle);
      const adjustedDirY =
        dirX * Math.sin(noiseAngle) + dirY * Math.cos(noiseAngle);

      // Move in smaller increments
      curX += adjustedDirX * 0.8;
      curY += adjustedDirY * 0.8;

      const tileX = Math.floor(curX);
      const tileY = Math.floor(curY);

      // Check bounds
      if (
        tileX < 0 ||
        tileX >= this.width ||
        tileY < 0 ||
        tileY >= this.height
      ) {
        break;
      }

      const tile = this.map.tiles[tileX][tileY];
      if (tile.seaLevel !== SeaLevel.none) {
        continue;
      }

      // Add height, tapering quickly for thin branches
      const metadata = this.metadata.get(tile)!;
      const heightIncrease = startHeight * Math.pow(0.8, step);
      metadata.height += heightIncrease;

      // Very sharp falloff for thin branches
      for (const neighbor of tile.neighbours) {
        if (neighbor.seaLevel === SeaLevel.none) {
          const neighborMetadata = this.metadata.get(neighbor)!;
          neighborMetadata.height += heightIncrease * 0.35;
        }
      }
    }
  }

  private *getNoisedTiles(
    noise: ComplexNoise,
  ): Iterable<[TileCore, number, number]> {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const noiseValue = noise.at(x, y);
        const halfHeight = Math.floor(this.height / 2);
        const longitude = Math.abs((y - halfHeight) / halfHeight);
        yield [this.map.tiles[x][y], noiseValue, longitude];
      }
    }
  }

  private fixShallowWater() {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const tile = this.map.tiles[x][y];
        if (tile.seaLevel === SeaLevel.none) {
          for (const neighbour of tile.neighbours) {
            if (neighbour.seaLevel === SeaLevel.deep) {
              neighbour.seaLevel = SeaLevel.shallow;
            }
          }
        }
      }
    }
  }

  private adjustHeightmap() {
    // Make heighmap suitable for rivers placement - the deeper into land the higher.
    let currentTiles = findCoastline(this.map.tiles);
    const nextTiles = new Set<TileCore>();
    const visitedTiles = new Set<TileCore>(currentTiles);
    let distance = 0;
    while (currentTiles.length) {
      distance++;
      for (const tile of currentTiles) {
        for (const neighbour of tile.neighbours) {
          if (
            neighbour.seaLevel === SeaLevel.none &&
            !visitedTiles.has(neighbour)
          ) {
            visitedTiles.add(neighbour);
            nextTiles.add(neighbour);
            const metadata = this.metadata.get(neighbour)!;
            metadata.height += distance * 0.7;
            metadata.distanceToCoast = distance;
          }
        }
      }
      currentTiles = Array.from(nextTiles);
      nextTiles.clear();
    }
  }

  private placeRivers() {
    const riversSources: TileCore[] = [];
    for (const [tile, metadata] of this.metadata.entries()) {
      if (tile.landForm === LandForm.plains) {
        continue;
      }
      let chance = 0.08;
      if (tile.landForm === LandForm.mountains) {
        chance = 0.3;
      }
      if (
        Math.random() >
        1 - chance / metadata.distanceToCoast ** 0.2 - metadata.humidity / 50
      ) {
        riversSources.push(tile);
      }
    }

    for (const tile of riversSources) {
      if (tile.riverParts.length) {
        continue;
      }

      let ok = true;
      for (const neighbour of tile.neighbours) {
        if (neighbour.seaLevel !== SeaLevel.none) {
          ok = false;
        }
      }

      if (ok) {
        this.buildRiverPath(tile, Math.round(Math.random() * 5));
      }
    }
  }

  private buildRiverPath(tile: TileCore, direction: TileDirection) {
    if (direction === TileDirection.NONE) {
      return;
    }

    const possibleNeighboursDirections = POSSIBLE_BORDER_PATHS[direction];

    const pairs = possibleNeighboursDirections
      .map((pair) => {
        return pair.map((dir) => {
          if (dir === TileDirection.NONE) {
            return tile;
          }
          return getTileInDirection(this.map.tiles, tile, dir);
        });
      })
      .filter(
        (pair) =>
          pair[0] &&
          pair[1] &&
          pair[0].seaLevel === SeaLevel.none &&
          pair[1].seaLevel === SeaLevel.none &&
          pair[0].riverParts.length < 4 && // small loops prevention, big loops are still an issue
          pair[1].riverParts.length < 4,
      ) as [TileCore, TileCore][];

    if (pairs.length === 0) {
      return;
    }

    let pairToPlace: [TileCore, TileCore];

    if (pairs.length === 1) {
      pairToPlace = pairs[0];
    } else {
      const [pairA, pairB] = pairs;

      const heightA =
        (this.metadata.get(pairA[0])!.height +
          this.metadata.get(pairA[1])!.height) /
        2;
      const heightB =
        (this.metadata.get(pairB[0])!.height +
          this.metadata.get(pairB[1])!.height) /
        2;

      pairToPlace = heightA < heightB ? pairA : pairB;
    }

    if (placeRiverBetweenTiles(...pairToPlace)) {
      this.buildRiverPath(
        pairToPlace[0],
        pairToPlace[0].getDirectionTo(pairToPlace[1]),
      );
    }
  }

  placeWetlands() {
    for (const [tile, value, _] of this.getNoisedTiles(
      new ComplexNoise(
        [
          [0.021, 1],
          [0.08, 1],
          [0.2, 1],
        ],
        this.seed,
      ),
    )) {
      if (value > 0 && areWetlandsPossible(tile)) {
        tile.wetlands = true;
      }
    }
  }

  private findStartingPositions() {
    const margin = 6;
    const maxTries = 10000;
    let tries = 0;
    while (
      tries < maxTries &&
      this.startingLocations.length < this.startingLocationsCount
    ) {
      const x = margin + Math.floor(Math.random() * (this.width - margin * 2));
      const y = margin + Math.floor(Math.random() * (this.height - margin * 2));
      const tile = this.map.tiles[x][y];
      if (
        tile.seaLevel === SeaLevel.none &&
        tile.landForm !== LandForm.mountains &&
        !this.startingLocations.includes(tile)
      ) {
        this.startingLocations.push(tile);
      }
      tries++;
    }
  }

  placeResources() {
    const resources = dataManager.resources.all;

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (Math.random() > this.resources) {
          continue;
        }

        // TODO take more distributions settings into account
        const resourceIndex = Math.floor(Math.random() * resources.length);
        const resourceDef = resources[resourceIndex];
        const tile = this.map.tiles[x][y];

        if (isResourcePossible(tile, resourceDef)) {
          const dis = resourceDef.depositDef!.distribution!;
          const quantity = randomNormal(dis.quantityMedian, dis.quantityStddev);
          tile.resource = ResourceDeposit.from({
            def: resourceDef,
            tile,
            quantity,
            difficulty: 0,
          });
        }
      }
    }
  }
}

class ComplexNoise {
  private noises: NoiseFunction2D[];

  constructor(private scales: number[][], seed: string | undefined) {
    const random = seed ? alea(seed) : Math.random;
    this.noises = scales.map(() => createNoise2D(random));
  }

  at(x: number, y: number) {
    let noiseValue = 0;
    for (let i = 0; i < this.noises.length; i++) {
      const [scale, intensity] = this.scales[i];
      noiseValue += this.noises[i](x * scale, y * scale) * intensity;
    }
    return noiseValue;
  }
}
