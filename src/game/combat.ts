import type { EnemyDef } from "../content/enemies.js";
import type { Rng } from "./rng.js";
import { nextBool } from "./rng.js";

// El ataque del jugador siempre acierta; el daño es su ataque (sección 5).
export function playerAttackDamage(playerAttack: number): number {
  return playerAttack;
}

// La defensa baja la probabilidad de que te peguen, no resta daño.
export function enemyHitChance(enemy: EnemyDef, playerDefense: number): number {
  const chance = enemy.precision - 0.1 * playerDefense;
  return Math.min(1, Math.max(0, chance));
}

export function resolveEnemyAttack(
  rng: Rng,
  enemy: EnemyDef,
  playerDefense: number,
): [hit: boolean, rng: Rng] {
  return nextBool(rng, enemyHitChance(enemy, playerDefense));
}
