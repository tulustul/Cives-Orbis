import { create } from "zustand";

export type UiMode = "none" | "loading" | "map" | "editor";
export type UiView = "none" | "stats";

export type UiState = {
  mode: UiMode;
  view: UiView;
  setMode: (mode: UiMode) => void;
  setView: (view: UiView) => void;
};

export const useUiState = create<UiState>((set) => ({
  mode: "none",
  view: "none",
  setMode: (mode) => set({ mode }),
  setView: (view) => set({ view }),
}));
