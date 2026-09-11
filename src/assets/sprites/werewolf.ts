import { rowsToFrame, type Sprite } from "../sprite.js";

// Lobizón — normal (2 frames) y agazapado (1 frame), sección 16.
export const werewolfSprite: Sprite = {
  frames: [
    rowsToFrame(["l....l", ".llll.", "ldllld", ".llll.", "l.ll.l", "......"]),
    rowsToFrame(["l....l", ".llll.", "ldllld", ".llll.", ".l..l.", "......"]),
  ],
};

export const werewolfCrouchSprite: Sprite = {
  frames: [rowsToFrame(["......", "l....l", ".llll.", "ldllld", "lllll.", ".l..l."])],
};
