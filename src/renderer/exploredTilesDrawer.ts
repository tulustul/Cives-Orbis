import { bridge } from "@/bridge";
import { Container } from "pixi.js";
import { HexDrawer } from "./hexDrawer";

export class ExploredTilesDrawer {
  private hexDrawer: HexDrawer;

  constructor(private container: Container) {
    this.hexDrawer = new HexDrawer(this.container);

    bridge.tiles.showedAdded$.subscribe((tiles) =>
      this.hexDrawer.addTiles(tiles)
    );

    bridge.player.tracked$.subscribe(() => this.bindToTrackedPlayer());

    bridge.game.start$.subscribe(() => this.bindToTrackedPlayer());
  }

  clear() {
    this.hexDrawer.clear();
  }

  private async bindToTrackedPlayer() {
    const exploredTiles = await bridge.tiles.getAllExplored();
    this.hexDrawer.setTiles(exploredTiles.tiles);
  }
}
