import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { OverlayModule } from "@angular/cdk/overlay";

import { AppComponent } from "./app.component";
import { GameCanvasComponent } from "./game-canvas/game-canvas.component";
import { UnitPanelComponent } from "./ui/unit-panel/unit-panel.component";
import { Game } from "./core/game";
import { NextTurnButtonComponent } from "./ui/next-turn-button/next-turn-button.component";
import { GameInfoComponent } from "./ui/game-info/game-info.component";
import { DebugComponent } from "./ui/debug/debug.component";
import { TurnCounterComponent } from "./ui/turn-counter/turn-counter.component";
import { EditorComponent } from "./ui/editor/editor.component";
import { UIState } from "./ui/ui-state";
import { TabsComponent, TabComponent } from "./ui/widgets/tabs";
import { TileEditorComponent } from "./ui/editor/tile-editor/tile-editor.component";
import { RadioComponent } from "./ui/widgets/radio/radio.component";
import { MultiselectComponent } from "./ui/widgets/multiselect/multiselect.component";
import { ToggleComponent } from "./ui/widgets/toggle/toggle.component";
import { TilePaintingComponent } from "./ui/editor/tile-painting/tile-painting.component";
import { GameMenuComponent } from "./ui/game-menu/game-menu.component";
import { SavesListComponent } from "./ui/game-menu/saves-list/saves-list.component";
import { SaveViewComponent } from "./ui/game-menu/save-view/save-view.component";
import { LoadViewComponent } from "./ui/game-menu/load-view/load-view.component";
import { MainMenuViewComponent } from "./ui/game-menu/main-menu-view/main-menu-view.component";
import { NewGameViewComponent } from "./ui/game-menu/new-game-view/new-game-view.component";
import { UnitEditorComponent } from "./ui/editor/unit-editor/unit-editor.component";
import { CityEditorComponent } from "./ui/editor/city-editor/city-editor.component";
import { CitiesLayerComponent } from "./ui/cities-layer/cities-layer.component";
import { CityInfoComponent } from "./ui/cities-layer/city-info/city-info.component";
import { CityViewComponent } from "./ui/city-view/city-view.component";
import { TurnsPipe } from "./ui/turns.pipe";
import { WorkTilesComponent } from "./ui/city-view/work-tiles/work-tiles.component";
import { ProgressBarComponent } from "./ui/widgets/progress-bar/progress-bar.component";
import { ButtonDirective } from "./ui/button.directive";
import { MinimapComponent } from "./ui/minimap/minimap.component";
import { TooltipDirective } from "./ui/widgets/tooltip.directive";
import { TooltipComponent } from "./ui/widgets/tooltip/tooltip.component";
import { BonusesComponent } from "./ui/bonuses/bonuses.component";
import { PercentBonusPipe } from "./ui/percent-bonus.pipe";
import { ProductRequirementsComponent } from "./ui/product-requirements/product-requirements.component";
import { PlayerYieldsComponent } from "./ui/player-yields/player-yields.component";
import { Controls } from "./controls";
import { NextTurnService } from "./ui/next-turn.service";
import { GameRenderer } from "./renderer/renderer";
import { MapUi } from "./ui/map-ui";
import { UnitActionRequirementsComponent } from './ui/unit-action-requirements/unit-action-requirements.component';

@NgModule({
  declarations: [
    AppComponent,
    GameCanvasComponent,
    UnitPanelComponent,
    NextTurnButtonComponent,
    GameInfoComponent,
    DebugComponent,
    TurnCounterComponent,
    EditorComponent,
    TabsComponent,
    TabComponent,
    TileEditorComponent,
    RadioComponent,
    MultiselectComponent,
    ToggleComponent,
    TilePaintingComponent,
    GameMenuComponent,
    SavesListComponent,
    SaveViewComponent,
    LoadViewComponent,
    MainMenuViewComponent,
    NewGameViewComponent,
    UnitEditorComponent,
    CityEditorComponent,
    CitiesLayerComponent,
    CityInfoComponent,
    CityViewComponent,
    TurnsPipe,
    WorkTilesComponent,
    ProgressBarComponent,
    ButtonDirective,
    MinimapComponent,
    TooltipDirective,
    TooltipComponent,
    BonusesComponent,
    PercentBonusPipe,
    ProductRequirementsComponent,
    PlayerYieldsComponent,
    UnitActionRequirementsComponent,
  ],
  imports: [BrowserModule, FormsModule, OverlayModule],
  providers: [Game, UIState, Controls, NextTurnService, GameRenderer, MapUi],
  bootstrap: [AppComponent],
})
export class AppModule {}
