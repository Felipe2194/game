export interface SaveEntry {
  date: string;
  score: number;
  floor: number;
  cause: string;
  seed: number;
}

export interface SaveData {
  top: SaveEntry[];
}

const MAX_ENTRIES = 5;
const STORAGE_KEY = "bosque-oscuro:save";

function isSaveData(value: unknown): value is SaveData {
  return typeof value === "object" && value !== null && Array.isArray((value as SaveData).top);
}

// Persistencia en localStorage (versión web). Si falla la lectura o
// escritura (localStorage bloqueado, modo privado, etc.), el juego sigue
// sin récords y no crashea (sección 12 del documento de diseño).
export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { top: [] };
    const parsed: unknown = JSON.parse(raw);
    return isSaveData(parsed) ? parsed : { top: [] };
  } catch {
    return { top: [] };
  }
}

export function recordRun(entry: SaveEntry): SaveData {
  const current = loadSave();
  const top = [...current.top, entry].sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);
  const data: SaveData = { top };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Sin récords persistidos, pero la partida sigue.
  }

  return data;
}
