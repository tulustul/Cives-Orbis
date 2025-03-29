import { BehaviorSubject, map } from "rxjs";

import { mapUi } from "./mapUi";
import { camera } from "@/renderer/camera";
import { bridge } from "@/bridge";
import { PlayerTask } from "@/shared";
import { useUiState } from "./uiState";

export class NextTurnService {
  private _waiting$ = new BehaviorSubject<boolean>(false);
  waiting$ = this._waiting$.asObservable();

  private _autoPlay$ = new BehaviorSubject<boolean>(false);
  autoPlay$ = this._autoPlay$.asObservable();

  nextTask: PlayerTask | null = null;

  constructor() {
    bridge.nextTask$.subscribe((nextTask) => (this.nextTask = nextTask));
  }

  async next() {
    await this.executeTask(this.nextTask, { withAnimations: true });
  }

  async executeTask(
    task: PlayerTask | null,
    options: { withAnimations?: boolean } = {}
  ) {
    if (this._waiting$.value) {
      return;
    }

    if (!task) {
      this._waiting$.next(true);
      await bridge.game.nextPlayer();
      this._waiting$.next(false);
      return;
    }

    switch (task.task) {
      case "city":
        mapUi.selectCity(task.id);
        break;

      case "unit":
        await mapUi.selectUnit(task.id);
        if (mapUi.selectedUnit) {
          if (options.withAnimations) {
            camera.moveToTileWithEasing(mapUi.selectedUnit.tile);
          } else {
            camera.moveToTile(mapUi.selectedUnit.tile);
          }
        }
        break;

      case "chooseTech":
        useUiState.getState().setView("techTree");
    }
  }

  setAutoplay(autoplay: boolean) {
    if (this._autoPlay$.value === autoplay) {
      return;
    }
    this._autoPlay$.next(autoplay);
    if (autoplay) {
      this.autoplay();
    }
  }

  get autoplayEnabled() {
    return this._autoPlay$.value;
  }

  private autoplay() {
    this.next();
    if (this._autoPlay$.value) {
      setTimeout(() => this.autoplay());
    }
  }
}

export const nextTurnService = new NextTurnService();
