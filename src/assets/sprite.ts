import type { PaletteKey } from "./palette.js";

// "." marca una celda transparente: se ve el tile de fondo debajo.
export const TRANSPARENT = "." as const;
export type SpriteCell = PaletteKey | typeof TRANSPARENT;

export interface Sprite {
  frames: SpriteCell[][][];
}

export function rowsToFrame(rows: string[]): SpriteCell[][] {
  return rows.map((row) => row.split("") as SpriteCell[]);
}
