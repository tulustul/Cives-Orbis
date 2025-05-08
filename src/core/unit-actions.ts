import { isImprovementPossible, isRoadPossible } from "../shared";
import { collector } from "./collector";
import { TileImprovementDefinition } from "./data/types";
import { dataManager } from "./data/dataManager";
import { Game } from "./game";
import { cityToChannel } from "./serialization/channel";
import { TileRoad } from "./tile-improvements";
import { UnitCore } from "./unit";

export type UnitAction =
  | "foundCity"
  | "buildRoad"
  | "buildFarm"
  | "buildMine"
  | "buildLumbermill"
  | "buildQuarry"
  | "buildIrrigation"
  | "buildClayPit"
  | "buildPlantation"
  | "buildPasture"
  | "buildHuntingGround"
  | "buildCottage"
  | "buildFishery";

export abstract class ActionRequirement {
  id = "";

  constructor() {}

  abstract check(unit: UnitCore, action: UnitAction): boolean;
}

export class NotForeignTileRequirement extends ActionRequirement {
  override id = "notForeignTile";

  check(unit: UnitCore) {
    return !unit.tile.areaOf || unit.tile.areaOf?.player === unit.player;
  }
}

export class IsImprovementPossibleRequirement extends ActionRequirement {
  override id = "improvementPossible";

  constructor(public improvement: TileImprovementDefinition) {
    super();
  }

  check(unit: UnitCore) {
    return isImprovementPossible(unit.player, unit.tile, this.improvement);
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

function buildImprovement(
  unit: UnitCore,
  improvement: TileImprovementDefinition,
) {
  unit.actionPointsLeft = 0;
  unit.tile.improvement = improvement;
  unit.tile.update();
  unit.player.updateUnitsWithoutOrders();
}

function buildRoad(unit: UnitCore) {
  unit.actionPointsLeft = 0;
  unit.tile.road = TileRoad.road;
  unit.tile.updateWithNeighbours();
  unit.player.updateUnitsWithoutOrders();
}

function buildImprovementActions(): Partial<
  Record<UnitAction, ActionDefinition>
> {
  const actions: Partial<Record<UnitAction, ActionDefinition>> = {};

  for (const impr of dataManager.tileImprovements.all) {
    actions[impr.action] = {
      action: impr.action,
      name: impr.name,
      fn: (_, unit) => buildImprovement(unit, impr),
      requirements: [new IsImprovementPossibleRequirement(impr)],
    };
  }

  return actions;
}

export let ACTIONS: Record<UnitAction, ActionDefinition> = {
  foundCity: {
    action: "foundCity",
    name: "Found a city",
    fn: foundCity,
    requirements: [new NotForeignTileRequirement()], // TODO add minimal distance to other city
  },
  buildRoad: {
    action: "buildRoad",
    name: "Road",
    fn: (_, unit) => buildRoad(unit),
    requirements: [new NoRoadRequirement(), new isRoadPossibleRequirement()],
  },
} as Partial<Record<UnitAction, ActionDefinition>> as Record<
  UnitAction,
  ActionDefinition
>;

extendActions();

async function extendActions() {
  await dataManager.ready;
  ACTIONS = {
    ...ACTIONS,
    ...buildImprovementActions(),
  };
}
