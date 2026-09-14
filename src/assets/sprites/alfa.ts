import { rowsToFrame, type Sprite } from "../sprite.js";

// El Alfa / Gran Draco — jefe final, normal (2 frames) y agazapado
// (1 frame), sección 16.
export const alfaSprite: Sprite = {
  frames: [
    rowsToFrame(["l....l", ".llll.", "ldllld", ".llll.", "l.ll.l", "......"]),
    rowsToFrame(["l....l", ".llll.", "ldllld", ".llll.", ".l..l.", "......"]),
  ],
};

export const alfaCrouchSprite: Sprite = {
  frames: [rowsToFrame(["......", "l....l", ".llll.", "ldllld", "lllll.", ".l..l."])],
};
