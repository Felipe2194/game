import type { EnemyKind } from "../../content/enemies.js";
import type { Dungeon, Point } from "../dungeon/types.js";
import { isWalkable } from "../dungeon/types.js";
import { distanceAt, stepTowards } from "./distance-map.js";
import type { Rng } from "../rng.js";
import { nextBool, pick } from "../rng.js";

const LOBO_SMELL_RANGE = 12;

function chaseIfVisible(
  dungeon: Dungeon,
  distanceMap: number[],
  enemy: Point,
  playerCanSeeEnemy: boolean,
): Point | null {
  if (!playerCanSeeEnemy) return null;
  return stepTowards(dungeon, distanceMap, enemy);
}

function randomAdjacent(dungeon: Dungeon, rng: Rng, from: Point): [Point | null, Rng] {
  const candidates: Point[] = [
    { x: from.x + 1, y: from.y },
    { x: from.x - 1, y: from.y },
    { x: from.x, y: from.y + 1 },
    { x: from.x, y: from.y - 1 },
  ].filter((p) => isWalkable(dungeon, p.x, p.y));
  if (candidates.length === 0) return [null, rng];
  return pick(rng, candidates);
}

// Devuelve la casilla a la que el enemigo intenta moverse (o null si se
// queda quieto) más el rng consumido. Sección 6/9 del documento. No cubre
// "fuego-fatuo" (ver decideGhostLightMove) ni "alfa" (salto, F5).
export function decideEnemyMove(
  kind: Exclude<EnemyKind, "fuego-fatuo" | "alfa">,
  dungeon: Dungeon,
  distanceMap: number[],
  enemy: Point,
  playerCanSeeEnemy: boolean,
  rng: Rng,
): [Point | null, Rng] {
  switch (kind) {
    case "escarabajo":
    case "espiritu":
      return [chaseIfVisible(dungeon, distanceMap, enemy, playerCanSeeEnemy), rng];

    case "cuervo": {
      const [erratic, afterCoin] = nextBool(rng, 0.5);
      if (erratic) return randomAdjacent(dungeon, afterCoin, enemy);
      return [chaseIfVisible(dungeon, distanceMap, enemy, playerCanSeeEnemy), afterCoin];
    }

    case "lobo": {
      const dist = distanceAt(dungeon, distanceMap, enemy);
      if (Number.isFinite(dist) && dist <= LOBO_SMELL_RANGE) {
        return [stepTowards(dungeon, distanceMap, enemy), rng];
      }
      return [null, rng];
    }
  }
}

function stepOnce(from: Point, player: Point): Point {
  const dx = Math.sign(player.x - from.x);
  const dy = Math.sign(player.y - from.y);
  if (dx === 0 && dy === 0) return from;
  if (Math.abs(player.x - from.x) >= Math.abs(player.y - from.y)) {
    return { x: from.x + dx, y: from.y };
  }
  return { x: from.x, y: from.y + dy };
}

// El fuego fatuo ignora paredes y siempre te rastrea: se mueve en línea
// recta hacia el jugador, un eje por turno, sin usar el mapa de distancias.
export function decideGhostLightMove(enemy: Point, player: Point): Point {
  return stepOnce(enemy, player);
}

const ALFA_JUMP_DISTANCE = 3;

// El Alfa salta hasta 3 casillas en línea recta hacia el jugador,
// deteniéndose si choca contra una pared o llega a estar adyacente
// (sección 6).
export function decideAlfaJump(dungeon: Dungeon, enemy: Point, player: Point): Point {
  let current = enemy;
  for (let i = 0; i < ALFA_JUMP_DISTANCE; i++) {
    const next = stepOnce(current, player);
    if (next.x === current.x && next.y === current.y) break; // ya llegó
    if (!isWalkable(dungeon, next.x, next.y)) break;
    current = next;
    const adjacentToPlayer = Math.abs(current.x - player.x) + Math.abs(current.y - player.y) === 1;
    if (adjacentToPlayer) break;
  }
  return current;
}
