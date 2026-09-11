import {
  BOSS_FLOOR,
  MAP_HEIGHT,
  MAP_WIDTH,
  ROOM_MAX_COUNT,
  ROOM_MAX_SIZE,
  ROOM_MIN_COUNT,
  ROOM_MIN_SIZE,
  ROOM_SEPARATION,
} from "../config.js";
import type { Rng } from "../rng.js";
import { nextBool, nextInt } from "../rng.js";
import { computeDistanceMap, distanceAt } from "../ai/distance-map.js";
import type { Dungeon, Point, Room, TileType } from "./types.js";
import { roomCenter, tileIndex } from "./types.js";

const MAX_GENERATION_ATTEMPTS = 200;
const MAX_ROOM_PLACEMENT_ATTEMPTS_PER_ROOM = 60;

function roomsTooClose(a: Room, b: Room, separation: number): boolean {
  return !(
    a.x + a.width + separation <= b.x ||
    b.x + b.width + separation <= a.x ||
    a.y + a.height + separation <= b.y ||
    b.y + b.height + separation <= a.y
  );
}

function carveRoom(tiles: TileType[], width: number, room: Room): void {
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      tiles[y * width + x] = "floor";
    }
  }
}

function carveHorizontal(tiles: TileType[], width: number, y: number, x1: number, x2: number): void {
  const from = Math.min(x1, x2);
  const to = Math.max(x1, x2);
  for (let x = from; x <= to; x++) {
    tiles[y * width + x] = "floor";
  }
}

function carveVertical(tiles: TileType[], width: number, x: number, y1: number, y2: number): void {
  const from = Math.min(y1, y2);
  const to = Math.max(y1, y2);
  for (let y = from; y <= to; y++) {
    tiles[y * width + x] = "floor";
  }
}

function carveCorridor(
  tiles: TileType[],
  width: number,
  from: Point,
  to: Point,
  horizontalFirst: boolean,
): void {
  if (horizontalFirst) {
    carveHorizontal(tiles, width, from.y, from.x, to.x);
    carveVertical(tiles, width, to.x, from.y, to.y);
  } else {
    carveVertical(tiles, width, from.x, from.y, to.y);
    carveHorizontal(tiles, width, to.y, from.x, to.x);
  }
}

function placeRooms(rng: Rng): [Room[], Rng] {
  let current = rng;
  const rooms: Room[] = [];

  const [targetCount, afterCount] = nextInt(current, ROOM_MIN_COUNT, ROOM_MAX_COUNT);
  current = afterCount;

  for (let i = 0; i < targetCount; i++) {
    for (let attempt = 0; attempt < MAX_ROOM_PLACEMENT_ATTEMPTS_PER_ROOM; attempt++) {
      const [width, afterW] = nextInt(current, ROOM_MIN_SIZE.width, ROOM_MAX_SIZE.width);
      const [height, afterH] = nextInt(afterW, ROOM_MIN_SIZE.height, ROOM_MAX_SIZE.height);
      const [x, afterX] = nextInt(afterH, 1, MAP_WIDTH - width - 2);
      const [y, afterY] = nextInt(afterX, 1, MAP_HEIGHT - height - 2);
      current = afterY;

      const candidate: Room = { x, y, width, height };
      const overlaps = rooms.some((room) => roomsTooClose(candidate, room, ROOM_SEPARATION));
      if (!overlaps) {
        rooms.push(candidate);
        break;
      }
    }
  }

  return [rooms, current];
}

function generateNormalFloor(rng: Rng): [Dungeon, Rng] | null {
  const tiles: TileType[] = new Array(MAP_WIDTH * MAP_HEIGHT).fill("wall");
  const [rooms, afterRooms] = placeRooms(rng);
  let current = afterRooms;

  if (rooms.length < 3) return null;

  for (const room of rooms) carveRoom(tiles, MAP_WIDTH, room);

  // Conecta las salas en orden, más un pasillo extra para generar un circuito.
  for (let i = 0; i < rooms.length - 1; i++) {
    const [horizontalFirst, next] = nextBool(current);
    current = next;
    carveCorridor(
      tiles,
      MAP_WIDTH,
      roomCenter(rooms[i] as Room),
      roomCenter(rooms[i + 1] as Room),
      horizontalFirst,
    );
  }
  if (rooms.length >= 3) {
    const [horizontalFirst, next] = nextBool(current);
    current = next;
    carveCorridor(
      tiles,
      MAP_WIDTH,
      roomCenter(rooms[0] as Room),
      roomCenter(rooms[rooms.length - 1] as Room),
      horizontalFirst,
    );
  }

  const start = roomCenter(rooms[0] as Room);
  const partial: Dungeon = {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    tiles,
    rooms,
    start,
    stairs: null,
    isBossFloor: false,
  };

  const distances = computeDistanceMap(partial, start);
  let stairsRoom: Room | null = null;
  let stairsDistance = -1;
  for (const room of rooms.slice(1)) {
    const center = roomCenter(room);
    const dist = distanceAt(partial, distances, center);
    if (Number.isFinite(dist) && dist > stairsDistance) {
      stairsDistance = dist;
      stairsRoom = room;
    }
  }

  if (!stairsRoom || !Number.isFinite(stairsDistance)) return null;

  const stairs = roomCenter(stairsRoom);
  tiles[tileIndex(partial, stairs.x, stairs.y)] = "stairs";

  return [{ ...partial, stairs }, current];
}

function generateBossFloor(rng: Rng): [Dungeon, Rng] {
  const width = 10;
  const height = 8;
  const x = Math.floor((MAP_WIDTH - width) / 2);
  const y = Math.floor((MAP_HEIGHT - height) / 2);
  const room: Room = { x, y, width, height };

  const tiles: TileType[] = new Array(MAP_WIDTH * MAP_HEIGHT).fill("wall");
  carveRoom(tiles, MAP_WIDTH, room);

  const start: Point = { x: room.x + Math.floor(room.width / 2), y: room.y + room.height - 2 };

  return [
    {
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
      tiles,
      rooms: [room],
      start,
      stairs: null,
      isBossFloor: true,
    },
    rng,
  ];
}

// Genera un piso válido para el número de piso dado. Determinista: la
// misma semilla (mismo Rng de entrada) siempre da el mismo piso.
export function generateDungeon(rng: Rng, floorNumber: number): [Dungeon, Rng] {
  if (floorNumber === BOSS_FLOOR) {
    return generateBossFloor(rng);
  }

  let current = rng;
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const result = generateNormalFloor(current);
    if (result) return result;
    // Si falló la validación, se consumen más números al azar y se reintenta.
    const [, next] = nextInt(current, 0, 1);
    current = next;
  }
  throw new Error(`No se pudo generar un piso válido para el piso ${floorNumber}`);
}
