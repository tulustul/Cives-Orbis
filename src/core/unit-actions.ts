import { Game } from "./game";
import { UnitCore } from "./unit";
import {
  TileImprovement,
  TileRoad,
  IMPROVEMENT_PUBLIC_WORKS_COSTS,
  IMPROVEMENT_PUBLIC_WORKS_COSTS_PER_TURN,
  ROAD_PUBLIC_WORKS_COSTS,
  ROAD_PUBLIC_WORKS_COSTS_PER_TURN,
} from "./tile-improvements";
import { isImprovementPossible, isRoadPossible } from "../shared";
import { collector } from "./collector";
import { cityToChannel } from "./serialization/channel";

export type UnitAction =
  | "foundCity"
  | "buildRoad"
  | "buildFarm"
  | "buildMine"
  | "buildSawmill";

const ACTION_TO_IMPROVEMENT: Partial<Record<UnitAction, TileImprovement>> = {
  buildFarm: TileImprovement.farm,
  buildMine: TileImprovement.mine,
  buildSawmill: TileImprovement.sawmill,
};

export function getPublicWorksRequired(action: UnitAction) {
  if (action === "buildRoad") {
    return ROAD_PUBLIC_WORKS_COSTS[TileRoad.road];
  }
  const improvement = ACTION_TO_IMPROVEMENT[action];
  if (improvement !== undefined) {
    return IMPROVEMENT_PUBLIC_WORKS_COSTS[improvement];
  }
  return 0;
}

export function getPublicWorksPerTurn(action: UnitAction) {
  if (action === "buildRoad") {
    return ROAD_PUBLIC_WORKS_COSTS_PER_TURN[TileRoad.road];
  }
  const improvement = ACTION_TO_IMPROVEMENT[action];
  if (improvement !== undefined) {
    return IMPROVEMENT_PUBLIC_WORKS_COSTS_PER_TURN[improvement];
  }
  return 0;
}

export abstract class ActionRequirement {
  id = "";

  constructor() {}

  abstract check(unit: UnitCore, action: UnitAction): boolean;
}

export class OwnTileRequirement extends ActionRequirement {
  override id = "ownTile";

  check(unit: UnitCore) {
    return unit.tile.areaOf?.player === unit.player;
  }
}

export class NotForeignTileRequirement extends ActionRequirement {
  override id = "notForeignTile";

  check(unit: UnitCore) {
    return !unit.tile.areaOf || unit.tile.areaOf?.player === unit.player;
  }
}

export class ImprovementNotYetBuiltRequirement extends ActionRequirement {
  override id = "sameImprovement";

  constructor(public improvement: TileImprovement) {
    super();
  }

  check(unit: UnitCore) {
    return !unit.tile.city && unit.tile.improvement !== this.improvement;
  }
}
export class IsImprovementPossibleRequirement extends ActionRequirement {
  override id = "improvementPossible";

  constructor(public improvement: TileImprovement) {
    super();
  }

  check(unit: UnitCore) {
    return isImprovementPossible(unit.tile, this.improvement);
  }
}

export class NoRoadRequirement extends ActionRequirement {
  override id = "noRoad";

  check(unit: UnitCore) {
    return unit.tile.road === null;
  }
}

export class isRoadPossibleRequirement extends ActionRequirement {
  override id = "roadPossible";

  check(unit: UnitCore) {
    return isRoadPossible(unit.tile);
  }
}

export class PublicWorksPointsRequirement extends ActionRequirement {
  override id = "publicWorks";

  check(unit: UnitCore, action: UnitAction) {
    return (
      unit.player.yields.total.publicWorks >= getPublicWorksRequired(action)
    );
  }
}

interface ActionDefinition {
  action: UnitAction;
  name: string;
  fn: (game: Game, unit: UnitCore) => void;
  requirements: ActionRequirement[];
}

function foundCity(game: Game, unit: UnitCore) {
  const city = game.citiesManager.spawn(unit.tile, unit.player);
  if (city) {
    game.unitsManager.destroy(unit);
    collector.changes.push({ type: "city.spawned", data: cityToChannel(city) });
  }
}

function buildImprovement(unit: UnitCore, improvement: TileImprovement) {
  unit.actionPointsLeft = 0;
  unit.tile.improvement = improvement;
  unit.tile.update();
  unit.player.updateUnitsWithoutOrders();

  unit.player.yields.total.publicWorks -=
    IMPROVEMENT_PUBLIC_WORKS_COSTS[improvement];

  unit.player.yields.costs.publicWorks +=
    IMPROVEMENT_PUBLIC_WORKS_COSTS_PER_TURN[improvement];

  unit.player.yields.perTurn.publicWorks -=
    IMPROVEMENT_PUBLIC_WORKS_COSTS_PER_TURN[improvement];
}

function buildRoad(unit: UnitCore) {
  unit.actionPointsLeft = 0;
  unit.tile.road = TileRoad.road;
  unit.tile.update();
  for (const neighbour of unit.tile.neighbours) {
    neighbour.update();
  }
  unit.player.updateUnitsWithoutOrders();

  unit.player.yields.total.publicWorks -=
    ROAD_PUBLIC_WORKS_COSTS[TileRoad.road];

  unit.player.yields.costs.publicWorks +=
    ROAD_PUBLIC_WORKS_COSTS_PER_TURN[TileRoad.road];

  unit.player.yields.perTurn.publicWorks -=
    ROAD_PUBLIC_WORKS_COSTS_PER_TURN[TileRoad.road];
}

export const ACTIONS: Record<UnitAction, ActionDefinition> = {
  foundCity: {
    action: "foundCity",
    name: "Found a city",
    fn: foundCity,
    requirements: [new NotForeignTileRequirement()], // TODO add minimal distance to other city
  },
  buildFarm: {
    action: "buildFarm",
    name: "Farm",
    fn: (_, unit) => buildImprovement(unit, TileImprovement.farm),
    requirements: [
      new OwnTileRequirement(),
      new ImprovementNotYetBuiltRequirement(TileImprovement.farm),
      new IsImprovementPossibleRequirement(TileImprovement.farm),
      // new PublicWorksPointsRequirement(),
    ],
  },
  buildMine: {
    action: "buildMine",
    name: "Mine",
    fn: (_, unit) => buildImprovement(unit, TileImprovement.mine),
    requirements: [
      new OwnTileRequirement(),
      new ImprovementNotYetBuiltRequirement(TileImprovement.mine),
      new IsImprovementPossibleRequirement(TileImprovement.mine),
      // new PublicWorksPointsRequirement(),
    ],
  },
  buildSawmill: {
    action: "buildSawmill",
    name: "Sawmill",
    fn: (_, unit) => buildImprovement(unit, TileImprovement.sawmill),
    requirements: [
      new OwnTileRequirement(),
      new ImprovementNotYetBuiltRequirement(TileImprovement.sawmill),
      new IsImprovementPossibleRequirement(TileImprovement.sawmill),
      // new PublicWorksPointsRequirement(),
    ],
  },
  buildRoad: {
    action: "buildRoad",
    name: "Road",
    fn: (_, unit) => buildRoad(unit),
    requirements: [
      new NoRoadRequirement(),
      new isRoadPossibleRequirement(),
      // new PublicWorksPointsRequirement(),
    ],
  },
};
