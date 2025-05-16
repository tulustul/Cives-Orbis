import { Yields } from "@/shared";
import { ResourceDefinition } from "./data/types";
import { PlayerCore } from "./player";
import { TileCore } from "./tile";
import { EMPTY_YIELDS } from "./yields";

export class PlayerResources {
  resourcesDifficulty = new Map<ResourceDefinition, number>();
  knownResources = new Set<ResourceDefinition>();

  constructor(public player: PlayerCore) {}
}

export type ResourceDepositOptions = {
  def: ResourceDefinition;
  tile: TileCore;
  quantity: number;
  difficulty: number;
};

export class ResourceDeposit {
  yields?: Yields;

  resourceProduction = 0;

  static from(options: ResourceDepositOptions) {
    return new ResourceDeposit(
      options.def,
      options.tile,
      options.quantity,
      options.difficulty,
    );
  }

  constructor(
    public def: ResourceDefinition,
    public tile: TileCore,
    public quantity: number,
    public difficulty: number,
  ) {}

  computeYields() {
    if (!this.def.depositDef) {
      return;
    }

    let resourceYields: Partial<Yields> | undefined;

    if (this.tile.improvement === this.def.depositDef.requiredImprovement) {
      resourceYields = this.def.depositDef.yieldsWhenWorked;
    } else {
      resourceYields = this.def.depositDef.yields;
    }

    this.yields = { ...EMPTY_YIELDS, ...resourceYields };
  }
}
