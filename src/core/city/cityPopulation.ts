import { dataManager } from "@/core/data/dataManager";
import { CityCore } from "./city";

export class CityPopulation {
  population = new Map<string, number>();
  workers = new Map<string, number>();
  total = 1;

  totalFood = 0;
  foodConsumed = 0;

  changedSize = false;

  constructor(public city: CityCore) {
    for (const populationType of dataManager.populationTypes.all) {
      const amount = populationType.id === "population_type_peasant" ? 1 : 0;
      this.population.set(populationType.id, amount);
      this.workers.set(populationType.id, amount);
    }
  }

  getFoodToGrow() {
    return Math.ceil(15 * this.total ** 2);
  }

  public nextTurn() {
    this.processSlaves();
    this.processPeasants();

    this.computeTotal();

    this.foodConsumed = this.total ** 1.5;
  }

  get turnsToChangeSize() {
    if (this.city.perTurn.food >= 0) {
      const remainingFood = this.getFoodToGrow() - this.totalFood;
      return Math.max(0, Math.ceil(remainingFood / this.city.perTurn.food));
    } else {
      return Math.max(0, Math.ceil(this.totalFood / -this.city.perTurn.food));
    }
  }

  private processSlaves() {
    // Slaves simply decline with time.
    const slaves = this.population.get("population_type_slave")!;
    this.population.set("population_type_slave", slaves * 0.99);
  }

  private processPeasants() {
    // Classic civ growth model based only on food.
    let size = this.population.get("population_type_peasant")!;
    this.totalFood += this.city.yields.food - this.foodConsumed;
    const foodToGrow = this.getFoodToGrow();
    if (this.totalFood >= foodToGrow) {
      size++;
      this.changedSize = true;
      this.totalFood -= foodToGrow;
    } else if (this.totalFood < 0) {
      if (size > 1) {
        size--;
        this.changedSize = true;
        this.totalFood += foodToGrow;
      } else {
        this.totalFood = 0;
      }
    }
    this.population.set("population_type_peasant", size);
  }

  computeTotal() {
    this.total = Math.floor(
      Array.from(this.population.values()).reduce((a, b) => a + b, 0),
    );

    const availablePopulation = new Map<string, number>();
    for (const populationType of dataManager.populationTypes.all) {
      this.workers.set(populationType.id, 0);
      availablePopulation.set(
        populationType.id,
        this.population.get(populationType.id)!,
      );
    }

    for (let i = 0; i < this.total; i++) {
      let topPopulationType: string | null = null;
      let topAmount = 0;
      for (const [populationType, amount] of availablePopulation.entries()) {
        if (amount > topAmount) {
          topAmount = amount;
          topPopulationType = populationType;
        }
      }
      const workers = this.workers.get(topPopulationType!)! + 1;
      this.workers.set(topPopulationType!, workers);
    }
  }
}
