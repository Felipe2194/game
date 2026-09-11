import type { EnemyKind } from "../../content/enemies.js";
import type { Dungeon, Point } from "../dungeon/types.js";
import { isWalkable } from "../dungeon/types.js";
import { distanceAt, stepTowards } from "./distance-map.js";
import type { Rng } from "../rng.js";
import { nextBool, pick } from "../rng.js";

const FAMILIAR_SMELL_RANGE = 12;

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
// "luz-mala" (ver decideGhostLightMove) ni "lobizon" (salto, F5).
export function decideEnemyMove(
  kind: Exclude<EnemyKind, "luz-mala" | "lobizon">,
  dungeon: Dungeon,
  distanceMap: number[],
  enemy: Point,
  playerCanSeeEnemy: boolean,
  rng: Rng,
): [Point | null, Rng] {
  switch (kind) {
    case "rata":
    case "esqueleto":
      return [chaseIfVisible(dungeon, distanceMap, enemy, playerCanSeeEnemy), rng];

    case "murcielago": {
      const [erratic, afterCoin] = nextBool(rng, 0.5);
      if (erratic) return randomAdjacent(dungeon, afterCoin, enemy);
      return [chaseIfVisible(dungeon, distanceMap, enemy, playerCanSeeEnemy), afterCoin];
    }

    case "familiar": {
      const dist = distanceAt(dungeon, distanceMap, enemy);
      if (Number.isFinite(dist) && dist <= FAMILIAR_SMELL_RANGE) {
        return [stepTowards(dungeon, distanceMap, enemy), rng];
      }
      return [null, rng];
    }
  }
}

// La luz mala ignora paredes y siempre te rastrea: se mueve en línea recta
// hacia el jugador, un eje por turno, sin usar el mapa de distancias.
export function decideGhostLightMove(enemy: Point, player: Point): Point {
  const dx = Math.sign(player.x - enemy.x);
  const dy = Math.sign(player.y - enemy.y);
  if (dx === 0 && dy === 0) return enemy;
  if (Math.abs(player.x - enemy.x) >= Math.abs(player.y - enemy.y)) {
    return { x: enemy.x + dx, y: enemy.y };
  }
  return { x: enemy.x, y: enemy.y + dy };
}
