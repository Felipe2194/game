import type { PaletteKey } from "../assets/palette.js";
import { tileAt, tileIndex } from "../game/dungeon/types.js";
import type { GameState } from "../game/state.js";
import type { Framebuffer } from "../engine/framebuffer.js";

const SCALE = 2;

function tileColor(tile: ReturnType<typeof tileAt>): PaletteKey {
  switch (tile) {
    case "wall":
      return "j";
    case "stairs":
      return "f";
    default:
      return "a";
  }
}

// Superposición del piso completo a 2×2 px por casilla, solo lo explorado
// (sección 11: "Mapa").
export function drawMapOverlay(fb: Framebuffer, state: GameState): void {
  const { dungeon, player } = state;
  const mapPixelWidth = dungeon.width * SCALE;
  const mapPixelHeight = dungeon.height * SCALE;
  const offsetX = Math.floor((fb.width - mapPixelWidth) / 2);
  const offsetY = Math.floor((fb.height - mapPixelHeight) / 2);

  for (let y = 0; y < dungeon.height; y++) {
    for (let x = 0; x < dungeon.width; x++) {
      const index = tileIndex(dungeon, x, y);
      if (!state.seen.has(index)) continue;
      const color = tileColor(tileAt(dungeon, x, y));
      const px = offsetX + x * SCALE;
      const py = offsetY + y * SCALE;
      for (let dy = 0; dy < SCALE; dy++) {
        for (let dx = 0; dx < SCALE; dx++) {
          fb.set(px + dx, py + dy, color);
        }
      }
    }
  }

  const playerPx = offsetX + player.x * SCALE;
  const playerPy = offsetY + player.y * SCALE;
  for (let dy = 0; dy < SCALE; dy++) {
    for (let dx = 0; dx < SCALE; dx++) {
      fb.set(playerPx + dx, playerPy + dy, "k");
    }
  }
}
