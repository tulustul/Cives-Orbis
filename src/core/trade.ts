import { Yields } from "@/shared";

import { CityCore } from "./city";
import { TileCore } from "./tile";
import { EMPTY_YIELDS } from "./yields";
import { UnitCore } from "./unit";

export class TradeManager {
  routes: TradeRoute[] = [];

  // private graph = new TradeGraph();

  getAvailableRoutes(_: CityCore): TradeRoute[] {
    return [];
  }

  establishRoute(_: TradeRoute): void {}

  deleteRoute(_: TradeRoute): void {}

  pillage(_: TradeRoute, __: UnitCore): void {}

  nextTurn() {}
}

export class TradeGraph {
  nodes!: TradeNode[];
  nodesMap = new Map<CityCore, TradeNode>();

  findRoute(_: CityCore, __: CityCore): TradeRoute | null {
    return null;
  }

  addNode(_: CityCore) {}

  removeNode(_: CityCore) {}

  balance() {}
}

export class TradeRoute {
  edges!: TradeEdge[];
}

export class TradeNode {
  city!: CityCore;
  edges!: TradeEdge;
}

export class TradeEdge {
  path: TileCore[];

  routes: TradeRoute[] = [];

  toAGoods: TradeGoods[] = [];
  toBGoods: TradeGoods[] = [];

  constructor(public nodeA: CityCore, public nodeB: CityCore) {
    this.path = this.buildPath();
  }

  buildPath(): TileCore[] {
    return [];
  }

  addRoute(_: TradeRoute) {}

  removeRoute(_: TradeRoute) {}

  computeGoods() {}
}

export class TradeGoods {
  from!: CityCore;

  yields: Yields = { ...EMPTY_YIELDS };

  // TODO resources, culture, faith, nation, science, slavery.
}
