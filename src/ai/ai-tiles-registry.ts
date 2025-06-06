import { TileCore } from "@/core/tile";
import { TileAssignmentType } from "@/shared";

type TileAssignment = {
  tile: TileCore;
  types: Set<TileAssignmentType>;
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

export class AiTilesRegistry {
  byAssignment: Record<TileAssignmentType, Set<TileCore>> =
    emptyTilesByAssignmentSets();

  assignments = new Map<TileCore, TileAssignment>();

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
}
