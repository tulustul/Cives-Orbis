import { Yields } from "@/shared";

export const EMPTY_YIELDS: Yields = {
  food: 0,
  production: 0,
  gold: 0,
  culture: 0,
  knowledge: 0,
  publicWorks: 0,
  faith: 0,
};

export function zeroYields(yields: Yields) {
  yields.food = 0;
  yields.production = 0;
  yields.gold = 0;
  yields.culture = 0;
  yields.knowledge = 0;
  yields.publicWorks = 0;
  yields.faith = 0;
}

export function addYields(targetYields: Yields, yields: Partial<Yields>) {
  targetYields.food += yields.food ?? 0;
  targetYields.production += yields.production ?? 0;
  targetYields.gold += yields.gold ?? 0;
  targetYields.culture += yields.culture ?? 0;
  targetYields.knowledge += yields.knowledge ?? 0;
  targetYields.publicWorks += yields.publicWorks ?? 0;
  targetYields.faith += yields.faith ?? 0;
}

export function subtractYields(targetYields: Yields, yields: Partial<Yields>) {
  targetYields.food -= yields.food ?? 0;
  targetYields.production -= yields.production ?? 0;
  targetYields.gold -= yields.gold ?? 0;
  targetYields.culture -= yields.culture ?? 0;
  targetYields.knowledge -= yields.knowledge ?? 0;
  targetYields.publicWorks -= yields.publicWorks ?? 0;
  targetYields.faith -= yields.faith ?? 0;
}

export function copyYields(targetYields: Yields, yields: Yields) {
  targetYields.food = yields.food;
  targetYields.production = yields.production;
  targetYields.gold = yields.gold;
  targetYields.culture = yields.culture;
  targetYields.knowledge = yields.knowledge;
  targetYields.publicWorks = yields.publicWorks;
  targetYields.faith = yields.faith;
}

export function roundYields(yields: Yields) {
  yields.food = Math.ceil(yields.food);
  yields.production = Math.ceil(yields.production);
  yields.gold = Math.ceil(yields.gold);
  yields.culture = Math.ceil(yields.culture);
  yields.knowledge = Math.ceil(yields.knowledge);
  yields.publicWorks = Math.ceil(yields.publicWorks);
  yields.faith = Math.ceil(yields.faith);
}

export function sumYields(yields: Partial<Yields>) {
  return (
    (yields.food ?? 0) +
    (yields.production ?? 0) +
    (yields.gold ?? 0) +
    (yields.culture ?? 0) +
    (yields.knowledge ?? 0) +
    (yields.publicWorks ?? 0) +
    (yields.faith ?? 0)
  );
}
