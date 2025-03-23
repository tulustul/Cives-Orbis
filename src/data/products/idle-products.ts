import { RawIdleProduct } from "@/core/data.interface";

export const IDLE_PRODUCTS: RawIdleProduct[] = [
  {
    id: "idle_product_growth",
    entityType: "idleProduct",
    name: "Growth",
    productionCost: Infinity,
    strongRequirements: [],
    weakRequirements: [],
    bonuses: { transferProductionToFood: 0.25 },
    technology: "tech_agriculture",
  },
  {
    id: "idle_product_culture",
    entityType: "idleProduct",
    name: "Culture",
    productionCost: Infinity,
    strongRequirements: [],
    weakRequirements: [],
    bonuses: { transferProductionToCulture: 0.25 },
    technology: "tech_poetry",
  },
  {
    id: "idle_product_public_works",
    entityType: "idleProduct",
    name: "Public works",
    productionCost: Infinity,
    strongRequirements: [],
    weakRequirements: [],
    bonuses: { transferProductionToPublicWorks: 0.25 },
    technology: "tech_engineering",
  },
];
