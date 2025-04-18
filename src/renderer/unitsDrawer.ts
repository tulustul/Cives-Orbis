import { bridge } from "@/bridge";
import {
  TileCoordsWithUnits,
  UnitChanneled,
} from "@/core/serialization/channel";
import { mapUi } from "@/ui/mapUi";
import { OutlineFilter } from "pixi-filters";
import { Container, Graphics, Sprite, Text } from "pixi.js";
import { Animation, Animations, AnimationSequence } from "./animation";
import { getAssets } from "./assets";
import { camera } from "./camera";
import { TILE_SIZE } from "./constants";

export class UnitsDrawer {
  units = new Map<number, UnitDrawer>();

  private selectedDrawer: UnitDrawer | null = null;

  constructor(private container: Container) {
    bridge.units.updated$.subscribe((unit) => {
      this.updateUnit(unit);
    });

    bridge.units.destroyed$.subscribe((unitId) => {
      const drawer = this.units.get(unitId);
      if (drawer) {
        this.units.delete(unitId);
        this.updateNeighbours(drawer, drawer.unit.tile);
        drawer.destroy();
      }
    });

    bridge.units.moved$.subscribe((move) => {
      if (move.tiles.length === 0) {
        return;
      }
      const drawer = this.units.get(move.unitId);
      if (drawer) {
        drawer.animatePosition(move.tiles);
        this.updateNeighbours(drawer, move.tiles[0]);
        this.updateNeighbours(drawer, move.tiles[move.tiles.length - 1]);
      }
    });

    bridge.units.updated$.subscribe((unit) => {
      const drawer = this.units.get(unit.id);
      if (drawer) {
        drawer.unit = unit;
        drawer.updateUi();
      }
    });

    bridge.game.start$.subscribe(() => {
      this.clear();
    });

    mapUi.selectedUnit$.subscribe((unit) => {
      if (this.selectedDrawer) {
        this.selectedDrawer.deselect();
      }

      if (!unit) {
        return;
      }

      const drawer = this.units.get(unit.id);
      if (drawer) {
        this.selectedDrawer = drawer;
        drawer.select();
      }
    });

    mapUi.destroyed$.subscribe(() => this.clear());
  }

  private updateUnit(unit: UnitChanneled) {
    let drawer = this.units.get(unit.id);
    if (drawer) {
      drawer.unit = unit;
    } else {
      drawer = this.makeUnitDrawer(unit);
    }
    this.updateDrawer(drawer);
  }

  private updateDrawer(drawer: UnitDrawer) {
    drawer.updateUi();
    this.updateNeighbours(drawer, drawer.unit.tile);
  }

  private updateNeighbours(drawer: UnitDrawer, tile: TileCoordsWithUnits) {
    for (const unit of tile.units) {
      const otherDrawer = this.units.get(unit.id);
      if (otherDrawer && otherDrawer !== drawer) {
        otherDrawer.unit.tile = tile;
        otherDrawer.correctPosition();
      }
    }
  }

  private makeUnitDrawer(unit: UnitChanneled) {
    const drawer = new UnitDrawer(unit);
    this.container.addChild(drawer.container);
    this.units.set(unit.id, drawer);

    const [unitScale, alpha] = getAlphaAndScale(camera.transform.scale);
    drawer.container.alpha = alpha;
    drawer.container.scale.set(unitScale);

    return drawer;
  }

  public setScale(scale: number) {
    const [unitScale, alpha] = getAlphaAndScale(scale);
    this.container.alpha = alpha;
    for (const drawer of this.units.values()) {
      drawer.container.scale.set(unitScale);
    }
  }

  clear() {
    for (const drawer of this.units.values()) {
      drawer.destroy();
    }
    this.units.clear();
  }
}

function getAlphaAndScale(scale: number) {
  let alpha = 1;
  if (scale < 20) {
    // alpha = 0;
    alpha = Math.max(0, 1 - (20 - scale) / 8);
  }
  const unitScale = Math.pow(0.5 / TILE_SIZE / scale, 0.5);
  return [unitScale, alpha];
}

export class UnitDrawer {
  public container = new Container();
  public iconContainer = new Container();
  private g = new Graphics();
  private childrenCountText: Text | null = null;
  private isSelected = false;
  private animation: Animation<any> | AnimationSequence | null = null;

  static selectionFilter = new OutlineFilter({
    color: 0xffffff,
    alpha: 1,
    thickness: 4,
    quality: 1,
  });

  static highlightFilter = new OutlineFilter({
    color: 0xffffff,
    alpha: 0.5,
    thickness: 4,
    quality: 1,
  });

  constructor(public unit: UnitChanneled) {
    const textures = getAssets().unitsSpritesheet.textures;
    const banner = new Sprite(textures[`unitBackground-${unit.type}.png`]);
    const icon = new Sprite(textures[`${unit.definitionId}.png`]);
    banner.tint = unit.cssColor;
    banner.anchor.set(0.5, 0.5);
    icon.anchor.set(0.5, 0.5);
    this.updateUi();
    this.updatePosition();

    this.iconContainer.addChild(banner, icon);
    this.container.addChild(this.iconContainer, this.g);

    this.container.interactive = true;
    this.container.on("pointerover", () => this.highlight());
    this.container.on("pointerout", () => this.dehighlight());
    this.container.on("click", () => mapUi.selectUnit(this.unit.id));
  }

