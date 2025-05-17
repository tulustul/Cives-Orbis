import { CityCore } from "./city";

const BASE_DEFENSE_BONUS = 0.1;

export class CityDefense {
  maxHealth = 0;
  currentHealth = 0;
  defenseBonus = BASE_DEFENSE_BONUS;
  strength = 0;

  constructor(public city: CityCore) {
    this.city = city;
  }

  reset() {
    this.maxHealth = 0;
    this.defenseBonus = BASE_DEFENSE_BONUS;
    this.strength = 0;
  }

  update() {
    if (this.currentHealth < this.maxHealth) {
      const healPerTurn = Math.floor(this.maxHealth / 10);
      this.currentHealth = Math.min(
        this.currentHealth + healPerTurn,
        this.maxHealth,
      );
    }
  }
}
