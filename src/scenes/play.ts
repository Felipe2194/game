import type { PaletteKey } from "../assets/palette.js";
import type { EnemyKind } from "../content/enemies.js";
import type { ItemKind } from "../content/items.js";
import { PLAYER_BASE, VIEWPORT_TILES_TALL, VIEWPORT_TILES_WIDE } from "../game/config.js";
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

// Límites del bosque en vez de paredes de mazmorra: cada casilla de pared
// se decora con un pino, una tranquera o el borde de un río, elegido
// determinísticamente por posición (mismo mundo → mismo bosque siempre).
// Puramente visual: la casilla sigue siendo intransitable igual que antes.
const WALL_DECORATIONS: { file: string; heightTiles: number; weight: number }[] = [
  { file: "pino.png", heightTiles: 1.5, weight: 5 },
  { file: "tranquera.png", heightTiles: 1.0, weight: 2 },
  { file: "rio.png", heightTiles: 1.05, weight: 2 },
];
const WALL_DECORATION_TOTAL_WEIGHT = WALL_DECORATIONS.reduce((sum, d) => sum + d.weight, 0);

function hashTile(x: number, y: number): number {
  const h = (x * 374761393 + y * 668265263) ^ (x * 2246822519);
  return (h ^ (h >>> 13)) >>> 0;
}

function pickWallDecoration(worldX: number, worldY: number): { file: string; heightTiles: number } {
  let n = hashTile(worldX, worldY) % WALL_DECORATION_TOTAL_WEIGHT;
  for (const deco of WALL_DECORATIONS) {
    if (n < deco.weight) return deco;
    n -= deco.weight;
  }
  return WALL_DECORATIONS[0]!;
}

// Un pino/tranquera/río por casilla de pared explorada (visible o
// recordada, igual que el propio tile). Se recalcula solo cuando cambia
// el estado lógico (junto con `drawPlayScene`), no en cada frame de
// animación — la posición de una pared nunca se anima.
export function wallDecorationSprites(state: GameState): EntitySpritePlacement[] {
  const { dungeon, player } = state;
  const camera = computeCamera(
    player,
    dungeon.width,
    dungeon.height,
    VIEWPORT_TILES_WIDE,
    VIEWPORT_TILES_TALL,
  );
  const placements: EntitySpritePlacement[] = [];

  for (let vy = 0; vy < VIEWPORT_TILES_TALL; vy++) {
    for (let vx = 0; vx < VIEWPORT_TILES_WIDE; vx++) {
      const worldX = camera.x + vx;
      const worldY = camera.y + vy;
      if (worldX < 0 || worldY < 0 || worldX >= dungeon.width || worldY >= dungeon.height) continue;
      if (tileAt(dungeon, worldX, worldY) !== "wall") continue;

      const index = tileIndex(dungeon, worldX, worldY);
      if (!state.visible.has(index) && !state.seen.has(index)) continue;

      const deco = pickWallDecoration(worldX, worldY);
      placements.push({
        image: SPRITE_ROOT + deco.file,
        tileX: vx,
        tileY: vy,
        heightTiles: deco.heightTiles,
      });
    }
  }

  return placements;
}

// Un arbusto por casilla reservada en `populateFloor` — algunos esconden
// un enemigo u objeto (mismo lugar, "detrás" del arbusto) y otros quedan
// vacíos; el jugador no puede saber cuál desde afuera. Se dibuja igual que
// una pared: visible o recordada (el brillo de una u otra lo pone el
// `Lightmap` que ya calculó `drawPlayScene`).
export function bushSprites(state: GameState): EntitySpritePlacement[] {
  const { dungeon, player } = state;
  const camera = computeCamera(
    player,
    dungeon.width,
    dungeon.height,
    VIEWPORT_TILES_WIDE,
    VIEWPORT_TILES_TALL,
  );
  const placements: EntitySpritePlacement[] = [];

  for (const bush of state.bushes) {
    const index = tileIndex(dungeon, bush.x, bush.y);
    if (!state.visible.has(index) && !state.seen.has(index)) continue;
    const vx = bush.x - camera.x;
    const vy = bush.y - camera.y;
    if (vx < 0 || vy < 0 || vx >= VIEWPORT_TILES_WIDE || vy >= VIEWPORT_TILES_TALL) continue;
    placements.push({
      image: SPRITE_ROOT + "arbusto.png",
      tileX: vx,
      tileY: vy,
      heightTiles: 0.75,
      behind: true,
    });
  }

  return placements;
}

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
  cofre: { file: "cofre.png", heightTiles: 0.85 },
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
    // El cazador se va "equipando" a medida que junta objetos: la daga
    // (equipo permanente) queda dibujada en la mano en el propio sprite;
    // la capa y la antorcha —más difíciles de integrar de forma prolija en
    // un sprite tan chico sin arte hecho a mano para cada combinación— se
    // muestran como un pequeño indicador aparte, pegado al personaje.
    const hasDaga = player.attack > PLAYER_BASE.attack;
    const hasCapa = player.defense > PLAYER_BASE.defense;
    const hasTorchLit = state.belt.includes("antorcha") || player.vision > PLAYER_BASE.vision;
    const heroFile = hasDaga
      ? frame === 0
        ? "hero-0-daga.png"
        : "hero-1-daga.png"
      : frame === 0
        ? "hero-0.png"
        : "hero-1.png";

    placements.push({
      image: SPRITE_ROOT + heroFile,
      tileX: heroPos.vx,
      tileY: heroPos.vy,
      heightTiles: HERO_HEIGHT_TILES,
      flipX: state.facingLeft,
    });

    const sideSign = state.facingLeft ? -1 : 1;
    if (hasCapa) {
      placements.push({
        image: SPRITE_ROOT + "capa.png",
        tileX: heroPos.vx - sideSign * 0.32,
        tileY: heroPos.vy - 0.65,
        heightTiles: 0.5,
        flipX: state.facingLeft,
      });
    }
    if (hasTorchLit) {
      placements.push({
        image: SPRITE_ROOT + "antorcha.png",
        tileX: heroPos.vx + sideSign * 0.4,
        tileY: heroPos.vy - 0.25,
        heightTiles: 0.55,
        flipX: state.facingLeft,
      });
    }
  }

  return placements;
}
