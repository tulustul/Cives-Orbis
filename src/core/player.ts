import { AIPlayer } from "@/ai/ai-player";
import { PlayerViewBoundingBox, PlayerYields } from "@/shared";
import { CityCore } from "./city";
import { collector } from "./collector";
import { Nation } from "./data/types";
import { Game } from "./game";
import { Knowledge } from "./knowledge";
import { moveAlongPath } from "./movement";
import { ResourceDeposit } from "./resources";
import { TileCore } from "./tile";
import { PassableArea } from "./tiles-map";
import { UnitCore } from "./unit";
import { UnitGroup } from "./unitGroup";
import {
  addYields,
  copyYields,
  EMPTY_YIELDS,
  subtractYields,
  zeroYields,
} from "./yields";

export class PlayerCore {
  id!: number;

  exploredTiles = new Set<TileCore>();

  visibleTiles = new Set<TileCore>();

  knownPassableAreas = new Set<PassableArea>();

  units: UnitCore[] = [];

  unitGroups: UnitGroup[] = [];

  cities: CityCore[] = [];

  citiesWithoutProduction: CityCore[] = [];

  unitGroupsWithoutOrders: UnitGroup[] = [];

  yields: PlayerYields = {
    costs: { ...EMPTY_YIELDS },
    income: { ...EMPTY_YIELDS },
    cities: { ...EMPTY_YIELDS },
    total: { ...EMPTY_YIELDS },
    perTurn: { ...EMPTY_YIELDS },
    unitWages: { ...EMPTY_YIELDS },
    trade: { ...EMPTY_YIELDS },
  };

  ai: AIPlayer | null = null;

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

  empireCenter: TileCore | null = null;

  constructor(public game: Game, public nation: Nation) {}

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
          collector.tilesExplored.add(tile);
          if (tile.city) {
            collector.cities.add(tile.city);
          }
        }
      }
    }
  }

  hideTiles(tiles: Iterable<TileCore>) {
    for (const tile of tiles) {
      if (this.visibleTiles.has(tile)) {
        this.visibleTiles.delete(tile);
        if (this.id === this.game.trackedPlayer.id) {
          collector.tilesFogOfWar.add(tile);
        }
      }
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
    zeroYields(this.yields.unitWages);
    zeroYields(this.yields.trade);
    zeroYields(this.yields.cities);

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
      addYields(this.yields.cities, city.perTurn);
      addYields(this.yields.trade, city.tradeYields);
    }

    this.yields.unitWages.gold = this.units.reduce(
      (acc, unit) => acc + unit.wage,
      0,
    );

    addYields(this.yields.income, this.yields.cities);
    addYields(this.yields.income, this.yields.trade);
    addYields(this.yields.costs, this.yields.unitWages);
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

    this.calculateEmpireCenter();

    this.updateUnitsWages();
  }

  updateUnitsWages() {
    if (this.yields.total.gold < 0) {
      let deficit = -this.yields.perTurn.gold;
      for (const unit of this.units) {
        unit.hasWage = deficit <= 0;
        deficit -= unit.wage;
      }
    }
  }

  calculateEmpireCenter() {
    if (this.cities.length === 0) {
      this.empireCenter = null;
      return;
    }

    let x = 0;
    let y = 0;
    for (const city of this.cities) {
      x += city.tile.x;
      y += city.tile.y;
    }

    x = Math.floor(x / this.cities.length);
    y = Math.floor(y / this.cities.length);

    this.empireCenter = this.game.map.tiles[x][y];
  }

  updateVisibleTiles() {
    let oldVisibleTiles: Set<TileCore> | null = null;
    if (this === this.game.trackedPlayer) {
      oldVisibleTiles = new Set(this.visibleTiles);
    }

    this.visibleTiles.clear();

    for (const city of this.cities) {
      for (const tile of city.expansion.visibleTiles) {
        this.visibleTiles.add(tile);
      }
    }
    for (const unit of this.units) {
      for (const tile of unit.getVisibleTiles()) {
        this.visibleTiles.add(tile);
      }
    }

    if (this === this.game.trackedPlayer && oldVisibleTiles) {
      for (const tile of this.visibleTiles) {
        // tile shown
        if (!oldVisibleTiles.has(tile)) {
          collector.tilesFogOfWar.add(tile);
        }
      }
      for (const tile of oldVisibleTiles) {
        // tile hidden
        if (!this.visibleTiles.has(tile)) {
          collector.tilesFogOfWar.add(tile);
        }
      }
    }
  }

  updateCitiesWithoutProduction() {
    this.citiesWithoutProduction = this.cities.filter(
      (c) => !c.production.product,
    );
  }

  updateUnitsWithoutOrders() {
    this.unitGroupsWithoutOrders = this.unitGroups.filter(
      (c) => !c.order && c.actionPointsLeft,
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

  moveAllUnits() {
    for (const group of this.unitGroups) {
      if (group.path) {
        moveAlongPath(group);
      }
    }
  }
}
