import { Game } from "./game";
import { PlayerCore } from "./player";

export type StatsData = {
  cities: number[];
  food: number[];
  production: number[];
  culture: number[];
  military: number[];
  knowledge: number[];
  techs: number[];
};

export class Stats {
  data = new Map<PlayerCore, StatsData>();

  constructor(private game: Game) {}

  public nextTurn() {
    for (const player of this.game.players) {
      this.updatePlayerStats(player);
    }
  }

  public prepare() {
    for (const player of this.game.players) {
      if (!this.data.has(player)) {
        this.data.set(player, {
          cities: [],
          food: [],
          production: [],
          culture: [],
          military: [],
          knowledge: [],
          techs: [],
        });
      }
    }
  }

  private updatePlayerStats(player: PlayerCore) {
    const stats = this.data.get(player)!;

    stats.cities.push(player.cities.length);
    stats.food.push(player.yields.income.food);
    stats.production.push(player.yields.income.production);
    stats.culture.push(player.yields.income.culture);
    stats.knowledge.push(player.yields.income.knowledge);
    stats.techs.push(player.knowledge.discoveredTechs.size);

    const military = player.units.reduce(
      (acc, unit) => acc + unit.definition.strength,
      0
    );
    stats.military.push(military);
  }
}
