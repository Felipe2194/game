import type { EnemyKind } from "../content/enemies.js";

export type GameEvent =
  | { type: "moved" }
  | { type: "blocked" }
  | { type: "attacked"; enemyKind: EnemyKind; defeated: boolean }
  | { type: "descended"; floor: number }
  | { type: "gameover"; cause: EnemyKind; floor: number }
  | { type: "restartRequested" }
  | { type: "quit" };
