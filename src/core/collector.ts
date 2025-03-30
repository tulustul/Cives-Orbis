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
} from "./serialization/channel";
import { PlayerYields } from "../shared";
import { Technology } from "./data.interface";
import { Game } from "./game";

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
  tilesExplored = new Set<TileCore>();
  tilesShowed = new Set<TileCore>();
  tilesShowedAdded = new Set<TileCore>();

  research: Technology | null | undefined = undefined;
  newTechs: Technology[] = [];

  viewBoundingBox: PlayerViewBoundingBox | null = null;

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
            city.player.game.trackedPlayer.exploredTiles.has(city.tile)
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
    if (this.tilesExplored.size) {
      changes.push({
        type: "trackedPlayer.tilesExplored",
        data: {
          tiles: Array.from(this.tilesExplored).map(tileToTileCoords),
          viewBoundingBox: this.viewBoundingBox,
        },
      });
    }
    if (this.tilesShowed.size) {
      changes.push({
        type: "trackedPlayer.tilesShowed",
        data: Array.from(this.tilesShowed).map(tileToTileCoords),
      });
    }
    if (this.tilesShowedAdded.size) {
      changes.push({
        type: "trackedPlayer.tilesShowedAdded",
        data: Array.from(this.tilesShowedAdded).map(tileToTileCoords),
      });
    }

    if (this.research !== undefined) {
      let data: TechKnowledgeChanneled | null = null;
      if (this.research) {
        data = knowledgeTechToChannel(
          game.trackedPlayer.knowledge,
          this.research
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
    this.tilesExplored.clear();
    this.tilesShowed.clear();
    this.tilesShowedAdded.clear();

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

  setVisibleTiles(tiles: Set<TileCore>) {
    for (const tile of tiles) {
      this.tilesShowed.add(tile);
    }
  }

  addVisibleTiles(tiles: Set<TileCore>) {
    for (const tile of tiles) {
      this.tilesShowedAdded.add(tile);
    }
  }
}

export const collector = new Collector();
