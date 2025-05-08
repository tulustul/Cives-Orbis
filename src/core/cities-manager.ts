import { LandForm, SeaLevel } from "../shared";
import { CityCore } from "./city";
import { collector } from "./collector";
import { dataManager } from "./data/dataManager";
import { Game } from "./game";
import { PlayerCore } from "./player";
import { TileCore } from "./tile";
import { TileRoad } from "./tile-improvements";

export class CitiesManager {
  cities: CityCore[] = [];

  citiesMap = new Map<number, CityCore>();

  lastId = 0;

  constructor(private game: Game) {}

  spawn(tile: TileCore, player: PlayerCore, isNew = true) {
    if (tile.city) {
      return null;
    }

    if (
      tile.landForm === LandForm.mountains ||
      tile.seaLevel !== SeaLevel.none
    ) {
      return null;
    }

    const city = new CityCore(tile, player);
    city.id = this.lastId++;
    city.population.population.set("peasant", 1);
    city.population.computeTotal();
    city.name = this.getNextCityName(player);
    city.tile = tile;
    city.isCoastline = !!city.tile.neighbours.find(
      (n) => n.seaLevel !== SeaLevel.none,
    );
    this.cities.push(city);
    this.citiesMap.set(city.id, city);

    for (const neighbour of tile.neighbours) {
      city.expansion.addTile(neighbour);
    }

    if (player.cities.length === 0) {
      city.production.addBuilding(dataManager.buildings.get("building_palace"));
    }
    player.addCity(city);

    tile.city = city;
    tile.forest = false;
    tile.wetlands = false;
    tile.road = TileRoad.road;
    tile.updateWithNeighbours();

    for (const t of tile.getTilesInRange(3)) {
      t.sweetSpotValue = 0;
    }

    if (isNew) {
      city.workers.optimizeYields();
    }

    player.updateCitiesWithoutProduction();

    city.suppliesProducers.add();

    if (this.game.trackedPlayer.exploredTiles.has(city.tile)) {
      collector.cities.add(city);
    }

    return city;
  }

  destroy(city: CityCore) {
    city.suppliesProducers.forget();

    // TODO rewrite to sets for better performance?
    let index = this.cities.indexOf(city);
    if (index !== -1) {
      this.cities.splice(index, 1);
    }

    this.citiesMap.delete(city.id);

    index = city.player.cities.indexOf(city);
    if (index !== -1) {
      city.player.cities.splice(index, 1);
    }

    city.tile.city = null;

    for (const tile of city.expansion.tiles) {
      city.expansion.removeTile(tile);
    }

    collector.citiesDestroyed.add(city.id);
  }

  nextTurn() {
    for (const city of this.cities) {
      city.nextTurn();
    }
  }

  updateProductsLists() {
    for (const city of this.cities) {
      city.production.updateProductsList();
    }
  }

  getNextCityName(player: PlayerCore, prefix = "", iter = 0): string {
    const existingNames = new Set(this.cities.map((c) => c.name));
    for (const name of player.nation.cityNames) {
      const _name = `${prefix}${name}${iter >= 2 ? " " + iter : ""}`;
      if (!existingNames.has(_name)) {
        return _name;
      }
    }

    return this.getNextCityName(player, "New ", iter + 1);
  }
}
