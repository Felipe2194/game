import type { GameState } from "../game/state.js";
import type { SaveEntry } from "../storage/save.js";
import { formatRecords } from "../ui/records.js";

export function victoryLines(state: GameState, records: SaveEntry[] = []): string[] {
  return [
    "",
    "── ¡Victoria! ──",
    "",
    "Derrotaste al Alfa y volvés con vida del Monte Oscuro.",
    `Puntaje: ${state.score}`,
    `Monedas: ${state.gold}`,
    ...formatRecords(records),
    "",
    "Presioná cualquier tecla para jugar de nuevo.",
  ];
}
