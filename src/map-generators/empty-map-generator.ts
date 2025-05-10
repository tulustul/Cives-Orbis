import { MapGenerator } from "./types";
import { TilesMapCore } from "@/core/tiles-map";

export class BaseMapGenerator implements MapGenerator {
  generate(width: number, height: number) {
    return new TilesMapCore(width, height);
  }

  getStartingLocations() {
    return [];
  }
}
