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

export type CombatSimulationSide = {
  damage: number;
  strength: number;
  modifiers: CombatModifier[];
};

export type CombatSimulation = {
  attacker: CombatSimulationSide;
  defender: CombatSimulationSide;
};
