import { rowsToFrame, type Sprite } from "../sprite.js";

// Sprite del carpincho — sección 16 del documento de diseño.
export const hero: Sprite = {
  frames: [
    rowsToFrame(["....l.", "..kkkk", "kkkkak", "kkkkkl", "kkkkk.", ".l.l.."]),
    rowsToFrame(["....l.", "..kkkk", "kkkkak", "kkkkkl", "kkkkk.", "l...l."]),
  ],
};
