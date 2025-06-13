import { getMoveCost, getMoveResult, MoveResult } from "./movement";
import { PlayerCore } from "./player";
import { TileCore } from "./tile";
import { UnitCore } from "./unit";
import { UnitsManager } from "./unit-manager";

export class UnitGroup {
  id!: number;
  actionPointsLeft = 0;
  path: TileCore[][] | null = null;
  units: UnitCore[] = [];
  zoc: TileCore[] = [];

  constructor(
    public tile: TileCore,
    public player: PlayerCore,
    private unitManager: UnitsManager,
  ) {}

  getRange(): Set<TileCore> {
    const result = new Set<TileCore>([this.tile]);
    const actionPointsLeftAtTile = new Map<TileCore, number>();

    this._getRange(
      this.tile,
      this.actionPointsLeft,
      result,
      actionPointsLeftAtTile,
    );

    if (result.size === 1) {
      result.delete(this.tile);
    }

    return result;
  }

  private _getRange(
    tile = this.tile,
    actionPointsLeft = this.actionPointsLeft,
    result: Set<TileCore>,
    actionPointsLeftAtTile: Map<TileCore, number>,
  ) {
    if (actionPointsLeft <= 0) {
      return result;
    }

    for (const neighbour of tile.neighbours) {
      const moveResult = getMoveResult(this, tile, neighbour);
      const cost = getMoveCost(this, moveResult, tile, neighbour);

      if (moveResult === MoveResult.none) {
        continue;
      }

      const oldActionPointsLeft = actionPointsLeftAtTile.get(neighbour);
      const newActionPointsLeft = actionPointsLeft - cost;

      if (!oldActionPointsLeft || newActionPointsLeft > oldActionPointsLeft) {
        actionPointsLeftAtTile.set(neighbour, newActionPointsLeft);

        result.add(neighbour);

        if (moveResult !== MoveResult.attack) {
          this._getRange(
            neighbour,
            newActionPointsLeft,
            result,
            actionPointsLeftAtTile,
          );
        }
      }
    }

    return result;
  }

  destroy() {
    this.actionPointsLeft = 0;
    this.unitManager.destroy(this);
  }

  getVisibleTiles(): Set<TileCore> {
    return this.tile.getTilesInRange(2);
  }
}
