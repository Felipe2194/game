export type TileType = "wall" | "floor" | "stairs";

export interface Point {
  x: number;
  y: number;
}

export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function roomCenter(room: Room): Point {
  return {
    x: room.x + Math.floor(room.width / 2),
    y: room.y + Math.floor(room.height / 2),
  };
}

export interface Dungeon {
  width: number;
  height: number;
  tiles: TileType[]; // fila por fila (row-major)
  rooms: Room[];
  start: Point;
  stairs: Point | null; // null en el piso del jefe (10)
  isBossFloor: boolean;
}

export function tileIndex(dungeon: Pick<Dungeon, "width">, x: number, y: number): number {
  return y * dungeon.width + x;
}

export function inBounds(dungeon: Pick<Dungeon, "width" | "height">, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < dungeon.width && y < dungeon.height;
}

export function tileAt(dungeon: Dungeon, x: number, y: number): TileType {
  if (!inBounds(dungeon, x, y)) return "wall";
  return dungeon.tiles[tileIndex(dungeon, x, y)] ?? "wall";
}

export function isWalkable(dungeon: Dungeon, x: number, y: number): boolean {
  return tileAt(dungeon, x, y) !== "wall";
}
