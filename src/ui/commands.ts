import { bridge } from "@/bridge";
import { UnitOrder } from "@/core/unit";
import { UnitAction } from "@/core/unit-actions";
import { useMenu } from "./gameMenu";
import { keybinding } from "./keybindings";
import { mapUi } from "./mapUi";
import { nextTurnService } from "./nextTurn";
import { UiView, useUiState } from "./uiState";

export class Commands {
  @keybinding({ keybinding: ["enter", "tab"], context: "map" })
  nextTurn() {
    nextTurnService.next();
  }

  @keybinding({ keybinding: "s", context: "unit" })
  static async unitSleep() {
    Commands.unitSetOrder("sleep");
  }

  @keybinding({ keybinding: "space", context: "unit" })
  static async unitSkip() {
    Commands.unitSetOrder("skip");
  }

  private static async unitSetOrder(order: UnitOrder) {
    if (!mapUi.selectedUnit) {
      return;
    }
    const updatedUnit = await bridge.units.setOrder({
      unitId: mapUi.selectedUnit.id,
      order,
    });
    if (updatedUnit) {
      mapUi.setUnitDetails(updatedUnit);
    }
  }

  @keybinding({ keybinding: "b", context: "unit" })
  static async unitBuildCity() {
    Commands.unitDoAction("foundCity");
  }

  private static async unitDoAction(action: UnitAction) {
    if (!mapUi.selectedUnit) {
      return;
    }
    const updatedUnit = await bridge.units.doAction({
      unitId: mapUi.selectedUnit.id,
      action,
    });
    if (updatedUnit) {
      mapUi.setUnitDetails(updatedUnit);
    }
  }

  @keybinding({ keybinding: "k", context: "map" })
  static showStats() {
    Commands.showView("stats");
  }

  @keybinding({ keybinding: "t", context: "map" })
  static showTechTree() {
    Commands.showView("techTree");
  }

  private static showView(view: UiView) {
    const uiState = useUiState.getState();
    const menu = useMenu.getState();
    if (uiState.view === "none" && !menu.enabled) {
      uiState.setView(view);
    }
  }

  @keybinding({ keybinding: "escape", context: "map" })
  static handleEsc() {
    const uiState = useUiState.getState();
    if (uiState.view !== "none") {
      uiState.setView("none");
      return;
    }

    const menu = useMenu.getState();
    if (menu.enabled) {
      menu.hide();
    } else {
      menu.show();
    }
  }

  @keybinding({ keybinding: ["escape", "tab"], context: "city" })
  static hideCityView() {
    mapUi.selectCity(null);
  }

  @keybinding({ keybinding: "g", context: "map" })
  static toogleGrid() {
    mapUi.gridEnabled = !mapUi.gridEnabled;
  }

  @keybinding({ keybinding: "y", context: "map" })
  static toogleYields() {
    mapUi.yieldsEnabled = !mapUi.yieldsEnabled;
  }

  @keybinding({ keybinding: "ctrl+shift+e", context: "map" })
  static toggleEditor() {
    const uiState = useUiState.getState();
    uiState.setMode(uiState.mode === "map" ? "editor" : "map");
  }
}
