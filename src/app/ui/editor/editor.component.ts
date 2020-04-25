import { Component, OnInit, OnDestroy } from '@angular/core';

import { UIStateService } from '../ui-state.service';
import { Game } from 'src/app/game/game';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class EditorComponent implements OnInit, OnDestroy {
  constructor(private game: Game, private uiState: UIStateService) {}

  ngOnInit(): void {
    this.game.editorMode = true;
  }

  ngOnDestroy() {
    this.game.editorMode = false;
    this.game.tilesManager.selectedTile$.next(null);
  }

  close() {
    this.uiState.editorEnabled$.next(false);
  }
}
