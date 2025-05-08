import { moveAlongPath } from "@/core/movement";
import { TileCore } from "@/core/tile";
import { UnitCore } from "@/core/unit";
import { findPath } from "@/core/pathfinding";
import { AISystem } from "./ai-system";
import { dataManager } from "@/core/data/dataManager";

export class SettlingAI extends AISystem {
  citySpots: TileCore[] = [];

  plan() {
    this.operations = [];
    this.processCities();
    this.processSettlers();
    return this.operations;
  }

  private processCities() {
    const settler = dataManager.units.get("unit_settler")!;
    for (const city of this.player.citiesWithoutProduction) {
      if (Math.random() > 0.7 && city.production.canProduce(settler)) {
        const newCityLocation = this.findCityLocation(city.tile);
        if (newCityLocation) {
          this.operations.push({
            group: "city-produce",
            entityId: city.id,
            focus: "expansion",
            priority: 100,
            perform: () => {
              city.production.produce(settler);
            },
          });
          return;
        }
      }
    }
  }

  private processSettlers() {
    for (const unit of this.player.units) {
      if (unit.definition.actions.includes("foundCity")) {
        this.processSettler(unit);
      }
    }
  }

  private processSettler(unit: UnitCore) {
    this.operations.push({
      group: "unit",
      entityId: unit.id,
      focus: "expansion",
      priority: 100,
      perform: () => {
        const destination = unit.getPathDestination();
        if (!destination || destination.areaOf) {
          const bestCityLocation = this.findCityLocation(unit.tile);
          if (!bestCityLocation) {
            unit.order = "sleep";
            return;
          }

          if (unit.tile === bestCityLocation) {
            unit.doAction("foundCity");
          } else {
            unit.path = findPath(unit, bestCityLocation);
          }
        }

        if (unit.path) {
          moveAlongPath(unit);
        }
      },
    });
  }

  private findCityLocation(startTile: TileCore): TileCore | null {
    const tiles = startTile.getTilesInRange(5);

    let bestSweetSpotValue = 0;
    let bestTile: TileCore | null = null;
    for (const tile of tiles) {
      if (startTile.passableArea !== tile.passableArea) {
        continue;
      }

      if (tile.sweetSpotValue > bestSweetSpotValue) {
        bestSweetSpotValue = tile.sweetSpotValue;
        bestTile = tile;
      }
    }
    return bestTile;
  }
}
