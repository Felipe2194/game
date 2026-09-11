import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

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

// homedir() se resuelve en cada llamada (no al importar el módulo) para
// que siempre refleje el usuario/entorno actual.
function saveDir(): string {
  return join(homedir(), ".salamanca");
}

function savePath(): string {
  return join(saveDir(), "save.json");
}

function isSaveData(value: unknown): value is SaveData {
  return typeof value === "object" && value !== null && Array.isArray((value as SaveData).top);
}

// Si falla la lectura o escritura, el juego sigue sin récords y no
// crashea (sección 12 del documento de diseño).
export function loadSave(): SaveData {
  try {
    const raw = readFileSync(savePath(), "utf8");
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
    const dir = saveDir();
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(savePath(), JSON.stringify(data, null, 2), "utf8");
  } catch {
    // Sin récords persistidos, pero la partida sigue.
  }

  return data;
}
