import { PlayerCore } from "@/core/player";
import { UnitTrait } from "@/shared";

export class AiFeatures {
  private _knowNavalExplorers: boolean | undefined;
  private _knowNavalTransport: boolean | undefined;
  private _knowSettlers: boolean | undefined;

  constructor(private player: PlayerCore) {}

  update() {
    this._knowNavalExplorers = undefined;
    this._knowNavalTransport = undefined;
    this._knowSettlers = undefined;
  }

  private getKnownUnitWithTraits(traits: UnitTrait[]): boolean {
    for (const unit of this.player.knowledge.discoveredEntities.unit) {
      let ok = true;
      for (const trait of traits) {
        if (!unit.traits.includes(trait)) {
          ok = false;
          break;
        }
      }
      if (ok) {
        return true;
      }
    }
    return false;
  }

  get knowNavalExplorers(): boolean {
    if (this._knowNavalExplorers === undefined) {
      this._knowNavalExplorers = this.getKnownUnitWithTraits([
        "naval",
        "explorer",
      ]);
    }
    return this._knowNavalExplorers as boolean;
  }

  get knowNavalTransport(): boolean {
    if (this._knowNavalTransport === undefined) {
      this._knowNavalTransport = this.getKnownUnitWithTraits([
        "naval",
        "transport",
      ]);
    }
    return this._knowNavalTransport as boolean;
  }

  get knowSettlers(): boolean {
    if (this._knowSettlers === undefined) {
      this._knowSettlers = this.getKnownUnitWithTraits(["settler"]);
    }
    return this._knowSettlers as boolean;
  }
}
