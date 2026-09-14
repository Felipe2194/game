import type { PaletteKey } from "../assets/palette.js";
import { dimmed } from "../assets/palette.js";
import type { EnemyKind } from "../content/enemies.js";
import type { ItemKind } from "../content/items.js";
import { VIEWPORT_TILES_TALL, VIEWPORT_TILES_WIDE } from "../game/config.js";
import { tileAt, tileIndex } from "../game/dungeon/types.js";
import type { GameState } from "../game/state.js";
import { computeCamera } from "../ui/camera.js";
import type { Framebuffer } from "../engine/framebuffer.js";
import type { EntitySpritePlacement } from "../engine/renderer.js";

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

// Dibuja el mapa de tiles (paredes/piso/escalera) en el framebuffer de
// paleta. Personajes/criaturas/objetos van aparte, ver `playEntitySprites`
// — se dibujan como sprites de Three.js con imágenes reales recortadas de
// sheet.png, no como pixel art del framebuffer.
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
}

const SPRITE_ROOT = "/sprites/";

const ENEMY_SPRITE: Record<Exclude<EnemyKind, "alfa">, { file: string; heightTiles: number }> = {
  escarabajo: { file: "escarabajo.png", heightTiles: 0.9 },
  cuervo: { file: "cuervo.png", heightTiles: 1.0 },
  espiritu: { file: "espiritu.png", heightTiles: 1.4 },
  lobo: { file: "lobo.png", heightTiles: 1.3 },
  "fuego-fatuo": { file: "fuego-fatuo.png", heightTiles: 1.0 },
};

// "moneda" no tiene arte en sheet.png: usa un ícono generado aparte, a
// tono con la paleta del juego, pero por el mismo pipeline de sprites que
// el resto para que no desentone en tamaño.
const ITEM_SPRITE: Record<ItemKind, { file: string; heightTiles: number }> = {
  pocion: { file: "pocion.png", heightTiles: 0.8 },
  antorcha: { file: "antorcha.png", heightTiles: 0.8 },
  racion: { file: "racion.png", heightTiles: 0.8 },
  daga: { file: "daga.png", heightTiles: 0.8 },
  capa: { file: "capa.png", heightTiles: 0.8 },
  moneda: { file: "moneda.png", heightTiles: 0.55 },
};

const ALFA_HEIGHT_TILES = 1.8;
const ALFA_CROUCH_HEIGHT_TILES = 1.5;
const HERO_HEIGHT_TILES = 1.6;

// Personajes/criaturas/objetos con arte propio en sheet.png (recortado a
// public/sprites/), como sprites de Three.js en vez de pixel art del
// framebuffer — ver Renderer.syncEntities. Coordenadas en tiles de vista
// de cámara, iguales a las de `drawPlayScene`.
export function playEntitySprites(state: GameState): EntitySpritePlacement[] {
  const { dungeon, player } = state;
  const camera = computeCamera(
    player,
    dungeon.width,
    dungeon.height,
    VIEWPORT_TILES_WIDE,
    VIEWPORT_TILES_TALL,
  );
  const placements: EntitySpritePlacement[] = [];

  const inView = (worldX: number, worldY: number): { vx: number; vy: number } | null => {
    const index = tileIndex(dungeon, worldX, worldY);
    if (!state.visible.has(index)) return null;
    const vx = worldX - camera.x;
    const vy = worldY - camera.y;
    if (vx < 0 || vy < 0 || vx >= VIEWPORT_TILES_WIDE || vy >= VIEWPORT_TILES_TALL) return null;
    return { vx, vy };
  };

  for (const item of state.items) {
    const pos = inView(item.x, item.y);
    if (!pos) continue;
    const sprite = ITEM_SPRITE[item.kind];
    placements.push({
      image: SPRITE_ROOT + sprite.file,
      tileX: pos.vx,
      tileY: pos.vy,
      heightTiles: sprite.heightTiles,
    });
  }

  for (const enemy of state.enemies) {
    const pos = inView(enemy.x, enemy.y);
    if (!pos) continue;

    if (enemy.kind === "alfa") {
      const crouching = enemy.phase % 3 === 2;
      placements.push({
        image: SPRITE_ROOT + "alfa.png",
        tileX: pos.vx,
        tileY: pos.vy,
        heightTiles: crouching ? ALFA_CROUCH_HEIGHT_TILES : ALFA_HEIGHT_TILES,
      });
      continue;
    }

    const sprite = ENEMY_SPRITE[enemy.kind];
    placements.push({
      image: SPRITE_ROOT + sprite.file,
      tileX: pos.vx,
      tileY: pos.vy,
      heightTiles: sprite.heightTiles,
    });
  }

  const heroPos = inView(player.x, player.y);
  if (heroPos) {
    const frame = state.animFrame % 2;
    placements.push({
      image: SPRITE_ROOT + (frame === 0 ? "hero-0.png" : "hero-1.png"),
      tileX: heroPos.vx,
      tileY: heroPos.vy,
      heightTiles: HERO_HEIGHT_TILES,
      flipX: state.facingLeft,
    });
  }

  return placements;
}
