import { TileCoords } from "@/shared";
import { mapUi } from "@/ui/mapUi";
import { Container } from "pixi.js";
import { HexDrawer } from "./hexDrawer";

export class CityFocusDrawer {
  private hexDrawer: HexDrawer<TileCoords>;

  constructor(private container: Container) {
    this.hexDrawer = new HexDrawer(this.container);

    mapUi.selectedCity$.subscribe((city) => {
      if (!city) {
        this.hexDrawer.setTiles([]);
        return;
      }
      this.hexDrawer.setTiles(city.tiles);
    });

    mapUi.destroyed$.subscribe(() => this.clear());
  }

  clear() {
    this.hexDrawer.clear();
  }
}
