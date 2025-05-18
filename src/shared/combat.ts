import { CityChanneled, UnitChanneled } from "./channel";

export enum CombatModifierType {
  hills,
  forest,
  river,
  health,
  flanks,
  city,
}

export enum BattleResult {
  victory,
  undecided,
  defeat,
}

export type CombatModifier = {
  type: CombatModifierType;
  value: number;
};

export type CombatSimulationSideChanneled = {
  damage: number;
  strength: number;
  modifiers: CombatModifier[];
  unit: UnitChanneled | null;
  city: CityChanneled | null;
};

export type CombatSimulationChanneled = {
  attacker: CombatSimulationSideChanneled;
  defender: CombatSimulationSideChanneled;
};
