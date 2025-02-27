import { mapUi } from "@/ui/mapUi";
import { Container } from "pixi.js";
import { HexDrawer } from "./hexDrawer";

export class CityFocusDrawer {
  private hexDrawer: HexDrawer;

  constructor(private container: Container) {
    this.hexDrawer = new HexDrawer(this.container);

    mapUi.selectedCity$.subscribe((city) => {
      if (!city) {
        this.hexDrawer.setTiles([]);
        return;
      }
      this.hexDrawer.setTiles(city.tiles);
    });
  }

  clear() {
    this.hexDrawer.clear();
  }
}
