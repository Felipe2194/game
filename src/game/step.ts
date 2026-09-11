import type { Action } from "../engine/input.js";
import type { GameState } from "./state.js";

export type GameEvent = { type: "moved" } | { type: "blocked" } | { type: "quit" };

export interface StepResult {
  state: GameState;
  events: GameEvent[];
}

function isWall(state: GameState, x: number, y: number): boolean {
  return x <= 0 || y <= 0 || x >= state.room.width - 1 || y >= state.room.height - 1;
}

// step es pura: no toca la terminal ni el reloj. Recibe una acción y
// devuelve el estado siguiente más los eventos ocurridos, sin efectos
// secundarios — así se puede testear y simular sin pantalla.
export function step(state: GameState, action: Action): StepResult {
  if (action.type === "quit") {
    return { state, events: [{ type: "quit" }] };
  }

  if (action.type !== "move") {
    return { state, events: [] };
  }

  const nextX = state.player.x + action.dx;
  const nextY = state.player.y + action.dy;

  if (isWall(state, nextX, nextY)) {
    return { state, events: [{ type: "blocked" }] };
  }

  const facingLeft = action.dx !== 0 ? action.dx < 0 : state.facingLeft;

  return {
    state: {
      ...state,
      player: { x: nextX, y: nextY },
      facingLeft,
    },
    events: [{ type: "moved" }],
  };
}
