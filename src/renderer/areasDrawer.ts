import { bridge } from "@/bridge";
import { UnitTrait } from "@/core/data.interface";
import {
  CityDetailsChanneled,
  UnitDetailsChanneled,
} from "@/core/serialization/channel";
import { programs as suppliesPrograms } from "@/renderer/shaders/supplies-shaders";
import { mapUi } from "@/ui/mapUi";
import { Container } from "pixi.js";
import { Area } from "./area";

export class AreasDrawer {
  unitRangeArea: Area;
  cityRangeArea: Area;
  cityBordersOnlyArea: Area;
  cityWorkedTilesArea: Area;
  cityNotWorkedTilesArea: Area;
  editorArea: Area;
  suppliesRangeArea: Area;

  constructor(private container: Container) {
    this.unitRangeArea = new Area({
      color: 0xddffdd,
      container: this.container,
      backgroundOpacity: 0.15,
      borderShadow: 0.4,
      borderSize: 0.0,
      borderShadowStrength: 2,
      visibleOnWater: true,
    });

    this.cityRangeArea = new Area({
      color: 0xffffff,
      container: this.container,
      backgroundOpacity: 0.2,
      borderShadow: 0.3,
      borderSize: 0.1,
      borderShadowStrength: 1.2,
      visibleOnWater: false,
    });

    this.cityBordersOnlyArea = new Area({
      color: 0xffffff,
      container: this.container,
      backgroundOpacity: 0,
      borderShadow: 0.3,
      borderSize: 0.1,
      borderShadowStrength: 1.2,
      visibleOnWater: false,
    });

    this.cityWorkedTilesArea = new Area({
      color: 0xffa001,
      container: this.container,
      backgroundOpacity: 0.2,
      borderShadow: 0.8,
      borderSize: 0,
      borderShadowStrength: 1,
      visibleOnWater: true,
    });

    this.cityNotWorkedTilesArea = new Area({
      color: 0xffffff,
      container: this.container,
      backgroundOpacity: 0.2,
      borderShadow: 0.3,
      borderSize: 0,
      borderShadowStrength: 1.5,
      visibleOnWater: false,
    });

    this.editorArea = new Area({
      color: 0xffffff,
      container: this.container,
      backgroundOpacity: 0.25,
      borderShadow: 0.5,
      borderSize: 0.05,
      borderShadowStrength: 1,
      visibleOnWater: true,
    });

    this.suppliesRangeArea = new Area({
      color: 0xffffff,
      container: this.container,
      backgroundOpacity: 0.25,
      borderShadow: 0.5,
      borderSize: 0.05,
      borderShadowStrength: 1,
      visibleOnWater: true,
      programs: suppliesPrograms,
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
    this.cityBordersOnlyArea.clear();
    this.cityWorkedTilesArea.clear();
    this.cityNotWorkedTilesArea.clear();
  }

  private async onHoveredCity(cityId: number | null) {
    if (cityId === null) {
      this.cityWorkedTilesArea.clear();
      this.cityNotWorkedTilesArea.clear();
      this.cityBordersOnlyArea.clear();
      this.cityRangeArea.clear();
      return;
    }

    const cityRange = await bridge.cities.getRange(cityId);
    if (cityRange) {
      this.cityRangeArea.setTiles(cityRange.tiles);
      this.cityWorkedTilesArea.setTiles(cityRange.workedTiles);
    }
  }

  private async onSelectedCity(city: CityDetailsChanneled | null) {
    this.cityRangeArea.setTiles([]);
    this.cityWorkedTilesArea.setTiles(city?.workedTiles || []);
  }

  private async onSelectedUnit(unit: UnitDetailsChanneled | null) {
    if (!unit) {
      this.unitRangeArea.clear();
      return;
    }

    if (unit.trait === UnitTrait.military || unit.trait === UnitTrait.supply) {
      bridge.player.getSuppliedTiles(unit.playerId).then((tiles) => {
        this.suppliesRangeArea.setTiles(tiles);
      });
    }

    bridge.units
      .getRange(unit.id)
      .then((tiles) => this.unitRangeArea.setTiles(tiles));
  }
}
