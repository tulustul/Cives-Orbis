import { create } from "zustand";

export type UiMode = "none" | "loading" | "map" | "editor";
export type UiView = "none" | "stats" | "techTree" | "economyOverview";

export type UiState = {
  mode: UiMode;
  view: UiView;
  debug: boolean;
  setMode: (mode: UiMode) => void;
  setView: (view: UiView) => void;
  setDebug: (debug: boolean) => void;
};

export const useUiState = create<UiState>((set) => ({
  mode: "none",
  view: "none",
  debug: false,
  setMode: (mode) => set({ mode }),
  setView: (view) => set({ view }),
  setDebug: (debug) => set({ debug }),
}));
