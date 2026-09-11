import type { EnemyKind } from "../content/enemies.js";
import { enemies } from "../content/enemies.js";
import type { ItemKind } from "../content/items.js";

export interface ItemPickup {
  id: number;
  kind: ItemKind;
  x: number;
  y: number;
}

export interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  // Créditos de acción acumulados según la velocidad (sección 4): se suma
  // el factor de velocidad cada turno del jugador y el enemigo actúa una
  // vez por cada crédito entero acumulado.
  actionCredit: number;
}

export function createEnemy(id: number, kind: EnemyKind, x: number, y: number): Enemy {
  const def = enemies[kind];
  return { id, kind, x, y, hp: def.vida, maxHp: def.vida, actionCredit: 0 };
}
