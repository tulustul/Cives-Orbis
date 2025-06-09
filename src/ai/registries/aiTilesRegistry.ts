import { PlayerCore } from "@/core/player";
import { TileCore } from "@/core/tile";
import { TileAssignmentType } from "@/shared";

type TileAssignment = {
  tile: TileCore;
  types: Set<TileAssignmentType>;
};

type TileExclusion = {
  tile: TileCore;
  type: TileAssignmentType;
  turn: number;
  duration: number;
};

function emptyTilesByAssignmentSets(): Record<
  TileAssignmentType,
  Set<TileCore>
> {
  return {
    exploration: new Set(),
    transport: new Set(),
    settling: new Set(),
    working: new Set(),
  };
}

function emptyTilesExclusion(): Record<
  TileAssignmentType,
  Map<TileCore, TileExclusion>
> {
  return {
    exploration: new Map(),
    transport: new Map(),
    settling: new Map(),
    working: new Map(),
  };
}

export class AiTilesRegistry {
  byAssignment: Record<TileAssignmentType, Set<TileCore>> =
    emptyTilesByAssignmentSets();

  assignments = new Map<TileCore, TileAssignment>();

  exclusionsByType = emptyTilesExclusion();

  constructor(private player: PlayerCore) {}

  update() {
    const turn = this.player.game.turn;
    for (const exclusions of Object.values(this.exclusionsByType)) {
      for (const [tile, exclusion] of exclusions.entries()) {
        if (turn >= exclusion.turn + exclusion.duration) {
          exclusions.delete(tile);
        }
      }
    }
  }

  assign(tile: TileCore | undefined | null, type: TileAssignmentType) {
    if (!tile) {
      return;
    }
    this.byAssignment[type].add(tile);
    if (!this.assignments.has(tile)) {
      this.assignments.set(tile, { tile, types: new Set() });
    }
    this.assignments.get(tile)!.types.add(type);
  }

  unassign(tile: TileCore | undefined | null, type: TileAssignmentType) {
    if (!tile) {
      return;
    }
    this.byAssignment[type].delete(tile);
    const types = this.assignments.get(tile)?.types;
    if (types) {
      types.delete(type);
      if (types.size === 0) {
        this.assignments.delete(tile);
      }
    }
  }

  exclude(tile: TileCore | undefined | null, type: TileAssignmentType) {
    if (!tile) {
      return;
    }
    this.exclusionsByType[type].set(tile, {
      tile,
      type,
      turn: this.player.game.turn,
      duration: 10,
    });
  }

  isExcluded(tile: TileCore, type: TileAssignmentType): boolean {
    return !!this.exclusionsByType[type].get(tile);
  }

  // serialize(): AiDebugTilesRegistry {
  //   return {
  //     tiles: Array.from(this.assignments.values()).map((assignment) => {
  //       return {
  //         tile: tileToTileCoords(assignment.tile),
  //         type
  //       };
  //     }

  //     )
  //   }
  // }
}
