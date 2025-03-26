import { TechEra } from "@/core/data.interface";

export const erasColors: Record<TechEra, string> = {
  "Copper Age": "#3d4e5980",
  "Bronze Age": "#d6b99d80",
  "Iron Age": "#e1eedc80",
  "Gunpowder Age": "#6d6d6d80",
  "Coal Age": "#00000080",
  "Industrial Age": "#ffa6a680",
  "Electric Age": "#f4f45d80",
  "Information Age": "#5c89ff80",
  "AI Age": "#8d25fb66",
};

export const eras = Object.keys(erasColors) as TechEra[];

export const blockHeight = 80;
export const blockWidth = 400;
