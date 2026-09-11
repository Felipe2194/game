import { enemies as enemyDefs, speedFactor } from "../content/enemies.js";
import { enemyHitMessage, enemyMissedMessage } from "../content/messages.js";
import { decideEnemyMove, decideGhostLightMove } from "./ai/behaviors.js";
import { computeDistanceMap } from "./ai/distance-map.js";
import { resolveEnemyAttack } from "./combat.js";
import { isWalkable, tileIndex, type Point } from "./dungeon/types.js";
import type { Enemy } from "./entities.js";
import type { GameEvent } from "./events.js";
import { logMessage } from "./state.js";
import type { GameState } from "./state.js";

function isAdjacent(a: Point, b: Point): boolean {
  return (a.x === b.x && Math.abs(a.y - b.y) === 1) || (a.y === b.y && Math.abs(a.x - b.x) === 1);
}

function canOccupy(state: GameState, enemies: Enemy[], kind: string, pos: Point, selfId: number): boolean {
  if (kind !== "luz-mala" && !isWalkable(state.dungeon, pos.x, pos.y)) return false;
  return !enemies.some((e) => e.id !== selfId && e.hp > 0 && e.x === pos.x && e.y === pos.y);
}

// Cada enemigo acumula acciones según su velocidad y actúa (sección 4).
// Un solo mapa de distancias por turno sirve para todos (sección 9).
export function resolveEnemyTurns(state: GameState): { state: GameState; events: GameEvent[] } {
  const distanceMap = computeDistanceMap(state.dungeon, state.player);
  const enemies = state.enemies.map((e) => ({ ...e }));
  const events: GameEvent[] = [];

  let rng = state.rng;
  let playerHp = state.player.hp;
  let messages: string[] = [];
  let died: Enemy["kind"] | null = null;

  for (const enemy of enemies) {
    if (died) break;
    const def = enemyDefs[enemy.kind];
    let credit = enemy.actionCredit + speedFactor(def.velocidad);

    while (credit >= 1) {
      credit -= 1;

      if (isAdjacent(enemy, state.player)) {
        const [hit, nextRng] = resolveEnemyAttack(rng, def, state.player.defense);
        rng = nextRng;
        if (hit) {
          playerHp -= def.dano;
          messages.push(enemyHitMessage(def, def.dano));
          if (playerHp <= 0) {
            died = enemy.kind;
            break;
          }
        } else {
          messages.push(enemyMissedMessage(def));
        }
        continue;
      }

      let nextPos: Point | null;
      if (def.kind === "luz-mala") {
        const candidate = decideGhostLightMove(enemy, state.player);
        nextPos = candidate.x === enemy.x && candidate.y === enemy.y ? null : candidate;
      } else if (def.kind === "lobizon") {
        nextPos = null; // el salto del jefe se resuelve en F5
      } else {
        const playerCanSeeEnemy = state.visible.has(tileIndex(state.dungeon, enemy.x, enemy.y));
        const [candidate, nextRng] = decideEnemyMove(
          def.kind,
          state.dungeon,
          distanceMap,
          enemy,
          playerCanSeeEnemy,
          rng,
        );
        rng = nextRng;
        nextPos = candidate;
      }

      if (!nextPos) continue;

      if (nextPos.x === state.player.x && nextPos.y === state.player.y) {
        const [hit, nextRng] = resolveEnemyAttack(rng, def, state.player.defense);
        rng = nextRng;
        if (hit) {
          playerHp -= def.dano;
          messages.push(enemyHitMessage(def, def.dano));
          if (playerHp <= 0) {
            died = enemy.kind;
            break;
          }
        } else {
          messages.push(enemyMissedMessage(def));
        }
        continue;
      }

      if (canOccupy(state, enemies, def.kind, nextPos, enemy.id)) {
        enemy.x = nextPos.x;
        enemy.y = nextPos.y;
      }
    }

    enemy.actionCredit = credit;
  }

  let next: GameState = { ...state, enemies, player: { ...state.player, hp: Math.max(0, playerHp) }, rng };
  for (const message of messages) next = logMessage(next, message);

  if (died) {
    next = { ...next, mode: "gameover", deathCause: died };
    events.push({ type: "gameover", cause: died, floor: state.floor });
  }

  return { state: next, events };
}
