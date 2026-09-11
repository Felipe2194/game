import type { ItemKind } from "../../content/items.js";
import { rowsToFrame, type Sprite } from "../sprite.js";

// Sprites propios de 6×6, un frame cada uno (sección 16). Tonos cálidos
// para objetos útiles (f, n, e) — regla de estilo de la sección 10.
export const itemSprites: Record<ItemKind, Sprite> = {
  mate: {
    frames: [rowsToFrame(["...n..", ".llll.", ".llll.", ".llll.", "..ll..", "......"])],
  },
  vela: {
    frames: [rowsToFrame(["..e...", "..f...", "..f...", "..f...", ".fff..", "......"])],
  },
  alfajor: {
    frames: [rowsToFrame(["......", ".llll.", "lnnnnl", "lnnnnl", ".llll.", "......"])],
  },
  facon: {
    frames: [rowsToFrame(["...o..", "..oo..", ".oo...", "ll....", "l.....", "......"])],
  },
  poncho: {
    frames: [rowsToFrame(["e....e", ".nnnn.", "nnnnnn", "n.nn.n", "nnnnnn", ".nnnn."])],
  },
  moneda: {
    frames: [rowsToFrame(["......", ".ffff.", ".fnnf.", ".fnnf.", ".ffff.", "......"])],
  },
};
