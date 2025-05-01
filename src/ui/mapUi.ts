import { bridge } from "@/bridge";
import {
  CityDetailsChanneled,
  TileCoords,
  TileDetailsChanneled,
  TileHoverDetails,
  UnitChanneled,
  UnitDetailsChanneled,
  UnitPathChanneled,
} from "@/core/serialization/channel";
import { camera } from "@/renderer/camera";
import { BehaviorSubject, Subject } from "rxjs";
import { distinctUntilChanged, map } from "rxjs/operators";
import { nextTurnService } from "./nextTurn";

export class MapUi {
  private _destroyed$ = new Subject<void>();
  destroyed$ = this._destroyed$.asObservable();

  private _hoveredTile$ = new BehaviorSubject<TileCoords | null>(null);
  hoveredTile$ = this._hoveredTile$.asObservable().pipe(distinctUntilChanged());

  private _tileHoverDetails$ = new BehaviorSubject<TileHoverDetails | null>(
    null,
  );
  tileHoverDetails$ = this._tileHoverDetails$
    .asObservable()
    .pipe(distinctUntilChanged());

  combatSimulation$ = this.tileHoverDetails$.pipe(
    map((d) => d?.combatSimulation),
    distinctUntilChanged(),
  );

  private _clickedTile$ = new BehaviorSubject<TileCoords | null>(null);
  clickedTile$ = this._clickedTile$.asObservable();

  private _clickedTileDetails$ =
    new BehaviorSubject<TileDetailsChanneled | null>(null);
  clickedTileDetails$ = this._clickedTileDetails$.asObservable();

  private _selectedTile$ = new BehaviorSubject<TileDetailsChanneled | null>(
    null,
  );
  selectedTile$ = this._selectedTile$.asObservable();

  private _activePath$ = new BehaviorSubject<UnitPathChanneled | null>(null);
  activePath$ = this._activePath$.asObservable();

  private _yieldsVisible$ = new BehaviorSubject<boolean>(true);
  yieldsVisible$ = this._yieldsVisible$.pipe(distinctUntilChanged());

  private _selectedUnit$ = new BehaviorSubject<UnitDetailsChanneled | null>(
    null,
  );
  selectedUnit$ = this._selectedUnit$.asObservable();

  private _hoveredUnit$ = new BehaviorSubject<UnitChanneled | null>(null);
  hoveredUnit$ = this._hoveredUnit$.pipe(distinctUntilChanged());

  private _hoveredCity$ = new BehaviorSubject<number | null>(null);
  hoveredCity$ = this._hoveredCity$.pipe(distinctUntilChanged());

  private _selectedCity$ = new BehaviorSubject<CityDetailsChanneled | null>(
    null,
  );
  selectedCity$ = this._selectedCity$.pipe(distinctUntilChanged());

  private selectingTileEnabled = false;

  private _cityLabelsVisible$ = new BehaviorSubject<boolean>(true);
  cityLabelsVisible$ = this._cityLabelsVisible$.pipe(distinctUntilChanged());

  private _fogOfWarEnabled$ = new BehaviorSubject<boolean>(true);
  fogOfWarEnabled$ = this._fogOfWarEnabled$.pipe(distinctUntilChanged());

  private _gridEnabled$ = new BehaviorSubject<boolean>(false);
  gridEnabled$ = this._gridEnabled$.pipe(distinctUntilChanged());

  private _yieldsEnabled$ = new BehaviorSubject<boolean>(true);
  yieldsEnabled$ = this._yieldsEnabled$.pipe(distinctUntilChanged());

  private _resourcesEnabled$ = new BehaviorSubject<boolean>(true);
  resourcesEnabled$ = this._resourcesEnabled$.pipe(distinctUntilChanged());

  private _politicsEnabled$ = new BehaviorSubject<boolean>(true);
  politicsEnabled$ = this._politicsEnabled$.pipe(distinctUntilChanged());

