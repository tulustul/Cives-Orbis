import { CityCore } from "./city";

export class CityDefense {
  maxHealth = 0;
  currentHealth = 0;
  defenseBonus = 0;

  constructor(public city: CityCore) {
    this.city = city;
  }

  reset() {
    this.maxHealth = 0;
    this.defenseBonus = 0;
  }
}
