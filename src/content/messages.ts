import type { EnemyDef } from "./enemies.js";

export function playerAttackMessage(enemy: EnemyDef, damage: number): string {
  return `Le pegás a ${enemy.nombre} (-${damage}).`;
}

export function enemyDefeatedMessage(enemy: EnemyDef): string {
  return `Derrotaste a ${enemy.nombre}.`;
}

export function enemyHitMessage(enemy: EnemyDef, damage: number): string {
  return `${capitalize(enemy.nombre)} ${enemy.verbo} (-${damage}).`;
}

export function enemyMissedMessage(enemy: EnemyDef): string {
  return `${capitalize(enemy.nombre)} falló el golpe.`;
}

export function deathCauseMessage(enemy: EnemyDef, floor: number): string {
  return `Te mató ${enemy.nombre} en el piso ${floor}.`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
