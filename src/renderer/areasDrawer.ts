import { bridge } from "@/bridge";
import { CityDetailsChanneled, UnitGroupDetailsChanneled } from "@/shared";
import { mapUi } from "@/ui/mapUi";
import { Container } from "pixi.js";
import { Area } from "./area";

export class AreasDrawer {
  unitRangeArea: Area;
  cityRangeArea: Area;
  cityWorkedTilesArea: Area;
  cityBlockedTilesArea: Area;
  cityNotWorkedTilesArea: Area;
  districtAvailableTiles: Area;
  editorArea: Area;

  constructor(private container: Container) {
    this.unitRangeArea = new Area({
      color: "#ddffdd",
      container: this.container,
      backgroundOpacity: 0.15,
      shadowSize: 0.3,
      borderSize: 0.0,
      shadowStrength: 2.0,
      visibleOnWater: true,
    });

    this.cityRangeArea = new Area({
      color: "#ffffff",
      container: this.container,
      backgroundOpacity: 0.2,
      shadowSize: 0.3,
      borderSize: 0.04,
      shadowStrength: 1.2,
      visibleOnWater: false,
    });

    this.cityWorkedTilesArea = new Area({
      color: "#ffa001",
      container: this.container,
      backgroundOpacity: 0.2,
      shadowSize: 0.8,
      borderSize: 0,
      shadowStrength: 1,
      visibleOnWater: true,
    });

    this.cityBlockedTilesArea = new Area({
      color: "#ff0000",
      container: this.container,
      backgroundOpacity: 0.2,
      shadowSize: 0.8,
      borderSize: 0,
      shadowStrength: 1,
      visibleOnWater: true,
    });

    this.cityNotWorkedTilesArea = new Area({
      color: "#ffffff",
      container: this.container,
      backgroundOpacity: 0.2,
      shadowSize: 0.3,
      borderSize: 0,
      shadowStrength: 3.5,
      visibleOnWater: false,
    });

    this.districtAvailableTiles = new Area({
      color: "#33ff33",
      container: this.container,
      backgroundOpacity: 0.2,
      shadowSize: 0.3,
      borderSize: 0,
      shadowStrength: 3.5,
      visibleOnWater: true,
    });

    this.editorArea = new Area({
      color: "#ffffff",
      container: this.container,
      backgroundOpacity: 0.25,
      shadowSize: 0.5,
      borderSize: 0.05,
      shadowStrength: 1,
      visibleOnWater: true,
    });

    mapUi.selectedCity$.subscribe((city) => this.onSelectedCity(city));
    mapUi.hoveredCity$.subscribe((city) => this.onHoveredCity(city));
    mapUi.selectedUnit$.subscribe((unit) => this.onSelectedUnit(unit));
    mapUi.destroyed$.subscribe(() => this.clear());

    bridge.game.start$.subscribe(() => this.clear());
  }

  destroy() {
    this.clear();
    this.container.destroy();
  }

  clear() {
    this.editorArea.clear();
    this.cityRangeArea.clear();
    this.unitRangeArea.clear();
    this.cityWorkedTilesArea.clear();
    this.cityBlockedTilesArea.clear();
    this.cityNotWorkedTilesArea.clear();
    this.districtAvailableTiles.clear();
  }

  private async onHoveredCity(cityId: number | null) {
    if (mapUi.selectedCity) {
      return;
    }
    if (cityId === null) {
      this.cityWorkedTilesArea.clear();
      this.cityBlockedTilesArea.clear();
      this.cityNotWorkedTilesArea.clear();
      this.cityRangeArea.clear();
      return;
    }

    const cityRange = await bridge.cities.getRange(cityId);
    if (cityRange) {
      this.cityRangeArea.setTiles(cityRange.tiles);
      this.cityWorkedTilesArea.setTiles(cityRange.workedTiles);
      this.cityBlockedTilesArea.setTiles(cityRange.blockedTiles);
    }
  }

  async onSelectedCity(city: CityDetailsChanneled | null) {
    this.cityRangeArea.setTiles([]);
    this.cityWorkedTilesArea.setTiles(city?.workedTiles || []);
    this.cityBlockedTilesArea.setTiles(city?.blockedTiles || []);
  }

  private async onSelectedUnit(unit: UnitGroupDetailsChanneled | null) {
    if (!unit) {
      this.unitRangeArea.clear();
      return;
    }

    bridge.units
      .getRange(unit.id)
      .then((tiles) => this.unitRangeArea.setTiles(tiles));
  }
}
