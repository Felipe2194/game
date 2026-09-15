import { enemiesForFloor, enemyCountForFloor } from "../../content/enemies.js";
import {
  ANTORCHA_SPAWN_CHANCE,
  COFRE_EVERY_N_FLOORS,
  COINS_PER_FLOOR,
  POCION_PER_FLOOR,
  RACION_EVERY_N_FLOORS,
} from "../../content/items.js";
import type { ItemKind } from "../../content/items.js";
import { createEnemy } from "../entities.js";
import type { Enemy, ItemPickup } from "../entities.js";
import type { Rng } from "../rng.js";
import { nextBool, nextInt, pick, shuffle } from "../rng.js";
import type { Dungeon, Point } from "./types.js";
import { isWalkable, roomCenter } from "./types.js";

function isInRoom(room: { x: number; y: number; width: number; height: number }, p: Point): boolean {
  return p.x >= room.x && p.x < room.x + room.width && p.y >= room.y && p.y < room.y + room.height;
}

function candidateTiles(dungeon: Dungeon): Point[] {
  const startRoom = dungeon.rooms[0];
  const candidates: Point[] = [];
  for (let y = 0; y < dungeon.height; y++) {
    for (let x = 0; x < dungeon.width; x++) {
      if (!isWalkable(dungeon, x, y)) continue;
      const p = { x, y };
      if (startRoom && isInRoom(startRoom, p)) continue;
      if (dungeon.stairs && dungeon.stairs.x === x && dungeon.stairs.y === y) continue;
      candidates.push(p);
    }
  }
  return candidates;
}

export interface PopulateOptions {
  dagaFloor: number;
  capaFloor: number;
}

export interface PopulateResult {
  enemies: Enemy[];
  items: ItemPickup[];
  bushes: Point[];
  rng: Rng;
}

const BUSH_MAX_COUNT = 5;
const BUSH_CANDIDATE_DIVISOR = 6; // 1 arbusto cada ~6 casillas libres, hasta el máximo

// Enemigos y objetos según el piso (secciones 6 y 7). La sala inicial nunca
// tiene enemigos ni objetos. El piso del jefe solo tiene al Alfa, lejos
// de la entrada.
export function populateFloor(
  dungeon: Dungeon,
  floor: number,
  rng: Rng,
  options: PopulateOptions,
): PopulateResult {
  if (dungeon.isBossFloor) {
    const room = dungeon.rooms[0];
    const spot = room ? roomCenter(room) : dungeon.start;
    return { enemies: [createEnemy(0, "alfa", spot.x, spot.y)], items: [], bushes: [], rng };
  }

  const [shuffled, afterShuffle] = shuffle(rng, candidateTiles(dungeon));
  let current = afterShuffle;
  let cursor = 0;
  const take = (): Point | undefined => shuffled[cursor++];

  // Arbustos: unas pocas casillas se marcan como arbusto antes de repartir
  // enemigos y objetos. Los primeros enemigos/objetos en pedir una casilla
  // "roban" un arbusto en vez de una casilla común — así algunos arbustos
  // esconden algo y otros quedan vacíos, sin tocar la lógica de spawn en sí.
  const bushCount = Math.min(BUSH_MAX_COUNT, Math.floor(shuffled.length / BUSH_CANDIDATE_DIVISOR));
  const bushes: Point[] = [];
  for (let i = 0; i < bushCount; i++) {
    const spot = take();
    if (!spot) break;
    bushes.push(spot);
  }
  let bushCursor = 0;
  const takeBiased = (): Point | undefined => {
    if (bushCursor < bushes.length) return bushes[bushCursor++];
    return take();
  };

  const enemyPool = enemiesForFloor(floor);
  const enemyCount = enemyPool.length === 0 ? 0 : Math.min(enemyCountForFloor(floor), shuffled.length);
  const enemies: Enemy[] = [];
  for (let i = 0; i < enemyCount; i++) {
    const spot = takeBiased();
    if (!spot) break;
    const [def, afterPick] = pick(current, enemyPool);
    current = afterPick;
    enemies.push(createEnemy(i, def.kind, spot.x, spot.y));
  }

  const itemKinds: ItemKind[] = [];

  const [pocionCount, afterPocion] = nextInt(current, POCION_PER_FLOOR[0], POCION_PER_FLOOR[1]);
  current = afterPocion;
  for (let i = 0; i < pocionCount; i++) itemKinds.push("pocion");

  const [hasAntorcha, afterAntorcha] = nextBool(current, ANTORCHA_SPAWN_CHANCE);
  current = afterAntorcha;
  if (hasAntorcha) itemKinds.push("antorcha");

  if (floor % RACION_EVERY_N_FLOORS === 0) itemKinds.push("racion");
  if (floor === options.dagaFloor) itemKinds.push("daga");
  if (floor === options.capaFloor) itemKinds.push("capa");
  if (floor % COFRE_EVERY_N_FLOORS === 0) itemKinds.push("cofre");

  const [coinCount, afterCoins] = nextInt(current, COINS_PER_FLOOR[0], COINS_PER_FLOOR[1]);
  current = afterCoins;
  for (let i = 0; i < coinCount; i++) itemKinds.push("moneda");

  const items: ItemPickup[] = [];
  for (const kind of itemKinds) {
    const spot = takeBiased();
    if (!spot) break;
    items.push({ id: items.length, kind, x: spot.x, y: spot.y });
  }

  return { enemies, items, bushes, rng: current };
}

export function enemyAt(enemies: Enemy[], x: number, y: number): Enemy | undefined {
  return enemies.find((e) => e.x === x && e.y === y && e.hp > 0);
}

export function itemAt(items: ItemPickup[], x: number, y: number): ItemPickup | undefined {
  return items.find((i) => i.x === x && i.y === y);
}
