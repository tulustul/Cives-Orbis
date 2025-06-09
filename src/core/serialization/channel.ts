import { CityCore } from "@/core/city";
import {
  Building,
  Entity,
  IdleProduct,
  ProductDefinition,
  ResourceDefinition,
  Technology,
  TileImprovementDefinition,
  UnitDefinition,
} from "@/core/data/types";
import { Game } from "@/core/game";
import { Knowledge } from "@/core/knowledge";
import { PlayerCore } from "@/core/player";
import { ResourceDeposit } from "@/core/resources";
import { TileCore } from "@/core/tile";
import { TilesMapCore } from "@/core/tiles-map";
import { UnitCore } from "@/core/unit";
import {
  BuildingChanneled,
  CityChanneled,
  CityDefenseChanneled,
  CityDetailsChanneled,
  CityOverviewChanneled,
  CityProductChanneled,
  CombatSimulationChanneled,
  CombatSimulationSideChanneled,
  EntityChanneled,
  EntityMinimalChanneled,
  FogOfWarStatus,
  GameChanneled,
  GameStartInfo,
  MapChanneled,
  NationColors,
  PlayerChanneled,
  ProductChanneled,
  ResourceChanneled,
  ResourceDefinitionChannel,
  ResourceWithTileChanneled,
  SeaLevel,
  TechDefChanneled,
  TechKnowledgeChanneled,
  TileChanneled,
  TileCoords,
  TileCoordsWithUnits,
  TileDetailsChanneled,
  TileFogOfWar,
  TileImprovementChanneled,
  TileOwnershipChanneled,
  TilesCoordsWithNeighbours,
  TrackedPlayerChanneled,
  UnitChanneled,
  UnitDefChanneled,
  UnitDetailsChanneled,
  UnitIdAndName,
  UnitMoveChanneled,
  UnitPathChanneled,
} from "@/shared";
import { CityDefense } from "../city/cityDefense";
import { CombatSimulation, CombatSimulationSide } from "../combat";
import { CityAssessment, MapAnalysis } from "@/ai/utils/mapAnalysis";
import {
  AiDebugMapAnalysis,
  AiDebugMapAnalysisCityAssessment,
  AiDebugMapAnalysisTile,
} from "@/shared/debug";

export function gameToChannel(game: Game): GameChanneled {
  return {
    turn: game.turn,
    map: mapToChannel(game.map),
    players: game.players.map((p) => playerToChannel(p)),
    trackedPlayer: trackedPlayerToChannel(game.trackedPlayer),
    units: game.unitsManager.units.map((u) => unitToChannel(u)),
    cities: game.citiesManager.cities.map((c) => cityToChannel(c)),
  };
}

export function gameToGameStartInfo(game: Game): GameStartInfo {
  const unitToSelect = game.trackedPlayer.unitsWithoutOrders[0];
  const city = game.trackedPlayer.cities[0];
  let tileToGo = unitToSelect ? unitToSelect.tile : city ? city.tile : null;
  if (!tileToGo) {
    tileToGo = game.trackedPlayer.units[0]?.tile ?? null;
  }

  return {
    gameInfo: {
      mapWidth: game.map.width,
      mapHeight: game.map.height,
      aiOnly: game.players.every((p) => p.ai),
      turn: game.turn,
    },
    tileToGo: tileToGo ? tileToTileCoords(tileToGo) : null,
    unitIdToSelect: unitToSelect?.id ?? null,
    aiOnly: game.players.every((p) => p.ai),
  };
}

export function mapToChannel(map: TilesMapCore): MapChanneled {
  const tiles: TileChanneled[][] = [];
  for (let x = 0; x < map.width; x++) {
    const row: TileChanneled[] = [];
    tiles.push(row);
    for (let y = 0; y < map.height; y++) {
      row.push(tileToChannel(map.tiles[x][y]));
    }
  }

  return {
    width: map.width,
    height: map.height,
    tiles,
  };
}

