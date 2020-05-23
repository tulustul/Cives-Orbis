import { Injectable } from "@angular/core";

import { BehaviorSubject, Subject } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
7;
import { UIState } from "./ui-state";
import { Camera } from "../renderer/camera";
import { Tile } from "../shared";
import { City } from "../api/city";
import { Unit } from "../api/unit";
import { GameApi } from "../api";
import { UnitDetails } from "../api/unit-details";
import { CityDetails } from "../api/city-details";
import { Area } from "../api/area";

@Injectable()
export class MapUi {
  private _hoveredTile$ = new BehaviorSubject<Tile | null>(null);
  hoveredTile$ = this._hoveredTile$.asObservable().pipe(distinctUntilChanged());

  private _clickedTile$ = new Subject<Tile>();
  clickedTile$ = this._clickedTile$.asObservable();

  private _selectedTile$ = new BehaviorSubject<Tile | null>(null);
  selectedTile$ = this._selectedTile$.asObservable();

  private _highlightedTiles$ = new BehaviorSubject<Set<Tile>>(new Set());
  highlightedTiles$ = this._highlightedTiles$.asObservable();

  private _activePath$ = new BehaviorSubject<Tile[][] | null>(null);
  activePath$ = this._activePath$.asObservable();

  private _yieldsVisible$ = new BehaviorSubject<boolean>(true);
  yieldsVisible$ = this._yieldsVisible$.pipe(distinctUntilChanged());

  private _selectedUnit$ = new BehaviorSubject<UnitDetails | null>(null);
  selectedUnit$ = this._selectedUnit$.pipe();

  private selectingTileEnabled = false;

  private _cityLabelsVisible$ = new BehaviorSubject<boolean>(true);
  cityLabelsVisible$ = this._cityLabelsVisible$.pipe(distinctUntilChanged());

  allowMapPanning = true;

  unitRangeArea = new Area(0xffffff);

  cityRangeArea = new Area(0xffffff);

  constructor(
    private game: GameApi,
    private camera: Camera,
    private uiState: UIState,
  ) {
    this.clickedTile$.subscribe((tile) => {
      if (this.selectingTileEnabled) {
        this._selectedTile$.next(tile);
      } else if (tile.units.length) {
        this.selectUnit(tile.units[0]);
      } else if (tile?.city) {
        this.selectCity(tile.city);
      } else {
        this.selectUnit(null);
        this.setPath(null);
      }
    });
    this.hoveredTile$.subscribe((tile) => {
      if (!this.uiState.selectedCity$.value) {
        if (tile?.city) {
          tile.city.getRange().then((tiles) => {
            this.cityRangeArea.addTiles(tiles);
          });
        } else {
          this.cityRangeArea.clear();
        }
      }
    });
    // this.game.citiesManager.spawned$.subscribe((city) => {
    //   if (city.player === this.game.humanPlayer) {
    //     this.selectCity(city);
    //   }
    // });
    this.game.state?.trackedPlayer$.subscribe((player) => {
      this._selectedUnit$.next(null);
      const tileOfInterest = player?.units[0]?.tile || player?.cities[0]?.tile;
      if (tileOfInterest) {
        this.camera.moveToTile(tileOfInterest);
      }
      this.setPath(null);
    });
    this.game.init$.subscribe(() => {
      this.game.state!.turn$.subscribe(() => this.setPath(null));
      setTimeout(() => {
        this.game.state!.addArea(this.unitRangeArea);
        this.game.state!.addArea(this.cityRangeArea);
      });
    });
    this.game.stop$.subscribe(() => this.clear());
  }

  update() {
    this._yieldsVisible$.next(this.camera.transform.scale > 40);
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

  clickTile(tile: Tile) {
    this._clickedTile$.next(tile);
  }

  hoverTile(tile: Tile | null) {
    this._hoveredTile$.next(tile);
  }

  setPath(path: Tile[][] | null) {
    this._activePath$.next(path);
  }

  selectCity(city: City | null) {
    if (!city) {
      this.uiState.selectedCity$.next(null);
      this.cityRangeArea.clear();
      this._cityLabelsVisible$.next(true);
      this.allowMapPanning = true;
      return;
    }

    if (city.player.id === this.game.state?.trackedPlayer.id) {
      this.game.state.getCityDetails(city.id).then((data) => {
        const cityDetails = new CityDetails(this.game.state!, data);
        this.uiState.selectedCity$.next(cityDetails);
        this._cityLabelsVisible$.next(false);
        this.cityRangeArea.addTiles(Array.from(cityDetails.tiles));
        this.allowMapPanning = false;
      });
    }
  }

  async selectUnit(unit: Unit | null) {
    if (!unit) {
      this._selectedUnit$.next(null);
      this.unitRangeArea.clear();
      return;
    }

    if (unit.player.id === this.game.state?.trackedPlayer.id) {
      const data = await this.game.state.getUnitDetails(unit.id);
      if (data) {
        const unitDetails = new UnitDetails(this.game.state!, data);
        this._selectedUnit$.next(unitDetails);
        unitDetails
          .getRange()
          .then((tiles) => this.unitRangeArea.addTiles(tiles));
      } else {
        this._selectedUnit$.next(null);
        this.unitRangeArea.clear();
      }
      this.setPath(this._selectedUnit$.value?.path || null);
    }
  }

  get selectedUnit() {
    return this._selectedUnit$.value;
  }

  clear() {
    this.selectingTileEnabled = false;
    this._hoveredTile$.next(null);
    this._selectedTile$.next(null);
    this._highlightedTiles$.next(new Set());
  }
}
