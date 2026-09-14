import type { EnemyKind } from "../../content/enemies.js";
import { rowsToFrame, type Sprite } from "../sprite.js";

// Sprites propios (no vienen del documento): siluetas simples de 6×6,
// máximo 4 colores, ojos en `d`/`g` — reglas de estilo de la sección 10.
// Retemados sobre la referencia de sheet.png ("GANK — El Monte Oscuro").
export const enemySprites: Record<Exclude<EnemyKind, "alfa">, Sprite> = {
  escarabajo: {
    frames: [
      rowsToFrame(["......", ".iiii.", "idiidi", "iiiiii", "..ii..", "......"]),
      rowsToFrame(["......", ".iiii.", "idiidi", "iiiiii", ".ii...", "......"]),
    ],
  },
  cuervo: {
    frames: [
      rowsToFrame(["c....c", "cc..cc", ".cccc.", "..dd..", ".cccc.", "......"]),
      rowsToFrame(["..cc..", ".cccc.", ".cccc.", "..dd..", "..cc..", "......"]),
    ],
  },
  espiritu: {
    frames: [
      rowsToFrame([".hhhh.", "hdhhdh", ".hhhh.", "..hh..", ".h..h.", "......"]),
      rowsToFrame([".hhhh.", "hdhhdh", ".hhhh.", ".hhhh.", "h....h", "......"]),
    ],
  },
  lobo: {
    frames: [
      rowsToFrame(["......", ".kk.k.", "kkkkkk", "kdkkdk", "k.kk.k", "......"]),
      rowsToFrame(["......", ".kk.k.", "kkkkkk", "kdkkdk", ".k.kk.", "......"]),
    ],
  },
  "fuego-fatuo": {
    frames: [
      rowsToFrame(["......", ".eeee.", "eeggee", "eeggee", ".eeee.", "......"]),
      rowsToFrame(["......", "..ee..", ".egge.", ".egge.", "..ee..", "......"]),
    ],
  },
};
