import type { EnemyKind } from "../../content/enemies.js";
import { rowsToFrame, type Sprite } from "../sprite.js";

// Sprites propios (no vienen del documento): siluetas simples de 6×6,
// máximo 4 colores, ojos en `d`/`g` — reglas de estilo de la sección 10.
export const enemySprites: Record<Exclude<EnemyKind, "lobizon">, Sprite> = {
  rata: {
    frames: [
      rowsToFrame(["......", ".oooo.", "odoodo", "oooooo", "..oo..", "......"]),
      rowsToFrame(["......", ".oooo.", "odoodo", "oooooo", ".oo...", "......"]),
    ],
  },
  murcielago: {
    frames: [
      rowsToFrame(["c....c", "cc..cc", ".cccc.", "..dd..", ".cccc.", "......"]),
      rowsToFrame(["..cc..", ".cccc.", ".cccc.", "..dd..", "..cc..", "......"]),
    ],
  },
  esqueleto: {
    frames: [
      rowsToFrame([".mmmm.", "mdmmdm", ".mmmm.", "..mm..", ".m..m.", "......"]),
      rowsToFrame([".mmmm.", "mdmmdm", ".mmmm.", ".mmmm.", "m....m", "......"]),
    ],
  },
  familiar: {
    frames: [
      rowsToFrame(["......", "l....l", "llllll", "ldlldl", "llllll", ".l..l."]),
      rowsToFrame(["......", "l....l", "llllll", "ldlldl", "llllll", "l....l"]),
    ],
  },
  "luz-mala": {
    frames: [
      rowsToFrame(["......", ".eeee.", "eeggee", "eeggee", ".eeee.", "......"]),
      rowsToFrame(["......", "..ee..", ".egge.", ".egge.", "..ee..", "......"]),
    ],
  },
};
