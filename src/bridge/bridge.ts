import {
  CityChanneled,
  CityDetailsChanneled,
  CityGetWorkTilesResult,
  CityProduceOptions,
  CityRange,
  CityWorkTileOptions,
  EntityChanneled,
  EntityGetFailedWeakRequirements,
  FogOfWarFilter,
  GameGetEntityOptions,
  GameInfo,
  GameStartInfo,
  GrantRevokeTechOptions,
  MapGeneratorOptions,
  Option,
  PlayerChanneled,
  PlayerEconomyChanneled,
  PlayerTask,
  PlayerYields,
  Requirement,
  ResourceSpawnOptions,
  ResourceWithTileChanneled,
  StatsGetChanneled,
  StatsGetOptions,
  TechDefChanneled,
  TechKnowledgeChanneled,
  TileChanneled,
  TileDetailsChanneled,
  TileGetHoverDetailsOptions,
  TileGetInRangeOptions,
  TileHoverDetails,
  TileOwnershipChanneled,
  TilesCoordsWithNeighbours,
  TilesFogOfWarChanneled,
  TileUpdateOptions,
  UnitChanneled,
  UnitDetailsChanneled,
  UnitDoActionOptions,
  UnitFindPathOptions,
  UnitGetFailedActionRequirementsOptions,
  UnitMoveChanneled,
  UnitSetOrderOptions,
  UnitSpawnOptions,
} from "@/shared";
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
    getYields: () => makeCommand<PlayerYields>("player.getYields"),
    getSuppliedTiles: (playerId: number) =>
      makeCommand<TilesCoordsWithNeighbours[]>(
        "player.getSuppliedTiles",
        playerId,
      ),
    getEconomyOverview: () =>
      makeCommand<PlayerEconomyChanneled>("player.getEconomyOverview"),
  },
  tiles: {
    updated$: makeObservable<TileChanneled[]>("tiles.updated"),
    fogOfWar$: makeObservable<TilesFogOfWarChanneled>("trackedPlayer.fogOfWar"),
    ownership$: makeObservable<TileOwnershipChanneled[]>("tile.ownership"),
    getAll: () => makeCommand<TileChanneled[]>("tile.getAll"),
    getOwnership: (options: FogOfWarFilter) =>
      makeCommand<TileOwnershipChanneled[]>("tile.getOwnership", options),
    getFogOfWar: () => makeCommand<TilesFogOfWarChanneled>("tile.getFogOfWar"),
    getDetails: (tileId: number) =>
      makeCommand<TileDetailsChanneled>("tile.getDetails", tileId),
    getHoverDetails: (options: TileGetHoverDetailsOptions) =>
      makeCommand<TileHoverDetails>("tile.getHoverDetails", options),
    getInRange: (options: TileGetInRangeOptions) =>
      makeCommand<TilesCoordsWithNeighbours[]>("tile.getInRange", options),
  },
  resources: {
    discovered$: makeObservable<ResourceWithTileChanneled>(
      "resource.discovered",
    ),
    depleted$: makeObservable<ResourceWithTileChanneled>("resource.depleted"),
    getAll: (options: FogOfWarFilter) =>
      makeCommand<ResourceWithTileChanneled[]>("resource.getAll", options),
  },
  entities: {
    getFailedWeakRequirements: (options: EntityGetFailedWeakRequirements) =>
      makeCommand<Requirement[]>("entity.getFailedWeakRequirements", options),
    getDetails: (entityId: string) =>
      makeCommand<EntityChanneled | null>("entity.getDetails", entityId),
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
      options: UnitGetFailedActionRequirementsOptions,
    ) => makeCommand<string[]>("unit.getFailedActionRequirements", options),
  },
  cities: {
    spawned$: makeObservable<CityChanneled>("city.spawned"),
    updated$: makeObservable<CityChanneled[]>("city.updated"),
    destroyed$: makeObservable<number>("city.destroyed"),
    getAll: (options: FogOfWarFilter) =>
      makeCommand<CityChanneled[]>("city.getAll", options),
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
  technologies: {
    researchUpdated$: makeObservable<TechKnowledgeChanneled | null>(
      "tech.updated",
    ),
    discovered$: makeObservable<TechDefChanneled>("tech.discovered"),
    getAll: () => makeCommand<TechKnowledgeChanneled[]>("tech.getAll"),
    getResearch: () => makeCommand<TechKnowledgeChanneled>("tech.getResearch"),
    research: (techId: string) => makeCommand<void>("tech.research", techId),
  },
  editor: {
    game: {
      getEntityOptions: (options: GameGetEntityOptions) =>
        makeCommand<Option<string>[]>("game.editor.getEntityOptions", options),
    },
    units: {
      spawn: (options: UnitSpawnOptions) =>
        makeCommand<void>("unit.spawn", options),
    },
    tiles: {
      update: (options: TileUpdateOptions) =>
        makeCommand<void>("tile.update", options),
      bulkUpdate: (options: TileUpdateOptions[]) =>
        makeCommand<void>("tile.bulkUpdate", options),
    },
    resources: {
      spawn: (options: ResourceSpawnOptions) =>
        makeCommand<void>("resource.editor.spawn", options),
    },
    player: {
      trackPlayer: (playerId: number) =>
        makeCommand<PlayerChanneled>("trackedPlayer.set", playerId),
      grantRevokeTech: (options: GrantRevokeTechOptions) =>
        makeCommand<void>("player.editor.grantRevokeTech", options),
      revealMap: () => makeCommand<void>("player.editor.revealMap"),
    },
  },
};
