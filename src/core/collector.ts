import {
  TilesFogOfWarChanneled,
  CityChanneled,
  PlayerYields,
  TechKnowledgeChanneled,
} from "@/shared";
import { CityCore } from "./city";
import { Game } from "./game";
import { PlayerCore } from "./player";
import { ResourceDeposit } from "./resources";
import {
  cityToChannel,
  knowledgeTechToChannel,
  resourceWithTileToChannel,
  techToChannel,
  tileToChannel,
  tileToFogOfWar,
  tileToTileOwnershipChannel,
  trackedPlayerToChannel,
  unitMoveToChannel,
  unitToChannel,
} from "./serialization/channel";
import { TileCore } from "./tile";
import { UnitCore } from "./unit";
import { Technology } from "./data/types";

export type CityRevealedResult = {
  city: CityChanneled;
  action: "center" | "none";
};

type CollectorChange = {
  type: string;
  data: any;
};

class Collector {
  changes: CollectorChange[] = [];

  tiles = new Set<TileCore>();

  units = new Set<UnitCore>();
  unitsDestroyed = new Set<number>();

  moves = new Map<UnitCore, TileCore[]>();

  cities = new Set<CityCore>();
  citiesDestroyed = new Set<number>();

  trackedPlayer: PlayerCore | undefined;
  trackedPlayerYields: PlayerYields | undefined;

  tilesFogOfWar = new Set<TileCore>();

  research: Technology | null | undefined = undefined;
  newTechs: Technology[] = [];

  discoveredResourceDeposits = new Set<ResourceDeposit>();
  depletedResourceDeposits = new Set<ResourceDeposit>();

  tileOwnershipChanges = new Set<TileCore>();
  tilesExplored = new Set<TileCore>();

  turn: number | undefined;

  flush(game: Game) {
    const changes = this.changes;

    for (const unit of this.units) {
      if (unit.isAlive) {
        changes.push({ type: "unit.updated", data: unitToChannel(unit) });
      }
    }
    for (const id of this.unitsDestroyed) {
      changes.push({ type: "unit.destroyed", data: id });
    }

    if (this.cities.size) {
      changes.push({
        type: "city.updated",
        data: Array.from(this.cities)
          .filter((city) =>
            city.player.game.trackedPlayer.exploredTiles.has(city.tile),
          )
          .map((city) => cityToChannel(city)),
      });
    }

    for (const id of this.citiesDestroyed) {
      changes.push({ type: "city.destroyed", data: id });
    }

    if (this.tiles.size) {
      changes.push({
        type: "tiles.updated",
        data: Array.from(this.tiles).map((tile) => tileToChannel(tile)),
      });
    }

    if (this.turn) {
      changes.push({ type: "game.turn", data: this.turn });
    }

    if (this.trackedPlayer) {
      changes.push({
        type: "trackedPlayer.set",
        data: trackedPlayerToChannel(this.trackedPlayer),
      });
    }
    if (this.trackedPlayerYields) {
      changes.push({
        type: "trackedPlayer.yields",
        data: this.trackedPlayerYields,
      });
    }

    if (this.tilesFogOfWar.size) {
      const toUpdate = new Set<TileCore>();
      for (const tile of this.tilesFogOfWar) {
        toUpdate.add(tile);
        for (const neighbour of tile.neighbours) {
          toUpdate.add(neighbour);
        }
      }
      const data: TilesFogOfWarChanneled = {
        tiles: Array.from(toUpdate).map((t) => tileToFogOfWar(t, game)),
        viewBoundingBox: game.trackedPlayer.viewBoundingBox,
      };
      changes.push({ type: "trackedPlayer.fogOfWar", data });
    }

    if (this.research !== undefined) {
      let data: TechKnowledgeChanneled | null = null;
      if (this.research) {
        data = knowledgeTechToChannel(
          game.trackedPlayer.knowledge,
          this.research,
        );
      }
      changes.push({ type: "tech.updated", data });
    }

    this.research = undefined;

    for (const tech of this.newTechs) {
      changes.push({
        type: "tech.discovered",
        data: techToChannel(tech),
      });
    }
    this.newTechs = [];

    // const movedUnits = new Set(Array.from(this.moves.keys()));
    // if (movedUnits.size !== this.moves.size) {
    //   console.error("asdasdasd");
    //   debugger;
    // }

    for (const [unit, tiles] of this.moves.entries()) {
      if (unit.isAlive) {
        changes.push({
          type: "unit.moved",
          data: unitMoveToChannel(unit, tiles),
        });
      }
    }

    // Depleted must go before discovered
    for (const resource of this.depletedResourceDeposits) {
      changes.push({
        type: "resource.depleted",
        data: resourceWithTileToChannel(resource),
      });
    }
    for (const resource of this.discoveredResourceDeposits) {
      changes.push({
        type: "resource.discovered",
        data: resourceWithTileToChannel(resource),
      });
    }

    if (this.tileOwnershipChanges.size || this.tilesExplored.size) {
      for (const tile of Array.from(this.tilesExplored).filter(
        (tile) => !!tile.areaOf,
      )) {
        this.tileOwnershipChanges.add(tile);
      }
      const toUpdate = new Set<TileCore>();
      for (const tile of this.tileOwnershipChanges) {
        if (!game.trackedPlayer.exploredTiles.has(tile)) {
          continue;
        }
        toUpdate.add(tile);
        for (const neighbour of tile.neighbours) {
          if (game.trackedPlayer.exploredTiles.has(neighbour)) {
            toUpdate.add(neighbour);
          }
        }
      }
      changes.push({
        type: "tile.ownership",
        data: Array.from(toUpdate).map((t) => tileToTileOwnershipChannel(t)),
      });
    }

    this.tiles.clear();

    this.unitsDestroyed.clear();
    this.units.clear();
    this.moves.clear();

    this.cities.clear();
    this.citiesDestroyed.clear();

    this.trackedPlayer = undefined;
    this.trackedPlayerYields = undefined;

    this.tilesFogOfWar.clear();

    this.depletedResourceDeposits.clear();
    this.discoveredResourceDeposits.clear();

    this.tileOwnershipChanges.clear();
    this.tilesExplored.clear();

    this.changes = [];

    this.turn = undefined;

    return changes;
  }

  addMove(unit: UnitCore, tiles: TileCore[]) {
    const oldTiles = this.moves.get(unit);
    if (oldTiles === undefined) {
      this.moves.set(unit, tiles);
      return;
    }
    oldTiles.push(...tiles);
  }
}

export const collector = new Collector();
