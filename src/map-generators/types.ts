import { TilesMapCore } from "@/core/tiles-map";
import { TileCore } from "@/core/tile";

export interface MapGenerator {
  generate(width: number, height: number): TilesMapCore;
  getStartingLocations(): TileCore[];
}
