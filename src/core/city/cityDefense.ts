import { CityCore } from "./city";

const BASE_DEFENSE_BONUS = 0.1;

export class CityDefense {
  maxHealth = 1;
  health = 0;
  defenseBonus = 0;
  strength = 0;

  changed = false;

  constructor(public city: CityCore) {
    this.city = city;
  }

  reset() {
    this.maxHealth = 1;
    this.defenseBonus = 0;
    this.strength = 0;
  }

  update() {
    if (this.health < this.maxHealth) {
      const healPerTurn = Math.floor(this.maxHealth / 10);
      this.health = Math.min(this.health + healPerTurn, this.maxHealth);
      this.changed = true;
    }
  }

  get unitsDefenseBonus() {
    return (
      BASE_DEFENSE_BONUS + this.defenseBonus * (this.health / this.maxHealth)
    );
  }

  get player() {
    return this.city.player;
  }

  get tile() {
    return this.city.tile;
  }
}
