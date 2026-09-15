import { enemies as enemyDefs } from "../content/enemies.js";
import { deathCauseMessage } from "../content/messages.js";
import type { GameState } from "../game/state.js";
import type { SaveEntry } from "../storage/save.js";
import { formatRecords } from "../ui/records.js";

export function gameOverLines(state: GameState, records: SaveEntry[] = []): string[] {
  const cause = state.deathCause ? deathCauseMessage(enemyDefs[state.deathCause], state.floor) : "Moriste.";
  return [
    "",
    "── Game over ──",
    "",
    cause,
    `Puntaje: ${state.score}`,
    `Zona alcanzada: ${state.floor}`,
    ...formatRecords(records),
    "",
    "Presioná cualquier tecla para reintentar.",
  ];
}
