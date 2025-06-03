import { TileCoords, TileCoordsWithUnits, UnitChanneled } from "@/shared";
import { bridge } from "@/bridge";
import { mapUi } from "@/ui/mapUi";
import { OutlineFilter } from "pixi-filters";
import { Container, Graphics, Sprite, Text } from "pixi.js";
import { Animation, Animations, AnimationSequence } from "./animation";
import { getAssets } from "./assets";
import { camera } from "./camera";
import { TILE_ROW_OFFSET, TILE_SIZE } from "./constants";
import { hexColorToNumber } from "./utils";

const UNITS_SCALE_VISIBILITY = 15;

export class UnitsDrawer {
  units = new Map<number, UnitDrawer>();
  unitsPerTile = new Map<number, number[]>();

  private selectedDrawer: UnitDrawer | null = null;

  private lastTile: TileCoords | null = null;

  private interactiveContainer = new Container({
    label: "interactive",
    interactive: true,
    interactiveChildren: true,
  });
  private nonInteractiveContainer = new Container({
    label: "non-interactive",
    interactive: false,
    interactiveChildren: false,
  });

  private tilesToUpdateNeighbours = new Map<number, TileCoordsWithUnits>();
  private tilesTimeout: NodeJS.Timeout | null = null;

  constructor(private container: Container) {
    bridge.units.updated$.subscribe((unit) => {
      this.updateUnit(unit);
    });

    bridge.units.destroyed$.subscribe((unitId) => {
      const drawer = this.units.get(unitId);
      if (drawer) {
        // Cancel any ongoing animations first
        drawer.cancelAnimation();
        
        // Explicitly remove from parent containers
        if (drawer.container.parent) {
          drawer.container.parent.removeChild(drawer.container);
        }
        
        this.units.delete(unitId);
        this.removeUnitFromTile(unitId, drawer.unit.tile.id);
        const unitIndex = drawer.unit.tile.units.findIndex(
          (u) => u.id === unitId,
        );
        if (unitIndex !== -1) {
          drawer.unit.tile.units.splice(unitIndex, 1);
        }
        this.scheduleNeighboursUpdate(drawer.unit.tile);
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
        this.scheduleNeighboursUpdate(move.tiles[0]);
        this.scheduleNeighboursUpdate(move.tiles[move.tiles.length - 1]);
      }
      this.removeUnitFromTile(move.unitId, move.tiles[0].id);
      this.addUnitToTile(move.unitId, move.tiles[move.tiles.length - 1].id);
    });

    bridge.game.start$.subscribe(() => {
      this.clear();
      this.build();
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

    mapUi.hoveredTile$.subscribe((tile) => {
      // This is a mechanism to optimize hit testing the units.
      // Thanks to this, only a small subset of units are actually interactive.
      if (this.lastTile) {
        this.setInteractive(this.lastTile.id, false);
      }
      if (tile) {
        this.setInteractive(tile.id, true);
      }
      this.lastTile = tile;
    });

    mapUi.destroyed$.subscribe(() => this.clear());

    mapUi.unitsEnabled$.subscribe((enabled) => {
      this.container.visible = enabled;
    });

    camera.scale$.subscribe((scale) => {
      this.setScale(scale);
    });

    this.container.addChild(
      this.interactiveContainer,
      this.nonInteractiveContainer,
    );
  }

  private async build() {
    const units = await bridge.units.getAll();
    for (const unit of units) {
      this.updateUnit(unit);
    }
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
    this.scheduleNeighboursUpdate(drawer.unit.tile);
  }

  private scheduleNeighboursUpdate(tile: TileCoordsWithUnits) {
    // Delays the update to the next tick. Improves perceived performance and avoids updating the same units a couple of times.
    this.tilesToUpdateNeighbours.set(tile.id, tile);
    if (!this.tilesTimeout) {
      this.tilesTimeout = setTimeout(() => {
        this.updateNeighbours();
        this.tilesTimeout = null;
      });
    }
  }

  updateNeighbours() {
    for (const tile of this.tilesToUpdateNeighbours.values()) {
      this.updateTileUnits(tile);
    }
    this.tilesToUpdateNeighbours.clear();
  }

  private updateTileUnits(tile: TileCoordsWithUnits) {
    let i = 0;
    for (const unit of tile.units) {
      const drawer = this.units.get(unit.id);
      if (drawer && !drawer.container.destroyed) {
        drawer.container.zIndex = i++;
        // Always update the tile reference to match real position
        drawer.unit.tile = tile;
        // Only correct position if not animating (animation handles position)
        if (!drawer.animation) {
          drawer.correctPosition();
        }
      }
    }
  }

  private addUnitToTile(unitId: number, tileId: number) {
    let tileUnits = this.unitsPerTile.get(tileId);
    if (!tileUnits) {
      tileUnits = [];
      this.unitsPerTile.set(tileId, tileUnits);
    }
    tileUnits.push(unitId);
  }

  private removeUnitFromTile(unitId: number, tileId: number) {
    const tileUnits = this.unitsPerTile.get(tileId);
    if (tileUnits) {
      tileUnits.splice(tileUnits.indexOf(unitId), 1);
    }
  }

  private setInteractive(tileId: number, interactive: boolean) {
    const unitIds = this.unitsPerTile.get(tileId);
    if (!unitIds) {
      return;
    }

    const container = interactive
      ? this.interactiveContainer
      : this.nonInteractiveContainer;

    let i = 0;
    for (const unitId of unitIds) {
      const drawer = this.units.get(unitId);
      if (drawer && !drawer.container.destroyed) {
        container.addChild(drawer.container);
        drawer.dehighlight();
        drawer.container.zIndex = i++;
      }
    }

    if (!interactive && this.selectedDrawer) {
      this.selectedDrawer.dehighlight();
    }
  }

  private makeUnitDrawer(unit: UnitChanneled) {
    const drawer = new UnitDrawer(unit);
    this.nonInteractiveContainer.addChild(drawer.container);
    this.units.set(unit.id, drawer);

    const unitScale = getAlphaAndScale(camera.transform.scale);
    this.container.visible = camera.transform.scale > UNITS_SCALE_VISIBILITY;
    drawer.container.scale.set(unitScale);

    this.addUnitToTile(unit.id, unit.tile.id);

    return drawer;
  }

  public setScale(scale: number) {
    const unitScale = getAlphaAndScale(scale);
    this.container.visible = scale > UNITS_SCALE_VISIBILITY;
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
  return Math.pow(0.5 / TILE_SIZE / scale, 0.5);
}

export class UnitDrawer {
  public container = new Container({ interactive: true });
  public iconContainer = new Container();
  private g = new Graphics();
  private childrenCountText: Text | null = null;
  private isSelected = false;
  public animation: Animation<any> | AnimationSequence | null = null;
  private targetPosition: [number, number] | null = null;

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
    banner.tint = hexColorToNumber(unit.colors.primary);
    banner.anchor.set(0.5, 0.5);
    icon.tint = hexColorToNumber(unit.colors.secondary);
    icon.anchor.set(0.5, 0.5);
    this.updateUi();
    this.updatePosition();

    this.iconContainer.addChild(banner, icon);
    this.container.addChild(this.iconContainer, this.g);

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
      } else if (this.unit.order === "skip" || this.unit.order === "sleep") {
        this.iconContainer.alpha = 0.8;
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
    this.animation = Animations.run({
      from: [this.container.x, this.container.y],
      to: this.tileToUnitPosition(this.unit.tile),
      duration: 100,
      fn: (pos) => {
        if (this.container && !this.container.destroyed) {
          this.container.x = pos[0];
          this.container.y = pos[1];
        }
      },
      onComplete: () => (this.animation = null),
    });
  }

  animatePosition(tiles: TileCoordsWithUnits[]) {
    this.cancelAnimation();

    const positions = tiles
      .slice(1)
      .map((tile) => this.tileToUnitPosition(tile));

    if (positions.length === 0) {
      return;
    }

    this.targetPosition = positions[positions.length - 1];

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
            if (this.container && !this.container.destroyed) {
              this.container.x = pos[0];
              this.container.y = pos[1];
            }
          },
        });
      }),
      onComplete: () => (this.animation = null),
    });
  }

  public cancelAnimation() {
    if (this.animation) {
      Animations.cancel(this.animation);
      if (this.targetPosition) {
        this.container.position.set(...this.targetPosition);
        this.targetPosition = null;
      }
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

    return [x, (tile.y + 0.75) * TILE_ROW_OFFSET];
  }
}
