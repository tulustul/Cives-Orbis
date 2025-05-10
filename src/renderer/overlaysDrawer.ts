import { Graphics, Container } from "pixi.js";

import { drawClosedHex, drawHex, getTileCoords } from "./utils";
import { mapUi } from "@/ui/mapUi";
import { TileCoords } from "@/core/serialization/channel";

export class OverlaysDrawer {
  hoveredTileGraphics = new Graphics();

  selectedTileGraphics = new Graphics();

  highlightedTilesGraphics = new Graphics();

  constructor(public container: Container) {
    this.container.addChild(this.hoveredTileGraphics);
    this.container.addChild(this.selectedTileGraphics);

    this.buildHoveredTileGraphics();
    this.buildSelectedTileGraphics();

    mapUi.hoveredTile$.subscribe((tile) =>
      this.displayAtTile(this.hoveredTileGraphics, tile),
    );

    mapUi.selectedTile$.subscribe((tile) => {
      this.displayAtTile(this.selectedTileGraphics, tile);
    });

    mapUi.destroyed$.subscribe(() => this.clear());
  }

  private displayAtTile(obj: Container, tile: TileCoords | null) {
    if (tile) {
      const [x, y] = getTileCoords(tile);
      obj.position.x = x;
      obj.position.y = y;
      obj.visible = true;
    } else {
      obj.visible = false;
    }
  }

  buildHoveredTileGraphics() {
    drawClosedHex(this.hoveredTileGraphics);
    this.hoveredTileGraphics.fill({ color: 0xffffff, alpha: 0.1 }).stroke({
      width: 0.02,
      color: 0xffffff,
      alpha: 0.5,
    });
  }

  buildSelectedTileGraphics() {
    drawClosedHex(this.selectedTileGraphics);
    this.selectedTileGraphics.stroke({
      width: 0.05,
      color: 0xff0000,
      alpha: 0.5,
    });
  }

  buildHighlightedTiles(tiles: Set<TileCoords>) {
    this.highlightedTilesGraphics.clear();
    if (!tiles.size) {
      this.container.removeChild(this.highlightedTilesGraphics);
      return;
    }

    const g = this.highlightedTilesGraphics;
    for (const tile of tiles) {
      const [x, y] = getTileCoords(tile);

      drawHex(g, x, y);
      g.fill({ color: 0xffffff, alpha: 0.3 });
    }

    this.container.addChild(g);
  }

  clear() {
    this.highlightedTilesGraphics.clear();
    this.hoveredTileGraphics.visible = false;
    this.selectedTileGraphics.visible = false;
  }
}
