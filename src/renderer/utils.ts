import { Container, Geometry, Graphics, Sprite, Texture } from "pixi.js";

import { TileCoords } from "@/core/serialization/channel";

// prettier-ignore
const HEX_VERTICES = [
  0, 0.25, 0.5, 0, 1, 0.25,
  0, 0.25, 1, 0.25, 1, 0.75,
  0, 0.25, 1, 0.75, 0, 0.75,
  0, 0.75, 1, 0.75, 0.5, 1,
]

export const HEX_GEOMETRY = new Geometry({
  attributes: {
    aVertexPosition: { buffer: HEX_VERTICES, format: "float32x2" },
    // aUvs: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  },
});

export function getTileCenter(tile: TileCoords): [number, number] {
  return [0.5 + tile.x + (tile.y % 2 ? 0.5 : 0), tile.y * 0.75 + 0.5];
}

export function getTileCoords(tile: TileCoords): [number, number] {
  return [tile.x + (tile.y % 2 ? 0.5 : 0), tile.y * 0.75];
}

export function drawHex(graphics: Graphics, x = 0, y = 0) {
  x += y % 2 ? 0.5 : 0;
  y *= 0.75;
  graphics.moveTo(x + 0, y + 0.25);
  graphics.lineTo(x + 0.5, y + 0);
  graphics.lineTo(x + 1, y + 0.25);
  graphics.lineTo(x + 1, y + 0.75);
  graphics.lineTo(x + 0.5, y + 1);
  graphics.lineTo(x + 0, y + 0.75);
}

export function drawClosedHex(graphics: Graphics) {
  drawHex(graphics);
  graphics.lineTo(0, 0.25);
}

export function clearContainer(container: Container) {
  while (container.children.length) {
    container.removeChildAt(0);
    // TODO destroy child?
  }
}

export function getTileVariants(tileName: string, variants: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < variants; i++) {
    result.push(`${tileName}${i.toString().padStart(2, "0")}.png`);
  }
  return result;
}

export function drawTileSprite(tile: TileCoords, texture: Texture, scale = 1) {
  const sprite = new Sprite(texture);
  putContainerAtTile(sprite, tile, scale);
  return sprite;
}

export function putContainerAtTile(
  sprite: Sprite,
  tile: TileCoords,
  scale = 1,
) {
  sprite.scale.set(scale / sprite.texture.width, scale / sprite.texture.width);
  sprite.anchor.set(0, 1);
  // sprite.zIndex = -tile.y;
  sprite.position.x = tile.x + (tile.y % 2 ? 0.5 : 0);
  sprite.position.y = tile.y * 0.75 + 1;
  return sprite;
}

export function putSpriteAtTileCentered(
  sprite: Sprite,
  tile: TileCoords,
  scale = 1,
) {
  sprite.scale.set(scale / sprite.texture.width, scale / sprite.texture.width);
  sprite.position.x = tile.x + (tile.y % 2 ? 0.5 : 0) + 0.5;
  sprite.position.y = tile.y * 0.75 + 0.5;
}