export function tileToChannel(tile: TileCore): TileChanneled {
  return {
    id: tile.id,
    x: tile.x,
    y: tile.y,
    climate: tile.climate,
    forest: tile.forest,
    improvement: tile.improvement?.id ?? null,
    landForm: tile.landForm,
    riverParts: tile.riverParts,
    road: tile.road,
    seaLevel: tile.seaLevel,
    wetlands: tile.wetlands,
    yields: tile.yields,
    areaOf: tile.areaOf ? tile.areaOf.id : null,
    unitsIds: tile.units.map((u) => u.id),
    cityId: tile.city ? tile.city.id : null,
    cityType: tile.city ? tile.city.renderType : null,
    resource: tile.resource ? resourceToChannel(tile.resource) : null,
    roads: tile.fullNeighbours
      .map((n) => (!n || n.road === null ? "0" : "1"))
      .join(""),
    coasts: getCoasts(tile),
    playerColor: tile.areaOf?.player.nation.colors ?? null,
    fullNeighbours: tile.fullNeighbours.map((t) => t?.id ?? null),
    landFormNeighbours: tile.landFormNeighbours,
    river: tile.river,
    forestData: tile.forestData,
    roadData: tile.roadData,
  };
}

export function tileToTileOwnershipChannel(
  tile: TileCore,
  game: Game | null = null,
  fogOfWarEnabled: boolean = true,
): TileOwnershipChanneled {
  let borders = 0;
  let colors: NationColors | null = null;
  if (
    tile.areaOf &&
    (!game || !fogOfWarEnabled || game.trackedPlayer.exploredTiles.has(tile))
  ) {
    const player = tile.areaOf.player;
    colors = player.nation.colors;
    borders = tile.fullNeighbours.reduce<number>((acc, n, i) => {
      if (n && n.areaOf?.player !== player) {
        return acc | (1 << i);
      }
      return acc;
    }, 0);
  }

  return { ...tileToTileCoords(tile), colors, borders };
}

function getCoasts(tile: TileCore): string {
  if (tile.seaLevel === SeaLevel.none) {
    return "";
  }

  const coasts = tile.fullNeighbours
    .map((n) => (n && n.seaLevel === SeaLevel.none ? "1" : "0"))
    .join("");

  if (coasts === "00000000") {
    return "";
  }

  return coasts;
}

export function resourceToChannel(
  resource: ResourceDeposit,
): ResourceChanneled {
  return {
    id: resource.def.id,
    name: resource.def.name,
    quantity: resource.quantity,
  };
}

export function resourceWithTileToChannel(
  resource: ResourceDeposit,
): ResourceWithTileChanneled {
  return {
    id: resource.def.id,
    name: resource.def.name,
    quantity: resource.quantity,
    tile: tileToTileCoords(resource.tile),
  };
}

export function cityToChannel(city: CityCore): CityChanneled {
  return {
    id: city.id,
    visibilityLevel: city.getVisibilityFor(city.player.game.trackedPlayer),
    name: city.name,
    playerId: city.player.id,
    colors: city.player.nation.colors,
    tile: tileToTileCoords(city.tile),
    foodPerTurn: city.perTurn.food,

    size: city.population.total,
    totalFood: city.population.totalFood,
    foodToGrow: city.population.getFoodToGrow(),
    turnsToGrow: city.population.turnsToGrow,

    productionPerTurn: city.yields.production,
    totalProduction: city.production.totalProduction,
    productionRequired: city.production.product
      ? city.production.product.productionCost
      : null,
    turnsToProductionEnd: city.production.turnsToProductionEnd,
    productName: city.production.product ? city.production.product.name : null,

    defense: cityDefenseToChannel(city.defense),
  };
}

function cityDefenseToChannel(cityDefense: CityDefense): CityDefenseChanneled {
  return {
    maxHealth: cityDefense.maxHealth,
    currentHealth: cityDefense.health,
    strength: cityDefense.strength,
    defenseBonus: cityDefense.defenseBonus,
  };
}

