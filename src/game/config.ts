// Constantes base — ver secciones 5 y 8 del documento de diseño.
export const MAP_WIDTH = 28;
export const MAP_HEIGHT = 16;

export const ROOM_MIN_COUNT = 5;
export const ROOM_MAX_COUNT = 7;
export const ROOM_MIN_SIZE = { width: 4, height: 3 };
export const ROOM_MAX_SIZE = { width: 7, height: 5 };
export const ROOM_SEPARATION = 1;

export const TOTAL_FLOORS = 10;
export const BOSS_FLOOR = 10;

export const PLAYER_BASE = {
  maxHp: 6,
  attack: 1,
  defense: 0,
  vision: 5,
} as const;

export const BELT_CAPACITY = 3;

export const VIEWPORT_TILES_WIDE = 13;
export const VIEWPORT_TILES_TALL = 7;
export const TILE_SIZE = 6;
