import type { PaletteKey } from "../assets/palette.js";
import type { EnemyKind } from "../content/enemies.js";
import type { ItemKind } from "../content/items.js";
import { VIEWPORT_TILES_TALL, VIEWPORT_TILES_WIDE } from "../game/config.js";
import { isWalkable, tileAt, tileIndex } from "../game/dungeon/types.js";
import type { Dungeon } from "../game/dungeon/types.js";
import type { GameState } from "../game/state.js";
import { computeCamera } from "../ui/camera.js";
import type { Framebuffer } from "../engine/framebuffer.js";
import type { Lightmap } from "../engine/lightmap.js";
import type { EntitySpritePlacement } from "../engine/renderer.js";

// Brillo de las casillas visibles ahora mismo: 1 pegado al jugador, cae
// hasta este mínimo en el borde del radio de visión (efecto linterna).
// Las recordadas (fuera de la luz, pero ya exploradas) quedan en un brillo
// fijo más bajo — visibles como una "sombra" del piso, no invisibles.
const VISION_MIN_BRIGHTNESS = 0.5;
const REMEMBERED_BRIGHTNESS = 0.28;

function tileColor(dungeon: Dungeon, x: number, y: number): PaletteKey {
  const tile = tileAt(dungeon, x, y);
  if (tile === "stairs") return "f";
  if (tile !== "wall") return "a";
  // Pared "de frente" (con piso pegado abajo, la cara que mira a la
  // cámara): un tono más claro para que las paredes no queden un bloque
  // parejo — sección 10 del documento de diseño.
  return isWalkable(dungeon, x, y + 1) ? "o" : "j";
}

// Dibuja el mapa de tiles (paredes/piso/escalera) y calcula el brillo por
// casilla (efecto linterna/antorcha) en el framebuffer de paleta.
// Personajes/criaturas/objetos van aparte, ver `playEntitySprites` — se
// dibujan como sprites de Three.js con imágenes reales recortadas de
// sheet.png, no como pixel art del framebuffer.
export function drawPlayScene(fb: Framebuffer, light: Lightmap, state: GameState): void {
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

      fb.fillTile(vx, vy, tileColor(dungeon, worldX, worldY));

      if (isVisible) {
        const dx = worldX - player.x;
        const dy = worldY - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const t = Math.min(1, dist / Math.max(1, player.vision));
        light.set(vx, vy, 1 - t * (1 - VISION_MIN_BRIGHTNESS));
      } else {
        light.set(vx, vy, REMEMBERED_BRIGHTNESS);
      }
    }
  }
}

export const SPRITE_ROOT = "/sprites/";

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

export interface Point {
  x: number;
  y: number;
}

// Posiciones interpoladas (animación de movimiento, ver main.ts) que
// reemplazan la posición exacta del estado al armar los placements, sin
// alterar de qué casilla salen la cámara ni la visibilidad.
export interface EntityPositionOverrides {
  hero?: Point;
  enemies?: Map<number, Point>;
}

// Personajes/criaturas/objetos con arte propio en sheet.png (recortado a
// public/sprites/), como sprites de Three.js en vez de pixel art del
// framebuffer — ver Renderer.syncEntities. Coordenadas en tiles de vista
// de cámara, iguales a las de `drawPlayScene`.
export function playEntitySprites(
  state: GameState,
  overrides?: EntityPositionOverrides,
): EntitySpritePlacement[] {
  const { dungeon, player } = state;
  const camera = computeCamera(
    player,
    dungeon.width,
    dungeon.height,
    VIEWPORT_TILES_WIDE,
    VIEWPORT_TILES_TALL,
  );
  const placements: EntitySpritePlacement[] = [];

  // La visibilidad se decide con la posición lógica (exacta); la casilla
  // dibujada puede ser la interpolada (`renderPos`), que durante una
  // animación de movimiento cae en un punto intermedio entre dos tiles.
  const inView = (worldX: number, worldY: number, renderPos: Point): { vx: number; vy: number } | null => {
    const index = tileIndex(dungeon, worldX, worldY);
    if (!state.visible.has(index)) return null;
    const vx = renderPos.x - camera.x;
    const vy = renderPos.y - camera.y;
    if (vx < -1 || vy < -1 || vx > VIEWPORT_TILES_WIDE || vy > VIEWPORT_TILES_TALL) return null;
    return { vx, vy };
  };

  for (const item of state.items) {
    const pos = inView(item.x, item.y, item);
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
    const renderPos = overrides?.enemies?.get(enemy.id) ?? enemy;
    const pos = inView(enemy.x, enemy.y, renderPos);
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

  const heroRenderPos = overrides?.hero ?? player;
  const heroPos = inView(player.x, player.y, heroRenderPos);
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
