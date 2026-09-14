import { rowsToFrame, type Sprite } from "../sprite.js";

// Sprite del cazador errante — retemado sobre la referencia de sheet.png
// ("GANK — El Monte Oscuro"). Capucha y capa en `l`, llama de la antorcha
// en `e`/`f` (parpadea entre frames). Se espeja al ir a la izquierda.
export const hero: Sprite = {
  frames: [
    rowsToFrame(["..ll.e", ".llllf", "llllll", ".llll.", ".l..l.", "......"]),
    rowsToFrame(["..ll.f", ".lllle", "llllll", ".llll.", "l...l.", "......"]),
  ],
};