  allowMapPanning = true;

  constructor() {
    this.loadSettings();

    bridge.tiles.updated$.subscribe(async (tiles) => {
      const selectedTile = this._selectedTile$.value;
      if (selectedTile) {
        const newSelectedTile = tiles.find(
          (tile) => tile.id === selectedTile.id,
        );
        if (newSelectedTile) {
          const tileDetails = await bridge.tiles.getDetails(newSelectedTile.id);
          this._selectedTile$.next(tileDetails);
        }
      }
    });

    this.clickedTile$.subscribe(async (tile) => {
      if (!tile) {
        this._clickedTileDetails$.next(null);
        return;
      }
      const tileDetails = await bridge.tiles.getDetails(tile.id);
      if (!tileDetails) {
        return;
      }

      const selectedCity = this.selectedCity;
      if (selectedCity && tileDetails.areaOf === selectedCity.id) {
        const isWorked = !!selectedCity.workedTiles.find(
          (t) => t.id === tileDetails.id,
        );
        let updatedCityDetails: CityDetailsChanneled | null;
        if (isWorked) {
          updatedCityDetails = await bridge.cities.unworkTile({
            cityId: selectedCity.id,
            tileId: tileDetails.id,
          });
        } else {
          updatedCityDetails = await bridge.cities.workTile({
            cityId: selectedCity.id,
            tileId: tileDetails.id,
          });
        }
        if (updatedCityDetails) {
          this.setCityDetails(updatedCityDetails);
        }
        return;
      }

      this._clickedTileDetails$.next(tileDetails);
      if (this.selectingTileEnabled) {
        this._selectedTile$.next(tileDetails);
      } else if (tileDetails.units.length) {
        if (this.selectedUnit?.tile.id !== tile.id) {
          this.selectFirstUnitFromTile(tileDetails);
        }
      } else if (tileDetails.cityId !== null) {
        this.selectCity(tileDetails.cityId);
      } else {
        this.selectUnit(null);
        this.selectCity(null);
        this.setPath(null);
      }
    });

    this.hoveredTile$.subscribe(async (tile) => {
      if (!tile) {
        this._tileHoverDetails$.next(null);
        return;
      }
      const tileHoverDetails = await bridge.tiles.getHoverDetails({
        tileId: tile.id,
        selectedUnitId: this.selectedUnit?.id ?? null,
      });
      if (!tileHoverDetails.tile.isExplored) {
        this._tileHoverDetails$.next(null);
        this.hoverCity(null);
        return;
      }
      this._tileHoverDetails$.next(tileHoverDetails);
      if (!tileHoverDetails) {
        return;
      }
      if (!this._selectedCity$.value) {
        this.hoverCity(tileHoverDetails.tile.cityId ?? null);
      }
    });

    bridge.player.tracked$.subscribe(() => {
      this._selectedUnit$.next(null);
      this.setPath(null);
    });

    bridge.cities.spawned$.subscribe((city) => {
      if (!nextTurnService.autoplayEnabled) {
        this.selectCity(city.id);
      }
    });

    bridge.game.start$.subscribe(() => {
      this._fogOfWarEnabled$.next(true);
    });

    bridge.game.turn$.subscribe(() => {
      this.setPath(null);
      if (this._clickedTile$.value) {
        this.clickTile(this._clickedTile$.value);
      }
      if (this.selectedUnit) {
        this.selectUnit(this.selectedUnit.id);
      }
    });

    bridge.units.destroyed$.subscribe((unitId) => {
      if (unitId === this.selectedUnit?.id) {
        this.clearSelectedUnit();
      }
    });
  }

  get hoveredTile() {
    return this._hoveredTile$.value;
  }

  enableSelectingTile(enable: boolean) {
    this.selectingTileEnabled = enable;
    if (!enable) {
      this._selectedTile$.next(null);
    }
  }

