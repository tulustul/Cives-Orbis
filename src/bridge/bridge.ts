import {
  CityGetWorkTilesResult,
  CityProduceOptions,
  CityRange,
  CityWorkTileOptions,
  EntityGetFailedWeakRequirements,
  MapGeneratorOptions,
  StatsGetChanneled,
  StatsGetOptions,
  TilesExploredChanneled,
  TileGetHoverDetailsOptions,
  TileGetInRangeOptions,
  TileSetResourceOptions,
  TileUpdateOptions,
  UnitDoActionOptions,
  UnitFindPathOptions,
  UnitGetFailedActionRequirementsOptions,
  UnitSetOrderOptions,
  UnitSimulateCombatOptions,
  UnitSpawnOptions,
} from "@/core.worker";
import { CombatSimulation } from "@/core/combat";
import {
  AreaChanneled,
  CityChanneled,
  CityDetailsChanneled,
  GameInfo,
  GameStartInfo,
  PlayerChanneled,
  TechnologyChanneled,
  TileChanneled,
  TileCoords,
  TileDetailsChanneled,
  TileHoverDetails,
  TilesCoordsWithNeighbours,
  UnitChanneled,
  UnitDetailsChanneled,
  UnitMoveChanneled,
} from "@/core/serialization/channel";
import { PlayerTask, PlayerYields } from "@/shared";
import { shareReplay } from "rxjs";
import { makeCommand, makeObservable } from "./worker";

