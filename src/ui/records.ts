import type { SaveEntry } from "../storage/save.js";

// Las 5 mejores partidas (sección 12): fecha, puntaje, piso y causa.
export function formatRecords(records: SaveEntry[]): string[] {
  if (records.length === 0) return [];
  return [
    "",
    "Mejores puntajes:",
    ...records.map((r, i) => {
      const date = new Date(r.date).toLocaleDateString();
      return `${i + 1}. ${r.score} pts · piso ${r.floor} · ${r.cause} · ${date}`;
    }),
  ];
}
