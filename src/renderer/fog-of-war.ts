import { bridge } from "@/bridge";
import { Container } from "pixi.js";
import { HexDrawer } from "./hexDrawer";
import { mapUi } from "@/ui/mapUi";

export class FogOfWarDrawer {
  private hexDrawer: HexDrawer;

  constructor(private container: Container) {
    this.hexDrawer = new HexDrawer(this.container);

    bridge.tiles.showed$.subscribe(() => this.bindToTrackedPlayer());

    bridge.tiles.showedAdded$.subscribe((tiles) =>
      this.hexDrawer.addTiles(tiles)
    );

    bridge.player.tracked$.subscribe(() => this.bindToTrackedPlayer());

    bridge.game.start$.subscribe(() => this.bindToTrackedPlayer());

    mapUi.destroyed$.subscribe(() => this.clear());
  }

  clear() {
    this.hexDrawer.clear();
  }

  private async bindToTrackedPlayer() {
    const visibleTiles = await bridge.tiles.getAllVisible();
    this.hexDrawer.clear();
    this.hexDrawer.setTiles(visibleTiles);
  }
}