export const bridge = {
  nextTask$: makeObservable<PlayerTask | null>("nextTask"),
  game: {
    start$: makeObservable<GameStartInfo>("game.start").pipe(shareReplay(1)),
    turn$: makeObservable<number>("game.turn"),
    new: (options: MapGeneratorOptions) =>
      makeCommand<GameInfo>("game.new", options),
    dump: () => makeCommand<string>("game.dump"),
    load: (data: string) => makeCommand<GameInfo>("game.load", data),
    nextPlayer: () => makeCommand<void>("game.nextPlayer"),
    getInfo: () => makeCommand<GameStartInfo>("game.getInfo"),
    getAllPlayers: () => makeCommand<PlayerChanneled[]>("game.getAllPlayers"),
  },
  stats: {
    get: (options: StatsGetOptions) =>
      makeCommand<StatsGetChanneled[]>("stats.get", options),
  },
  player: {
    tracked$: makeObservable<number>("trackedPlayer.changed"),
    yields$: makeObservable<PlayerYields>("trackedPlayer.yields"),
    getSuppliedTiles: (playerId: number) =>
      makeCommand<TilesCoordsWithNeighbours[]>(
        "player.getSuppliedTiles",
        playerId
      ),
    trackPlayer: (playerId: number) =>
      makeCommand<PlayerChanneled>("trackedPlayer.set", playerId),
  },
  tiles: {
    updated$: makeObservable<TileChanneled[]>("tiles.updated"),
    explored$: makeObservable<TilesExploredChanneled>(
      "trackedPlayer.tilesExplored"
    ),
    showed$: makeObservable<TileCoords[]>("trackedPlayer.tilesShowed"),
    showedAdded$: makeObservable<TileCoords[]>(
      "trackedPlayer.tilesShowedAdded"
    ),
    getAll: () => makeCommand<TileChanneled[]>("tile.getAll"),
    getAllExplored: () =>
      makeCommand<TilesExploredChanneled>("tile.getAllExplored"),
    getAllVisible: () => makeCommand<TileCoords[]>("tile.getAllVisible"),
    getDetails: (tileId: number) =>
      makeCommand<TileDetailsChanneled>("tile.getDetails", tileId),
    getHoverDetails: (options: TileGetHoverDetailsOptions) =>
      makeCommand<TileHoverDetails>("tile.getHoverDetails", options),
    getInRange: (options: TileGetInRangeOptions) =>
      makeCommand<TilesCoordsWithNeighbours[]>("tile.getInRange", options),
    update: (options: TileUpdateOptions) =>
      makeCommand<void>("tile.update", options),
    bulkUpdate: (options: TileUpdateOptions[]) =>
      makeCommand<void>("tile.bulkUpdate", options),
    setResource: (options: TileSetResourceOptions) =>
      makeCommand<void>("tile.setResource", options),
  },
  entities: {
    getFailedWeakRequirements: (options: EntityGetFailedWeakRequirements) =>
      makeCommand<[string, any][]>("entity.getFailedWeakRequirements", options),
  },
  units: {
    updated$: makeObservable<UnitChanneled>("unit.updated"),
    destroyed$: makeObservable<number>("unit.destroyed"),
    moved$: makeObservable<UnitMoveChanneled>("unit.moved"),
    getAll: () => makeCommand<UnitChanneled[]>("unit.getAll"),
    getDetails: (unitId: number) =>
      makeCommand<UnitDetailsChanneled | null>("unit.getDetails", unitId),
    getRange: (unitId: number) =>
      makeCommand<TilesCoordsWithNeighbours[]>("unit.getRange", unitId),
    spawn: (options: UnitSpawnOptions) =>
      makeCommand<void>("unit.spawn", options),
    doAction: (options: UnitDoActionOptions) =>
      makeCommand<UnitDetailsChanneled | null>("unit.doAction", options),
    setOrder: (options: UnitSetOrderOptions) =>
      makeCommand<UnitDetailsChanneled | null>("unit.setOrder", options),
    findPath: (options: UnitFindPathOptions) =>
      makeCommand<UnitDetailsChanneled | null>("unit.findPath", options),
    disband: (unitId: number) => makeCommand<void>("unit.disband", unitId),
    moveAlongPath: (unitId: number) =>
      makeCommand<UnitDetailsChanneled | null>("unit.moveAlongPath", unitId),
    getFailedActionRequirements: (
      options: UnitGetFailedActionRequirementsOptions
    ) => makeCommand<string[]>("unit.getFailedActionRequirements", options),
    simulateCombat: (options: UnitSimulateCombatOptions) =>
      makeCommand<CombatSimulation | null>("unit.simulateCombat", options),
  },
  cities: {
    spawned$: makeObservable<CityChanneled>("city.spawned"),
    updated$: makeObservable<CityChanneled[]>("city.updated"),
    destroyed$: makeObservable<number>("city.destroyed"),
    getAllRevealed: () => makeCommand<CityChanneled[]>("city.getAllRevealed"),
    getDetails: (cityId: number) =>
      makeCommand<CityDetailsChanneled | null>("city.getDetails", cityId),
    produce: (options: CityProduceOptions) =>
      makeCommand<CityDetailsChanneled | null>("city.produce", options),
    getRange: (cityId: number) =>
      makeCommand<CityRange | null>("city.getRange", cityId),
    getWorkTiles: (cityId: number) =>
      makeCommand<CityGetWorkTilesResult | null>("city.getWorkTiles", cityId),
    workTile: (options: CityWorkTileOptions) =>
      makeCommand<CityDetailsChanneled | null>("city.workTile", options),
    unworkTile: (options: CityWorkTileOptions) =>
      makeCommand<CityDetailsChanneled | null>("city.unworkTile", options),
    optimizeYields: (cityId: number) =>
      makeCommand<CityDetailsChanneled | null>("city.optimizeYields", cityId),
  },
  areas: {
    tilesAdded$: makeObservable<AreaChanneled>("area.tilesAdded"),
    tilesRemoved$: makeObservable<AreaChanneled>("area.tilesRemoved"),
    destroyed$: makeObservable<number>("area.destroyed"),
    getAll: () => makeCommand<AreaChanneled[]>("area.getAll"),
    getTiles: (areaId: number) =>
      makeCommand<TilesCoordsWithNeighbours[]>("area.getTiles", areaId),
  },
  technologies: {
    getAll: () => makeCommand<TechnologyChanneled[]>("tech.getAll"),
    select: (technology: TechnologyChanneled) =>
      makeCommand<void>("tech.select", technology),
  },
};
