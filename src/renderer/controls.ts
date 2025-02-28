import { BehaviorSubject, take } from "rxjs";

import { mapUi } from "@/ui/mapUi";
import { camera } from "./camera";
import { nextTurnService } from "@/ui/nextTurn";
import { useMenu } from "@/ui/gameMenu";
import { bridge } from "@/bridge";
import { GameInfo, TileCoords } from "@/core/serialization/channel";

export class Controls {
  private _mouseButton$ = new BehaviorSubject<number | null>(null);
  mouseButton$ = this._mouseButton$.asObservable();

  private hasMouseMoved = false;

  gameInfo: GameInfo | null = null;

  constructor() {
    bridge.game.start$.subscribe((gameStartInfo) => {
      this.gameInfo = gameStartInfo.gameInfo;
      if (gameStartInfo.tileToGo) {
        camera.moveToTile(gameStartInfo.tileToGo);
      }
      if (gameStartInfo.unitIdToSelect) {
        mapUi.selectUnit(gameStartInfo.unitIdToSelect);
      }
    });
  }

  onMouseDown(event: MouseEvent) {
    this.hasMouseMoved = false;
    this._mouseButton$.next(event.button);
    event.preventDefault();
    event.stopPropagation();

    if (mapUi.selectedUnit && this.mouseButton === 2) {
      const tile = this.getTileFromMouseEvent(event);
      if (tile !== null) {
        bridge.units
          .findPath({ destinationId: tile.id, unitId: mapUi.selectedUnit.id })
          .then((unit) => {
            if (unit && mapUi.selectedUnit) {
              mapUi.setPath(unit.path);
            }
          });
      }
    }

    return false;
  }

  onClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (this.hasMouseMoved) {
      return;
    }

    const hoveredTile = mapUi.hoveredTile;
    if (hoveredTile) {
      mapUi.clickTile(hoveredTile);
    }

    return false;
  }

  onMouseUp() {
    const selectedUnit = mapUi.selectedUnit;
    if (selectedUnit && this.mouseButton === 2) {
      bridge.units.moveAlongPath(selectedUnit.id).then(async (unit) => {
        if (!unit) {
          return;
        }
        mapUi["_selectedUnit$"].next(unit);
        mapUi.setPath(unit.path);
        mapUi.clickTile(unit.tile);
      });
    }

    this._mouseButton$.next(null);
  }

  onMouseMove(event: MouseEvent) {
    this.hasMouseMoved = true;
    const tile = this.getTileFromMouseEvent(event);

    if (tile?.id !== mapUi.hoveredTile?.id) {
      mapUi.hoverTile(tile);

      if (tile && mapUi.selectedUnit && this.mouseButton === 2) {
        bridge.units
          .findPath({ destinationId: tile.id, unitId: mapUi.selectedUnit.id })
          .then((unit) => {
            if (unit && mapUi.selectedUnit) {
              mapUi.setPath(unit.path);
            }
          });
      }
    }

    if (mapUi.allowMapPanning && event.buttons === 1) {
      camera.moveBy(event.movementX, event.movementY);
    }
  }

  onWheel(event: WheelEvent) {
    camera.scaleByWithEasing(
      1 + (event.deltaY > 0 ? -0.3 : 0.3),
      event.clientX,
      event.clientY,
      300
    );
  }

  onKeyDown(event: KeyboardEvent) {
    const menu = useMenu.getState();
    if (mapUi.selectedCity) {
      if (event.key === "Escape") {
        mapUi.selectCity(null);
      }
    } else if (menu.enabled) {
      if (event.key === "Escape" && this.gameInfo) {
        menu.hide();
      }
    } else {
      if (event.key === "Enter") {
        nextTurnService.next();
      } else if (event.key === "Escape") {
        menu.show();
      } else if (mapUi.selectedUnit) {
        if (event.key === "s" || event.key === "f") {
          bridge.units
            .setOrder({ unitId: mapUi.selectedUnit.id, order: "sleep" })
            .then(() => mapUi["_selectedUnit$"].next(mapUi.selectedUnit));
        } else if (event.key === " ") {
          bridge.units
            .setOrder({ unitId: mapUi.selectedUnit.id, order: "skip" })
            .then(() => mapUi["_selectedUnit$"].next(mapUi.selectedUnit));
        } else if (event.key === "b") {
          bridge.units
            .doAction({ unitId: mapUi.selectedUnit.id, action: "foundCity" })
            .then(() => mapUi["_selectedUnit$"].next(mapUi.selectedUnit));
        }
      }
    }
  }

  getTileFromMouseEvent(event: MouseEvent): TileCoords | null {
    if (this.gameInfo === null) {
      return null;
    }
    const [x, y] = camera.screenToTileCoords(event.clientX, event.clientY);
    if (
      x < 0 ||
      y < 0 ||
      x >= this.gameInfo.mapWidth ||
      y >= this.gameInfo.mapHeight
    ) {
      return null;
    }

    const id = x * this.gameInfo.mapWidth + y;
    return { id, x, y };
  }

  nextTurn() {
    // mapUi.setPath(this.activeUnit?.path || null);
  }

  get mouseButton() {
    return this._mouseButton$.value;
  }
}

export const controls = new Controls();