export function cityDetailsToChannel(city: CityCore): CityDetailsChanneled {
  city.production.updateProductsList();

  return {
    id: city.id,
    visibilityLevel: city.getVisibilityFor(city.player.game.trackedPlayer),
    name: city.name,
    size: city.population.total,
    playerId: city.player.id,
    tile: tileToTileCoords(city.tile),
    perTurn: city.perTurn,
    tileYields: city.tileYields,
    yields: city.yields,
    colors: city.player.nation.colors,

    totalFood: city.population.totalFood,
    foodToGrow: city.population.getFoodToGrow(),
    turnsToGrow: city.population.turnsToGrow,
    foodConsumed: city.population.foodConsumed,

    totalProduction: city.production.totalProduction,
    turnsToProductionEnd: city.production.turnsToProductionEnd,
    buildings: city.production.buildings.map(buildingToChannel),
    availableProducts: [
      ...city.production.availableUnits,
      ...city.production.availableBuildings,
      ...city.production.availableIdleProducts,
    ].map((p) =>
      cityProductToChannel(city, p, city.production.disabledProducts),
    ),
    product: city.production.product
      ? cityProductToChannel(city, city.production.product)
      : null,

    cultureToExpand: city.expansion.getCultureToExpand(),
    tiles: Array.from(city.expansion.tiles).map(tileToTileCoords),
    totalCulture: city.expansion.totalCulture,
    turnsToExpand: city.expansion.turnsToExpand,

    workedTiles: Array.from(city.workers.workedTiles).map(
      tilesToTileCoordsWithNeighbours,
    ),
    storage: Array.from(city.storage.resources.entries()).map(
      ([resource, amount]) => ({
        resource: entityToMinimalChannel(resource),
        amount,
      }),
    ),
    defense: cityDefenseToChannel(city.defense),
  };
}

export function playerToChannel(player: PlayerCore): PlayerChanneled {
  return {
    id: player.id,
    name: player.nation.name,
    colors: player.nation.colors,
    isAi: !!player.ai,
  };
}

export function trackedPlayerToChannel(
  player: PlayerCore,
): TrackedPlayerChanneled {
  return {
    id: player.id,
    colors: player.nation.colors,
    exploredTiles: Array.from(player.exploredTiles).map(tileToTileCoords),
    visibleTiles: Array.from(player.visibleTiles).map(tileToTileCoords),
    units: player.units.map((u) => u.id),
    cities: player.cities.map((c) => c.id),
    yields: player.yields,
    isAi: !!player.ai,
  };
}

export function unitToChannel(unit: UnitCore): UnitChanneled {
  return {
    id: unit.id,
    name: unit.definition.name,
    type: unit.definition.strength > 0 ? "military" : "civilian",
    tile: tileToTileCoordsWithUnits(unit.tile),
    definitionId: unit.definition.id,
    colors: unit.player.nation.colors,
    parentId: unit.parent?.id || null,
    childrenIds: unit.children.map((c) => c.id),
    health: unit.health,
    supplies: unit.supplies,
    actionPointsLeft: unit.actionPointsLeft,
    playerId: unit.player.id,
    canControl: unit.player === unit.player.game.trackedPlayer,
    order: unit.order,
    actions:
      unit.actionPointsLeft === unit.definition.actionPoints
        ? "all"
        : unit.actionPointsLeft > 0
        ? "some"
        : "none",
  };
}

export function unitDetailsToChannel(unit: UnitCore): UnitDetailsChanneled {
  return {
    id: unit.id,
    type: unit.definition.strength > 0 ? "military" : "civilian",
    tile: tileToTileCoords(unit.tile),
    definition: unitDefToChannel(unit.definition),
    colors: unit.player.nation.colors,
    parentId: unit.parent?.id || null,
    childrenIds: unit.children.map((c) => c.id),
    actionPointsLeft: unit.actionPointsLeft,
    health: unit.health,
    supplies: unit.supplies,
    order: unit.order,
    path: unitToUnitPathChannelled(unit),
    isSupplied: unit.isSupplied,
    playerId: unit.player.id,
    canControl: unit.player === unit.player.game.trackedPlayer,
    actions: unit.definition.actions.filter((action) =>
      unit.checkActionRequirements(action),
    ),
  };
}

export function unitToUnitPathChannelled(
  unit: UnitCore,
): UnitPathChanneled | null {
  if (!unit.path) {
    return null;
  }

  const i = unit.path.length - 1;
  const lastTile = unit.path[i][unit.path[i].length - 1];

  return {
    turns: unit.path?.map((row) => row.map(tileToTileCoords)) || null,
    startTurn: unit.actionPointsLeft > 0 ? 0 : 1,
    endType: lastTile.getEnemyUnit(unit) ? "attack" : "move",
  };
}

