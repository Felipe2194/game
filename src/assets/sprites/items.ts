import type { ItemKind } from "../../content/items.js";
import { rowsToFrame, type Sprite } from "../sprite.js";

// Sprites propios de 6×6, un frame cada uno (sección 16). Tonos cálidos
// para objetos útiles (f, n, e) — regla de estilo de la sección 10.
// Retemados sobre la referencia de sheet.png ("GANK — El Monte Oscuro").
export const itemSprites: Record<ItemKind, Sprite> = {
  pocion: {
    frames: [rowsToFrame(["..l...", "..d...", ".ddd..", ".dmd..", ".ddd..", "......"])],
  },
  antorcha: {
    frames: [rowsToFrame(["..e...", "..f...", "..f...", "..l...", "..l...", "......"])],
  },
  racion: {
    frames: [rowsToFrame(["...l..", "..ll..", ".ndd..", "ndddn.", ".nnn..", "......"])],
  },
  daga: {
    frames: [rowsToFrame(["...o..", "..oo..", ".oo...", "ll....", "l.....", "......"])],
  },
  capa: {
    frames: [rowsToFrame(["e....e", ".nnnn.", "nnnnnn", "n.nn.n", "nnnnnn", ".nnnn."])],
  },
  moneda: {
    frames: [rowsToFrame(["......", ".ffff.", ".fnnf.", ".fnnf.", ".ffff.", "......"])],
  },
};
