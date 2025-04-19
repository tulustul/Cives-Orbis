import { TILE_HEIGHT } from "./constants";

function buildHex(): number[] {
  const yo = Math.sqrt(3) / 6;
  const my = TILE_HEIGHT / 2;
  // prettier-ignore
  return [
    0.5, 0.5,
    0, 0.5 - yo,
    0.5, 0.5 - my,
    1, 0.5 - yo,
    1, 0.5 + yo,
    0.5, 0.5 + my,
    0, 0.5 + yo,
  ];
}

const vertices = buildHex();

// prettier-ignore
const indexes: number[] = [
  0, 1, 2,
  0, 2, 3,
  0, 3, 4,
  0, 4, 5,
  0, 5, 6,
  0, 6, 1,
];

// prettier-ignore
const centerDistance: number[] = [
  0, 0,
  1, 1,
  1, 1,
  1, 1,
  1, 1,
  1, 1,
  1, 1,
]

export const HEX = {
  vertices,
  indexes,
  centerDistance,
};