  destroy() {
    this._destroyed$.next();
  }

  clickTile(tile: TileCoords) {
    this._clickedTile$.next(tile);
  }

  hoverTile(tile: TileCoords | null) {
    this._hoveredTile$.next(tile);
  }

  setPath(path: UnitPathChanneled | null) {
    this._activePath$.next(path);
  }

  async selectCity(cityId: number | null) {
    if (cityId === null) {
      this._selectedCity$.next(null);
      return;
    }

    const city = await bridge.cities.getDetails(cityId);
    if (city?.visibilityLevel === "all") {
      this._selectedCity$.next(city);
      camera.moveToTileWithEasing(city.tile);
    }
  }

  setCityDetails(city: CityDetailsChanneled) {
    this._selectedCity$.next(city);
  }

  setUnitDetails(unit: UnitDetailsChanneled) {
    this._selectedUnit$.next(unit);
  }

  hoverCity(cityId: number | null) {
    this._hoveredCity$.next(cityId);
  }

  async selectUnit(unitId: number | null) {
    if (unitId === null) {
      this.clearSelectedUnit();
      return;
    }

    const unit = await bridge.units.getDetails(unitId);
    if (unit?.canControl) {
      this._selectedUnit$.next(unit);
      this.setPath(unit.path);
    }
  }

  private clearSelectedUnit() {
    this._selectedUnit$.next(null);
    this._activePath$.next(null);
  }

  private async selectFirstUnitFromTile(tile: TileDetailsChanneled) {
    if (tile.units.length) {
      this.selectUnit(tile.units[0].id);
    }
  }

  get selectedUnit() {
    return this._selectedUnit$.value;
  }

  get selectedCity() {
    return this._selectedCity$.value;
  }

  get fogOfWarEnabled() {
    return this._fogOfWarEnabled$.value;
  }
  set fogOfWarEnabled(enabled: boolean) {
    this._fogOfWarEnabled$.next(enabled);
  }

  get gridEnabled() {
    return this._gridEnabled$.value;
  }
  set gridEnabled(enabled: boolean) {
    this._gridEnabled$.next(enabled);
    this.saveSettings();
  }

  get yieldsEnabled() {
    return this._yieldsEnabled$.value;
  }
  set yieldsEnabled(enabled: boolean) {
    this._yieldsEnabled$.next(enabled);
    this.saveSettings();
  }

  get resourcesEnabled() {
    return this._resourcesEnabled$.value;
  }
  set resourcesEnabled(enabled: boolean) {
    this._resourcesEnabled$.next(enabled);
    this.saveSettings();
  }

  get politicsEnabled() {
    return this._politicsEnabled$.value;
  }
  set politicsEnabled(enabled: boolean) {
    this._politicsEnabled$.next(enabled);
    this.saveSettings();
  }

  clear() {
    this.selectingTileEnabled = false;
    this._hoveredTile$.next(null);
    this._selectedTile$.next(null);
  }

  private saveSettings() {
    const mapSettings = {
      gridEnabled: this.gridEnabled,
      yieldsEnabled: this.yieldsEnabled,
      resourcesEnabled: this.resourcesEnabled,
      politicsEnabled: this.politicsEnabled,
    };
    localStorage.setItem("settings.map", JSON.stringify(mapSettings));
  }

  private loadSettings() {
    try {
      const mapSettings = JSON.parse(
        localStorage.getItem("settings.map") ?? "",
      );
      if (mapSettings) {
        this._gridEnabled$.next(mapSettings?.gridEnabled ?? false);
        this._yieldsEnabled$.next(mapSettings?.yieldsEnabled ?? true);
        this._resourcesEnabled$.next(mapSettings?.resourcesEnabled ?? true);
        this._politicsEnabled$.next(mapSettings?.politicsEnabled ?? true);
      }
    } catch (e) {
      return {};
    }
  }
}

export const mapUi = new MapUi();
