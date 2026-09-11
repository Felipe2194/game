import type { Action } from "../engine/input.js";
import { isWalkable, tileAt } from "./dungeon/types.js";
import type { GameState, Mode } from "./state.js";
import { descendToNextFloor, logMessage, refreshVision } from "./state.js";

export type GameEvent =
  | { type: "moved" }
  | { type: "blocked" }
  | { type: "descended"; floor: number }
  | { type: "quit" };

export interface StepResult {
  state: GameState;
  events: GameEvent[];
}

const MODE_TOGGLES: Partial<Record<Action["type"], Mode>> = {
  viewMap: "map",
  help: "help",
};

// step es pura: no toca la terminal ni el reloj. Recibe una acción y
// devuelve el estado siguiente más los eventos ocurridos, sin efectos
// secundarios — así se puede testear y simular sin pantalla.
export function step(state: GameState, action: Action): StepResult {
  if (action.type === "quit") {
    return { state, events: [{ type: "quit" }] };
  }

  // M y ? abren/cierran una pantalla superpuesta; no consumen turno.
  const toggledMode = MODE_TOGGLES[action.type];
  if (toggledMode) {
    const nextMode = state.mode === toggledMode ? "play" : toggledMode;
    return { state: { ...state, mode: nextMode }, events: [] };
  }
  if (state.mode !== "play") {
    // Cualquier otra tecla cierra la pantalla superpuesta.
    return { state: { ...state, mode: "play" }, events: [] };
  }

  if (action.type === "descend") {
    if (tileAt(state.dungeon, state.player.x, state.player.y) !== "stairs") {
      return {
        state: logMessage(state, "No hay ninguna escalera acá."),
        events: [],
      };
    }
    const next = descendToNextFloor(state);
    return {
      state: logMessage(next, `Bajás al piso ${next.floor}.`),
      events: [{ type: "descended", floor: next.floor }],
    };
  }

  if (action.type !== "move") {
    return { state, events: [] };
  }

  const nextX = state.player.x + action.dx;
  const nextY = state.player.y + action.dy;

  if (!isWalkable(state.dungeon, nextX, nextY)) {
    return { state, events: [{ type: "blocked" }] };
  }

  const facingLeft = action.dx !== 0 ? action.dx < 0 : state.facingLeft;
  const moved: GameState = {
    ...state,
    player: { ...state.player, x: nextX, y: nextY },
    facingLeft,
  };

  return { state: refreshVision(moved), events: [{ type: "moved" }] };
}
