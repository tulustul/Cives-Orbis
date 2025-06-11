import { bridge } from "@/bridge";
import { renderer } from "@/renderer/renderer";
import {
  CityDetailsChanneled,
  CityProductChanneled,
  CityWorkTileOptions,
  TileDetailsChanneled,
  TilesCoordsWithNeighbours,
} from "@/shared";
import { create } from "zustand";

export type CityTilesMode = "workers" | "districts" | "none";

export type DistrictProduction = {
  tiles: TilesCoordsWithNeighbours[];
  districtId: string;
};

export type CityViewState = {
  city: CityDetailsChanneled | null;
  tilesMode: CityTilesMode;
  districtProduction: DistrictProduction | null;
  setCity: (city: CityDetailsChanneled | null) => void;
  setupDistrictProduction: (districtId: string) => Promise<void>;
  completeDistrictProduction: (tile: TileDetailsChanneled) => Promise<void>;
  clearDistrictProduction: () => void;
  toggleWorker: (tile: TileDetailsChanneled) => Promise<void>;
  handleTileClick: (tile: TileDetailsChanneled) => Promise<void>;
  produce: (product: CityProductChanneled) => Promise<void>;
  optimizeYields: () => Promise<void>;
  clear: () => void;
};

export const useCityView = create<CityViewState>((set, get) => ({
  city: null,
  tilesMode: "none",
  districtProduction: null,
  setCity: (city) => set({ city, tilesMode: "workers" }),
  setupDistrictProduction: async (districtId) => {
    const tiles = await bridge.cities.getDistrictAvailableTiles({
      cityId: get().city!.id,
      districtId,
    });
    renderer.areaDrawer.districtAvailableTiles.setTiles(tiles);
    set({
      districtProduction: { tiles, districtId },
      tilesMode: "districts",
    });
  },
  completeDistrictProduction: async (tile) => {
    const state = get();
    if (!state.city || !state.districtProduction) {
      return;
    }

    const ok = state.districtProduction.tiles.some((t) => t.id === tile.id);
    if (!ok) {
      return;
    }

    const updatedCity = await bridge.cities.produce({
      cityId: state.city.id,
      entityType: "district",
      productId: state.districtProduction.districtId,
      tileId: tile.id,
    });

    renderer.areaDrawer.districtAvailableTiles.clear();
    set({ city: updatedCity, tilesMode: "workers" });
  },
  clearDistrictProduction: () => {
    renderer.areaDrawer.districtAvailableTiles.clear();
    set({ districtProduction: null, tilesMode: "workers" });
  },
  toggleWorker: async (tile) => {
    const { city } = get();
    if (!city) {
      return;
    }
    const isWorked = !!city.workedTiles.find((t) => t.id === tile.id);
    const options: CityWorkTileOptions = {
      cityId: city.id,
      tileId: tile.id,
    };

    let updatedCity: CityDetailsChanneled | null = null;
    if (isWorked) {
      updatedCity = await bridge.cities.unworkTile(options);
    }
    updatedCity = await bridge.cities.workTile(options);

    set({ city: updatedCity });
  },
  handleTileClick: async (tile) => {
    const state = get();
    if (!state.city || tile.areaOf !== state.city.id) {
      return;
    }

    if (state.tilesMode === "workers") {
      await state.toggleWorker(tile);
    } else if (state.tilesMode === "districts") {
      await state.completeDistrictProduction(tile);
    }
  },
  produce: async (product) => {
    const state = get();
    if (!state.city || !product.enabled) {
      return;
    }

    if (product.definition.entityType === "district") {
      state.setupDistrictProduction(product.definition.id);
      return;
    }

    if (state.districtProduction) {
      state.clearDistrictProduction();
    }

    const updatedCity = await bridge.cities.produce({
      cityId: state.city.id,
      productId: product.definition.id,
      entityType: product.definition.entityType,
    });

    if (updatedCity) {
      set({ city: updatedCity });
    }
  },
  optimizeYields: async () => {
    const { city } = get();
    if (!city) {
      return;
    }
    const updatedCity = await bridge.cities.optimizeYields(city.id);
    if (updatedCity) {
      set({ city: updatedCity });
    }
  },
  clear: () => {
    renderer.areaDrawer.districtAvailableTiles.clear();
    set({ city: null, tilesMode: "none", districtProduction: null });
  },
}));

export function useCity(): CityDetailsChanneled {
  const { city } = useCityView();
  if (!city) {
    throw new Error("City is not set in the city view store");
  }
  return city;
}