export function unitMoveToChannel(
  unit: UnitCore,
  tiles: TileCore[],
): UnitMoveChanneled {
  return {
    unitId: unit.id,
    tiles: tiles.map(tileToTileCoordsWithUnits),
  };
}

export function tileDetailsToChannel(
  tile: TileCore,
  forPlayer: PlayerCore,
): TileDetailsChanneled {
  let units: UnitChanneled[] = [];
  if (forPlayer.visibleTiles.has(tile)) {
    units = tile.units.map((u) => unitToChannel(u));
  }
  return {
    ...tileToChannel(tile),
    zocPlayerId: tile.zocPlayer?.id ?? null,
    zocNoMansLand: tile.zocNoMansLand,
    isSupplied: tile.isSuppliedByPlayer(forPlayer),
    units,
    isExplored: forPlayer.exploredTiles.has(tile),
    passableArea: tile.passableArea?.id ?? null,
  };
}

export function tileToTileCoords(tile: TileCore): TileCoords {
  return { id: tile.id, x: tile.x, y: tile.y };
}

export function tileToFogOfWar(tile: TileCore, game: Game): TileFogOfWar {
  let visibleBorder = 0;
  let exploredBorder = 0;

  let status = FogOfWarStatus.unexplored;
  if (game.trackedPlayer.visibleTiles.has(tile)) {
    status = FogOfWarStatus.visible;
    for (let i = 0; i < tile.fullNeighbours.length; i++) {
      const n = tile.fullNeighbours[i];
      if (n && !game.trackedPlayer.visibleTiles.has(n)) {
        visibleBorder += 1 << i;
      }
      if (n && !game.trackedPlayer.exploredTiles.has(n)) {
        exploredBorder += 1 << i;
      }
    }
  } else if (game.trackedPlayer.exploredTiles.has(tile)) {
    status = FogOfWarStatus.explored;
    for (let i = 0; i < tile.fullNeighbours.length; i++) {
      const n = tile.fullNeighbours[i];
      if (n && !game.trackedPlayer.exploredTiles.has(n)) {
        exploredBorder += 1 << i;
      }
    }
  }

  return {
    id: tile.id,
    x: tile.x,
    y: tile.y,
    visibleBorder,
    exploredBorder,
    status,
  };
}

export function tileToTileCoordsWithUnits(tile: TileCore): TileCoordsWithUnits {
  return {
    ...tileToTileCoords(tile),
    units: tile.units.map((u) => {
      return { id: u.id, parentId: u.parent?.id ?? null };
    }),
  };
}

export function tilesToTileCoordsWithNeighbours(
  tile: TileCore,
): TilesCoordsWithNeighbours {
  return {
    ...tileToTileCoords(tile),
    fullNeighbours: tile.fullNeighbours.map((t) => t?.id ?? null),
  };
}

export function cityProductToChannel(
  city: CityCore,
  product: ProductDefinition,
  disabledProducts?: Set<ProductDefinition>,
): CityProductChanneled {
  return {
    enabled: disabledProducts ? !disabledProducts.has(product) : true,
    turnsToProduce:
      product.entityType === "idleProduct"
        ? Infinity
        : Math.ceil(product.productionCost / city.yields.production),
    definition: productToChannel(product),
  };
}

export function entityToMinimalChannel(entity: Entity): EntityMinimalChanneled {
  return {
    id: entity.id,
    name: entity.name,
    entityType: entity.entityType,
  };
}

export function techToChannel(entity: Technology): TechDefChanneled {
  return {
    id: entity.id,
    entityType: entity.entityType,
    name: entity.name,
    cost: entity.cost,
    requiredTechs: entity.requiredTechnologies.map((t) => t.id),
    unlocks: entity.unlocks.map(entityToMinimalChannel),
    era: entity.era,
    layout: entity.layout,
  };
}

export function knowledgeTechToChannel(
  knowledge: Knowledge,
  tech: Technology,
): TechKnowledgeChanneled {
  const accumulated = knowledge.accumulated.get(tech) ?? 0;
  return {
    def: techToChannel(tech),
    turns: knowledge.getTurnsToResearch(tech),
    state: knowledge.getTechState(tech),
    queuePosition: knowledge.getTechQueuePosition(tech),
    accumulated,
    nextAccumulated: accumulated + knowledge.player.yields.income.knowledge,
  };
}

