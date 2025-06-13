import { UnitGroupDetailsChanneled } from "@/shared";
import { mapUi } from "@/ui/mapUi";
import { Container, Graphics } from "pixi.js";
import { getTileCenter } from "./utils";

const RADIUS = 0.35;
const GAP = 0.6;
const WIDTH = 0.05;
const SPEED = 1.5;
const ALPHA = 0.6;
const HACKY_SCALE = 50; // A hack to increase the number of segments

export class SelectedUnitDrawer {
  g = new Graphics();

  constructor(private container: Container) {
    this.container.addChild(this.g);

    mapUi.selectedUnit$.subscribe((unit) => {
      this.clear();

      if (unit) {
        this.drawSpinner(unit);
      }
    });

    mapUi.destroyed$.subscribe(() => this.clear());
  }

  clear() {
    this.g.clear();
  }

  private drawSpinner(unit: UnitGroupDetailsChanneled) {
    const [centerX, centerY] = getTileCenter(unit.tile);
    const radius = RADIUS * HACKY_SCALE;
    const spinnerWidth = WIDTH * HACKY_SCALE;

    this.g.clear();

    this.g.position.set(centerX, centerY);
    this.g
      .arc(0, 0, radius, 0, Math.PI * GAP)
      .moveTo(-radius, 0)
      .arc(0, 0, radius, Math.PI, Math.PI * (1 + GAP))
      .stroke({
        width: spinnerWidth,
        color: unit.actionPointsLeft ? 0x33cc33 : 0xcc3333,
        alpha: ALPHA,
      });
    this.g.scale.set(1 / HACKY_SCALE);
  }

  public tick(delta: number) {
    this.g.rotation += (delta / 1000) * SPEED;
  }
}
