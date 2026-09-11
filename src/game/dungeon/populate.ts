import { enemiesForFloor, enemyCountForFloor } from "../../content/enemies.js";
import { createEnemy } from "../entities.js";
import type { Enemy } from "../entities.js";
import type { Rng } from "../rng.js";
import { pick, shuffle } from "../rng.js";
import type { Dungeon, Point } from "./types.js";
import { isWalkable } from "./types.js";

function isInRoom(room: { x: number; y: number; width: number; height: number }, p: Point): boolean {
  return p.x >= room.x && p.x < room.x + room.width && p.y >= room.y && p.y < room.y + room.height;
}

// Enemigos y objetos según el piso (sección 6): la sala inicial nunca
// tiene enemigos. El piso del jefe se puebla aparte (F5).
export function populateFloor(dungeon: Dungeon, floor: number, rng: Rng): [Enemy[], Rng] {
  if (dungeon.isBossFloor) return [[], rng];

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

  const pool = enemiesForFloor(floor);
  if (pool.length === 0 || candidates.length === 0) return [[], rng];

  const count = Math.min(enemyCountForFloor(floor), candidates.length);
  const [shuffled, afterShuffle] = shuffle(rng, candidates);
  let current = afterShuffle;
  const enemies: Enemy[] = [];

  for (let i = 0; i < count; i++) {
    const spot = shuffled[i] as Point;
    const [def, afterPick] = pick(current, pool);
    current = afterPick;
    enemies.push(createEnemy(i, def.kind, spot.x, spot.y));
  }

  return [enemies, current];
}

export function enemyAt(enemies: Enemy[], x: number, y: number): Enemy | undefined {
  return enemies.find((e) => e.x === x && e.y === y && e.hp > 0);
}
