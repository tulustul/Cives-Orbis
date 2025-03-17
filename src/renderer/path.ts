import { bridge } from "@/bridge";
import { UnitPathChanneled } from "@/core/serialization/channel";
import { mapUi } from "@/ui/mapUi";
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { camera } from "./camera";
import { getTileCenter } from "./utils";

const FONT_SIZE = 0.25;

export class PathRenderer {
  pathGraphics = new Graphics();
  labelsContainer = new Container({ cullable: true });

  labels: Text[] = [];

  lastScale = camera.transform.scale;

  textStyle = new TextStyle({
    align: "center",
    fill: "white",
    fontSize: 1,
  });

  constructor(private container: Container) {
    this.container.addChild(this.pathGraphics);
    this.container.addChild(this.labelsContainer);

    mapUi.activePath$.subscribe((path) => this.buildPath(path));

    bridge.game.start$.subscribe(() => {
      this.clear();
    });

    mapUi.destroyed$.subscribe(() => this.clear());

    camera.transform$.subscribe((t) => {
      this.labelsContainer.visible = t.scale > 30;
      if (Math.abs(1 - t.scale / this.lastScale) > 0.5) {
        this.lastScale = t.scale;
        this.updateLabelsScale();
      }
    });
  }

  clear() {
    this.pathGraphics.clear();
    for (const label of this.labels) {
      label.destroy();
    }
    this.labels = [];
  }

  buildPath(path: UnitPathChanneled | null) {
    this.clear();

    const g = this.pathGraphics;

    if (!path || !path.turns.length) {
      g.visible = false;
      return;
    }
    g.visible = true;

    const turns = path.turns;

    g.moveTo(...getTileCenter(turns[0][0]));
    for (const turn of turns) {
      for (const tile of turn) {
        g.lineTo(...getTileCenter(tile));
      }
    }
    g.stroke({ width: 0.06, color: 0xdddddd });

    for (let turn = 1; turn < turns.length; turn++) {
      g.circle(...getTileCenter(turns[turn][0]), turn >= 10 ? 0.2 : 0.15);
    }
    g.fill({ color: 0x555599 });
    g.stroke({ color: 0x111111, width: 0.015 });

    const scale = camera.transform.scale;
    this.textStyle.fontSize = scale * FONT_SIZE;

    for (let turn = 1; turn < turns.length; turn++) {
      if (turns[turn][0]) {
        const label = new Text({
          text: (turn - 1 + path.startTurn).toString(),
          style: this.textStyle,
        });
        label.anchor.set(0.5, 0.5);
        this.labelsContainer.addChild(label);
        this.labels.push(label);
        label.scale.set(1 / scale, 1 / scale);
        const [x, y] = getTileCenter(turns[turn][0]);
        label.position.x = x;
        label.position.y = y;
      }
    }
  }

  updateLabelsScale() {
    const scale = camera.transform.scale;
    this.textStyle.fontSize = scale * FONT_SIZE;
    for (const label of this.labels) {
      label.scale.set(1 / scale, 1 / scale);
    }
  }
}
