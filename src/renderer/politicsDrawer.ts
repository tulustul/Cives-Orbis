import { bridge } from "@/bridge";
import { Container } from "pixi.js";
import { Area } from "./area";
import { mapUi } from "@/ui/mapUi";

export class PoliticsDrawer {
  areas = new Map<number, Area>();

  constructor(private container: Container) {
    bridge.areas.tilesAdded$.subscribe((bridgeArea) => {
      const area = this.areas.get(bridgeArea.id);
      if (area) {
        area.addTiles(bridgeArea.tiles);
      }
    });

    bridge.areas.tilesRemoved$.subscribe((bridgeArea) => {
      const area = this.areas.get(bridgeArea.id);
      if (area) {
        area.removeTiles(bridgeArea.tiles);
      }
    });

    bridge.game.start$.subscribe(() => this.build());

    mapUi.destroyed$.subscribe(() => this.clear());
  }

  async build() {
    this.clear();

    const areas = await bridge.areas.getAll();

    for (const bridgeArea of areas) {
      const area = new Area({
        color: bridgeArea.color,
        container: this.container,
        backgroundOpacity: 0.5,
        borderShadow: 0.7,
        borderSize: 0.08,
        borderShadowStrength: 1,
        visibleOnWater: false,
      });

      this.areas.set(bridgeArea.id, area);
      area.setTiles(bridgeArea.tiles);
    }
  }

  clear() {
    for (const area of this.areas.values()) {
      area.clear();
    }
    this.areas.clear();
  }
}
