import { PlayerCore } from "./player";
import { TilesMapCore } from "./tiles-map";
import { UnitsManager } from "./unit-manager";
import { Debug } from "./debug";
import { CitiesManager } from "./cities-manager";
import { AreasManager } from "./areas-manager";
import { collector } from "./collector";
import { CitiesNetworks } from "./cities-network";
import { Stats } from "./stats";

export class Game {
  debug = new Debug();

  map!: TilesMapCore;

  players: PlayerCore[] = [];
  playersMap = new Map<number, PlayerCore>();

  activePlayerIndex = -1;

  trackedPlayer!: PlayerCore;

  humanPlayer: PlayerCore | null = null;

  turn = 1;

  areasManager = new AreasManager();

  unitsManager = new UnitsManager();

  citiesManager = new CitiesManager(this);

  citiesNetworks = new CitiesNetworks(this);

  stats = new Stats(this);

  start() {
    this.preprocessEntities();
    this.activePlayerIndex = -1;
    this.nextPlayer();
  }

  preprocessEntities() {
    for (const player of this.players) {
      player.updateCitiesWithoutProduction();
      player.updateUnitsWithoutOrders();
      player.updateYields();
      player.updateVisibleTiles();
    }
    this.citiesNetworks.update();
    this.stats.prepare();
  }

  addPlayer(player: PlayerCore) {
    player.id = this.players.length;
    this.players.push(player);
    this.playersMap.set(player.id, player);
    if (!this.trackedPlayer) {
      this.trackedPlayer = player;
    }
  }

  nextPlayer() {
    this.activePlayerIndex++;
    if (this.activePlayerIndex >= this.players.length) {
      this.nextTurn();
      this.activePlayerIndex = 0;
    }
    if (this.activePlayer.ai) {
      this.activePlayer.ai.nextTurn();
      if (this.activePlayer !== this.trackedPlayer) {
        this.nextPlayer();
      }
    } else {
      if (this.activePlayer !== this.trackedPlayer) {
        this.trackedPlayer = this.activePlayer;
        collector.trackedPlayer = this.trackedPlayer;
        collector.setVisibleTiles(this.trackedPlayer.visibleTiles);
      }
    }
  }

  nextTurn() {
    this.unitsManager.nextTurn();
    this.citiesManager.nextTurn();
    this.citiesNetworks.update();
    for (const player of this.players) {
      player.nextTurn();
    }
    this.citiesManager.updateProductsLists();
    this.stats.nextTurn();
    this.turn++;
    collector.turn = this.turn;
  }

  get activePlayer() {
    return this.players[this.activePlayerIndex];
  }
}
