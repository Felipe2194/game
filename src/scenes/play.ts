import type { PaletteKey } from "../assets/palette.js";
import { dimmed } from "../assets/palette.js";
import { hero } from "../assets/sprites/hero.js";
import { VIEWPORT_TILES_TALL, VIEWPORT_TILES_WIDE } from "../game/config.js";
import { tileAt, tileIndex } from "../game/dungeon/types.js";
import type { GameState } from "../game/state.js";
import { computeCamera } from "../ui/camera.js";
import type { Framebuffer } from "../engine/framebuffer.js";

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

export function drawPlayScene(fb: Framebuffer, state: GameState): void {
  const { dungeon, player } = state;
  const camera = computeCamera(
    player,
    dungeon.width,
    dungeon.height,
    VIEWPORT_TILES_WIDE,
    VIEWPORT_TILES_TALL,
  );

  for (let vy = 0; vy < VIEWPORT_TILES_TALL; vy++) {
    for (let vx = 0; vx < VIEWPORT_TILES_WIDE; vx++) {
      const worldX = camera.x + vx;
      const worldY = camera.y + vy;
      if (worldX < 0 || worldY < 0 || worldX >= dungeon.width || worldY >= dungeon.height) continue;

      const index = tileIndex(dungeon, worldX, worldY);
      const isVisible = state.visible.has(index);
      const isSeen = state.seen.has(index);
      if (!isVisible && !isSeen) continue; // nunca vista: queda el fondo

      const color = tileColor(tileAt(dungeon, worldX, worldY));
      fb.fillTile(vx, vy, isVisible ? color : dimmed[color]);
    }
  }

  const playerIndex = tileIndex(dungeon, player.x, player.y);
  if (state.visible.has(playerIndex)) {
    const heroX = player.x - camera.x;
    const heroY = player.y - camera.y;
    fb.drawSprite(heroX, heroY, hero, state.animFrame, state.facingLeft);
  }
}