export function unitDefToChannel(entity: UnitDefinition): UnitDefChanneled {
  return {
    id: entity.id,
    entityType: entity.entityType,
    name: entity.name,
    cost: entity.productionCost,
    technology: entity.technology
      ? entityToMinimalChannel(entity.technology)
      : null,
    actionPoints: entity.actionPoints,
    strength: entity.strength,
    capacity: entity.capacity,
  };
}

export function buildingToChannel(
  entity: Building | IdleProduct,
): BuildingChanneled {
  return {
    id: entity.id,
    entityType: entity.entityType,
    name: entity.name,
    cost: entity.productionCost,
    technology: entity.technology
      ? entityToMinimalChannel(entity.technology)
      : null,
    effects: entity.effects.map((e) => e.options),
  };
}

export function tileImprovementToChannel(
  entity: TileImprovementDefinition,
): TileImprovementChanneled {
  return {
    id: entity.id,
    entityType: entity.entityType,
    name: entity.name,
    technology: entity.technology
      ? entityToMinimalChannel(entity.technology)
      : null,
  };
}

export function resourceDefinitionToChannel(
  entity: ResourceDefinition,
): ResourceDefinitionChannel {
  return entityToMinimalChannel(entity) as ResourceDefinitionChannel;
}

export function productToChannel(entity: Entity): ProductChanneled {
  if (entity.entityType === "unit") {
    return unitDefToChannel(entity as UnitDefinition);
  }

  if (entity.entityType === "building") {
    return buildingToChannel(entity as Building);
  }

  if (entity.entityType === "idleProduct") {
    return buildingToChannel(entity as IdleProduct);
  }

  throw new Error(`Unknown entity type ${entity.entityType}`);
}

export function entityToChannel(entity: Entity): EntityChanneled {
  if (entity.entityType === "technology") {
    return techToChannel(entity as Technology);
  }

  if (entity.entityType === "tileImprovement") {
    return tileImprovementToChannel(entity as TileImprovementDefinition);
  }

  if (entity.entityType === "resource") {
    return resourceDefinitionToChannel(entity as ResourceDefinition);
  }

  return productToChannel(entity);
}

export function combatSimulationToChannel(
  simulation: CombatSimulation,
): CombatSimulationChanneled {
  return {
    attacker: combatSimulationSideToChannel(simulation.attacker),
    defender: combatSimulationSideToChannel(simulation.defender),
  };
}

function combatSimulationSideToChannel(
  side: CombatSimulationSide,
): CombatSimulationSideChanneled {
  const unit =
    side.combatant instanceof UnitCore ? unitToChannel(side.combatant) : null;
  const city =
    side.combatant instanceof CityDefense
      ? cityToChannel(side.combatant.city)
      : null;
  return {
    strength: side.strength,
    modifiers: side.modifiers,
    damage: side.damage,
    unit,
    city,
  };
}

export function cityToOverviewChanneled(city: CityCore): CityOverviewChanneled {
  return {
    id: city.id,
    name: city.name,
    population: city.population.total,
    yields: city.yields,
  };
}

export function unitToIdAndName(unit: UnitCore | null): UnitIdAndName | null {
  if (!unit) {
    return null;
  }
  return {
    id: unit.id,
    name: unit.definition.name,
  };
}

export function mapAnalysisToChannel(
  analysis: MapAnalysis,
): AiDebugMapAnalysis {
  const tiles: AiDebugMapAnalysisTile[] = [];
  for (const [tile, influence] of analysis.heatMap.influences.entries()) {
    tiles.push({
      tile: tileToTileCoords(tile),
      influence,
    });
  }

  return {
    tiles,
    attackTargets: analysis.attackTargets.map(cityAssessmentToChannel),
    defenseTargets: analysis.defenseTargets.map(cityAssessmentToChannel),
  };
}

export function cityAssessmentToChannel(
  cityAssessment: CityAssessment,
): AiDebugMapAnalysisCityAssessment {
  return {
    cityId: cityAssessment.city.id,
    cityName: cityAssessment.city.name,
    effort: cityAssessment.effort,
    value: cityAssessment.value,
    score: cityAssessment.score,
    distance: cityAssessment.distance,
    friendlyInfluence: cityAssessment.friendlyInfluence,
    enemyInfluence: cityAssessment.enemyInfluence,
  };
}
