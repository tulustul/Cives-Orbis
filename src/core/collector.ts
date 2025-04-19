import { TileCore } from "./tile";
import { UnitCore } from "./unit";
import { CityCore } from "./city";
import { PlayerCore, PlayerViewBoundingBox } from "./player";
import {
  tileToChannel,
  unitToChannel,
  cityToChannel,
  trackedPlayerToChannel,
  unitMoveToChannel,
  tileToTileCoords,
  tilesToTileCoordsWithNeighbours,
  CityChanneled,
  knowledgeTechToChannel,
  TechKnowledgeChanneled,
  techToChannel,
  tileToFogOfWar,
  resourceWithTileToChannel,
} from "./serialization/channel";
import { PlayerYields } from "../shared";
import { Technology } from "./data.interface";
import { Game } from "./game";
import { ResourceDeposit } from "./resources";

export type UnitMoveCore = {
  unit: UnitCore;
  tiles: TileCore[];
};

export type CityRevealedResult = {
  city: CityChanneled;
  action: "center" | "none";
};

class Collector {
  changes: any[] = [];

  tiles = new Set<TileCore>();

  units = new Set<UnitCore>();
  unitsDestroyed = new Set<number>();

  moves: UnitMoveCore[] = [];

  cities = new Set<CityCore>();
  citiesDestroyed = new Set<number>();

  areaTilesAdded = new Map<number, TileCore[]>();
  areaTilesRemoved = new Map<number, TileCore[]>();

  trackedPlayer: PlayerCore | undefined;
  trackedPlayerYields: PlayerYields | undefined;

  tilesFogOfWar = new Set<TileCore>();

  research: Technology | null | undefined = undefined;
  newTechs: Technology[] = [];

  viewBoundingBox: PlayerViewBoundingBox | null = null;

  discoveredResourceDeposits = new Set<ResourceDeposit>();
  depletedResourceDeposits = new Set<ResourceDeposit>();

  turn: number | undefined;

  flush(game: Game) {
    const changes = this.changes;

    for (const unit of this.units) {
      changes.push({ type: "unit.updated", data: unitToChannel(unit) });
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

    for (const [id, tiles] of this.areaTilesAdded.entries()) {
      changes.push({
        type: "area.tilesAdded",
        data: { id, tiles: tiles.map(tilesToTileCoordsWithNeighbours) },
      });
    }
    for (const [id, tiles] of this.areaTilesRemoved.entries()) {
      changes.push({
        type: "area.tilesRemoved",
        data: { id, tiles: tiles.map(tilesToTileCoordsWithNeighbours) },
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
      changes.push({
        type: "trackedPlayer.fogOfWar",
        data: {
          tiles: Array.from(this.tilesFogOfWar).map((t) =>
            tileToFogOfWar(t, game),
          ),
          viewBoundingBox: this.viewBoundingBox,
        },
      });
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

    for (const move of this.moves) {
      changes.push({ type: "unit.moved", data: unitMoveToChannel(move) });
    }

    for (const resource of this.discoveredResourceDeposits) {
      changes.push({
        type: "resource.discovered",
        data: resourceWithTileToChannel(resource),
      });
    }
    for (const resource of this.depletedResourceDeposits) {
      changes.push({
        type: "resource.depleted",
        data: resourceWithTileToChannel(resource),
      });
    }

    this.tiles.clear();

    this.unitsDestroyed.clear();
    this.units.clear();
    this.moves = [];

    this.cities.clear();
    this.citiesDestroyed.clear();

    this.areaTilesAdded.clear();
    this.areaTilesRemoved.clear();

    this.trackedPlayer = undefined;
    this.trackedPlayerYields = undefined;

    this.tilesFogOfWar.clear();

    this.discoveredResourceDeposits.clear();

    this.changes = [];

    this.turn = undefined;

    this.viewBoundingBox = null;

    return changes;
  }

  addAreaTiles(areaId: number, tiles: TileCore[]) {
    if (!this.areaTilesAdded.has(areaId)) {
      this.areaTilesAdded.set(areaId, tiles);
    } else {
      this.areaTilesAdded.get(areaId)!.push(...tiles);
    }
  }

  removeAreaTiles(areaId: number, tiles: TileCore[]) {
    if (!this.areaTilesRemoved.has(areaId)) {
      this.areaTilesRemoved.set(areaId, tiles);
    } else {
      this.areaTilesRemoved.get(areaId)!.push(...tiles);
    }
  }

  addFogOfWarChange(tiles: Set<TileCore>) {
    for (const tile of tiles) {
      this.tilesFogOfWar.add(tile);
    }
  }
}

export const collector = new Collector();
