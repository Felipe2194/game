import { enemies as enemyDefs } from "../content/enemies.js";
import { deathCauseMessage } from "../content/messages.js";
import type { GameState } from "../game/state.js";

export function gameOverLines(state: GameState): string[] {
  const cause = state.deathCause ? deathCauseMessage(enemyDefs[state.deathCause], state.floor) : "Moriste.";
  return [
    "",
    "── Game over ──",
    "",
    cause,
    `Puntaje: ${state.score}`,
    `Piso alcanzado: ${state.floor}`,
    "",
    "Presioná cualquier tecla para reintentar.",
  ];
}