  destroy() {
    this.cancelAnimation();
    this.container.destroy();
  }

  updateUi() {
    this.container.visible = this.unit.parentId === null;
    this.g.clear();

    if (this.unit.canControl) {
      if (this.unit.actions === "none") {
        this.iconContainer.alpha = 0.5;
        // } else if (this.unit.order === "skip" || this.unit.order === "sleep") {
        //   this.iconContainer.alpha = 0.7;
      } else {
        this.iconContainer.alpha = 1;
      }
    }

    this.drawStatusIcon();
    this.drawHealthBar();
    this.drawChildrenCount();
  }

  private drawStatusIcon() {
    let color = 0;

    if (!this.unit.actionPointsLeft) {
      color = 0xff2222;
    } else if (this.unit.order === "skip" || this.unit.order === "sleep") {
      color = 0x6666ff;
    }

    if (color) {
      this.g
        .circle(35, -35, 8)
        .stroke({ width: 10, color: 0x333333 })
        .fill(color);
    }
  }

  private drawHealthBar() {
    if (this.unit.health === 100) {
      return;
    }

    this.g
      .rect(-40, -65, 80, 13)
      .stroke({ width: 5, color: 0x333333 })
      .fill(0x999999);

    let healthColor = 0x45d845;
    if (this.unit.health < 35) {
      healthColor = 0xff0000;
    } else if (this.unit.health < 70) {
      healthColor = 0xffa500;
    }
    this.g.rect(-40, -65, (this.unit.health / 100) * 80, 13).fill(healthColor);
  }

  private drawChildrenCount() {
    if (this.unit.childrenIds.length === 0) {
      if (this.childrenCountText) {
        this.childrenCountText.visible = false;
      }
      return;
    }

    if (!this.childrenCountText) {
      this.childrenCountText = new Text({
        style: { fontSize: 30, fill: "white" },
      });
      this.childrenCountText.position.set(-35, -35);
      this.childrenCountText.anchor.set(0.5, 0.5);
      this.childrenCountText.zIndex = 10;
      this.container.addChild(this.childrenCountText);
    }

    this.g
      .circle(-35, -35, 16)
      .stroke({ width: 6, color: 0x333333 })
      .fill(0x555555);

    this.childrenCountText.visible = true;
    this.childrenCountText.text = this.unit.childrenIds.length.toString();
  }

  private updatePosition() {
    this.updateZIndex();
    const [x, y] = this.tileToUnitPosition(this.unit.tile);
    this.container.x = x;
    this.container.y = y;
  }

  correctPosition() {
    this.cancelAnimation();
    this.updateZIndex();
    this.animation = Animations.run({
      from: [this.container.x, this.container.y],
      to: this.tileToUnitPosition(this.unit.tile),
      duration: 100,
      fn: (pos) => {
        this.container.x = pos[0];
        this.container.y = pos[1];
      },
      onComplete: () => (this.animation = null),
    });
  }

  animatePosition(tiles: TileCoordsWithUnits[]) {
    this.cancelAnimation();

    const positions = tiles
      .slice(1)
      .map((tile) => this.tileToUnitPosition(tile));

    this.animation = Animations.sequence({
      animations: positions.map((pos, i) => {
        return Animations.new({
          from: [
            i === 0 ? this.container.x : positions[i - 1][0],
            i === 0 ? this.container.y : positions[i - 1][1],
          ],
          to: pos,
          duration: 150,
          fn: (pos) => {
            if (this.container) {
              this.container.x = pos[0];
              this.container.y = pos[1];
            } else {
              console.warn("not found container");
            }
          },
          onComplete: () => (this.animation = null),
        });
      }),
    });
  }

  private cancelAnimation() {
    if (this.animation) {
      Animations.cancel(this.animation);
      this.animation = null;
    }
  }

  highlight() {
    if (this.isSelected || !this.unit.canControl) {
      return;
    }
    this.container.filters = [UnitDrawer.highlightFilter];
  }

  dehighlight() {
    if (this.isSelected) {
      return;
    }
    this.container.filters = [];
  }

  select() {
    this.isSelected = true;
    this.updateZIndex();
    this.container.zIndex += 1000;
    this.container.filters = [UnitDrawer.selectionFilter];
  }

  deselect() {
    this.isSelected = false;
    this.container.filters = [];
    this.updateZIndex();
  }

  updateZIndex() {
    this.container.zIndex = this.unit.tile.units.findIndex(
      (u) => u.id === this.unit.id,
    );
  }

  tileToUnitPosition(
    tile: TileCoordsWithUnits,
    ignoreOthers = false,
  ): [number, number] {
    let x = tile.x + (tile.y % 2 ? 1 : 0.5);

    const parentUnits = tile.units.filter((u) => u.parentId === null);
    if (!ignoreOthers && parentUnits.length > 1) {
      const index = parentUnits.findIndex((u) => u.id === this.unit.id);
      x += ((index - (parentUnits.length - 1) / 2) / parentUnits.length) * 0.8;
    }

    return [x, (tile.y + 0.75) * 0.75];
  }
}
