import { TileCore } from "./tile";
import { UnitCore } from "./unit";
import { Game } from "./game";
import { CityCore } from "./city";
import { AIPlayer } from "../ai/ai-player";
import {
  EMPTY_YIELDS,
  zeroYields,
  addYields,
  subtractYields,
  copyYields,
} from "./yields";
import { collector } from "./collector";
import { PlayerYields } from "../shared";
import { InternalPolitics } from "./internal-politics";
import { AreaCore } from "./area";
import { PassableArea } from "./tiles-map";
import { Knowledge } from "./knowledge";
import { ResourceDeposit } from "./resources";
import { Nation } from "./data.interface";

export type PlayerViewBoundingBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export class PlayerCore {
  id!: number;

  exploredTiles = new Set<TileCore>();

  visibleTiles = new Set<TileCore>();

  knownPassableAreas = new Set<PassableArea>();

  units: UnitCore[] = [];

  cities: CityCore[] = [];

  citiesWithoutProduction: CityCore[] = [];

  unitsWithoutOrders: UnitCore[] = [];

  yields: PlayerYields = {
    costs: { ...EMPTY_YIELDS },
    income: { ...EMPTY_YIELDS },
    total: { ...EMPTY_YIELDS },
    perTurn: { ...EMPTY_YIELDS },
  };

  area: AreaCore;

  ai: AIPlayer | null = null;

  internalPolitics = new InternalPolitics();

  knowledge = new Knowledge(this);

  suppliedTiles = new Set<TileCore>();
  potentialSuppliedTiles = new Set<TileCore>();

  discoveredResourceDeposits = new Set<ResourceDeposit>();

  viewBoundingBox: PlayerViewBoundingBox = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };

  constructor(public game: Game, public nation: Nation) {
    this.area = this.game.areasManager.make(
      nation.colors.primary,
      nation.colors.secondary,
    );
  }

  exploreTiles(tiles: Iterable<TileCore>) {
    for (const tile of tiles) {
      if (!this.exploredTiles.has(tile)) {
        this.exploredTiles.add(tile);
        this.updateViewBoundingBox(tile);
        if (tile.passableArea) {
          this.knownPassableAreas.add(tile.passableArea);
        }
        if (tile.resource) {
          this.discoveredResourceDeposits.add(tile.resource);
          if (this.id === this.game.trackedPlayer?.id) {
            collector.discoveredResourceDeposits.add(tile.resource);
          }
        }
        if (this.id === this.game.trackedPlayer?.id) {
          collector.tilesFogOfWar.add(tile);
          if (tile.city) {
            collector.cities.add(tile.city);
          }
        }
      }
    }
    if (this.id === this.game.trackedPlayer?.id) {
      collector.viewBoundingBox = this.viewBoundingBox;
    }
  }

  showTiles(tiles: Iterable<TileCore>) {
    for (const tile of tiles) {
      if (!this.visibleTiles.has(tile)) {
        this.visibleTiles.add(tile);
        if (this.id === this.game.trackedPlayer.id) {
          collector.tilesFogOfWar.add(tile);
        }
      }
    }
  }

  updateYields() {
    zeroYields(this.yields.income);
    zeroYields(this.yields.costs);
    zeroYields(this.yields.perTurn);

    for (const city of this.cities) {
      for (const tile of city.expansion.tiles) {
        if (!tile.city) {
          if (tile.improvement !== null) {
            this.yields.costs.publicWorks++;
          }
          if (tile.road !== null) {
            this.yields.costs.publicWorks++;
          }
        }
      }
      addYields(this.yields.income, city.yields);
    }

    copyYields(this.yields.perTurn, this.yields.income);
    subtractYields(this.yields.perTurn, this.yields.costs);

    if (this === this.game.trackedPlayer) {
      collector.trackedPlayerYields = this.yields;
    }
  }

  nextTurn() {
    this.updateYields();
    addYields(this.yields.total, this.yields.perTurn);
    this.yields.total.publicWorks = Math.max(0, this.yields.total.publicWorks);

    this.updateCitiesWithoutProduction();
    this.updateUnitsWithoutOrders();
    this.updateVisibleTiles();
    this.knowledge.nextTurn();
  }

  updateVisibleTiles() {
    this.visibleTiles.clear();
    for (const city of this.cities) {
      // TODO replace with city.visibleTiles
      for (const tile of city.expansion.tiles) {
        this.visibleTiles.add(tile);
      }
    }
    for (const unit of this.units) {
      for (const tile of unit.getVisibleTiles()) {
        this.visibleTiles.add(tile);
      }
    }

    if (this === this.game.trackedPlayer) {
      collector.addFogOfWarChange(this.visibleTiles);
    }
  }

  updateCitiesWithoutProduction() {
    this.citiesWithoutProduction = this.cities.filter(
      (c) => !c.production.product,
    );
  }

  updateUnitsWithoutOrders() {
    this.unitsWithoutOrders = this.units.filter(
      (c) => !c.order && !c.parent && c.actionPointsLeft,
    );
  }

  addCity(city: CityCore) {
    this.cities.push(city);
  }

  isEnemyWith(player: PlayerCore) {
    // It's a deathmatch for now.
    return this !== player;
  }

  updateViewBoundingBox(tile: TileCore) {
    this.viewBoundingBox.minX = Math.min(this.viewBoundingBox.minX, tile.x);
    this.viewBoundingBox.minY = Math.min(this.viewBoundingBox.minY, tile.y);
    this.viewBoundingBox.maxX = Math.max(this.viewBoundingBox.maxX, tile.x);
    this.viewBoundingBox.maxY = Math.max(this.viewBoundingBox.maxY, tile.y);
  }
}
