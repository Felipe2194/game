import { TILE_SIZE, VIEWPORT_TILES_TALL, VIEWPORT_TILES_WIDE } from "./game/config.js";
import { Framebuffer } from "./engine/framebuffer.js";
import { Lightmap } from "./engine/lightmap.js";
import { listenForInput } from "./engine/input.js";
import { Renderer } from "./engine/renderer.js";
import type { EntitySpritePlacement } from "./engine/renderer.js";
import { createInitialState } from "./game/state.js";
import { step } from "./game/step.js";
import {
  bushSprites,
  drawPlayScene,
  playEntitySprites,
  wallDecorationSprites,
  SPRITE_ROOT,
} from "./scenes/play.js";
import type { Point } from "./scenes/play.js";
import { drawMapOverlay } from "./scenes/map-overlay.js";
import { helpLines } from "./scenes/help.js";
import { introLines } from "./scenes/intro.js";
import { gameOverLines } from "./scenes/gameover.js";
import { victoryLines } from "./scenes/victory.js";
import { buildHud } from "./ui/hud.js";
import { visibleLogLines } from "./ui/log.js";
import { recordRun } from "./storage/save.js";
import type { SaveEntry } from "./storage/save.js";

const FB_WIDTH = VIEWPORT_TILES_WIDE * TILE_SIZE;
const FB_HEIGHT = VIEWPORT_TILES_TALL * TILE_SIZE;
const HUD_WIDTH_CHARS = 60; // ancho "virtual" en caracteres para alinear el HUD (ver ui/hud.ts)
const MOVE_ANIM_MS = 130; // duración del deslizamiento entre casillas

const app = document.getElementById("app");
const hudEl = document.getElementById("hud");
const logEl = document.getElementById("log");
const overlayEl = document.getElementById("overlay");
if (!app || !hudEl || !logEl || !overlayEl) {
  throw new Error("Falta el markup esperado (#app/#hud/#log/#overlay) en index.html");
}

const canvas = document.createElement("canvas");
app.prepend(canvas);

const fb = new Framebuffer(FB_WIDTH, FB_HEIGHT);
const light = new Lightmap(VIEWPORT_TILES_WIDE, VIEWPORT_TILES_TALL);
const renderer = new Renderer(canvas, FB_WIDTH, FB_HEIGHT);

function resize(): void {
  renderer.resize(app!.clientWidth, app!.clientHeight);
}
window.addEventListener("resize", resize);
resize();

function showOverlay(text: string, className = ""): void {
  overlayEl!.textContent = text;
  overlayEl!.className = className;
  overlayEl!.hidden = false;
}

function hideOverlay(): void {
  overlayEl!.hidden = true;
}

// Escena decorativa fija (portada / victoria): piso liso a brillo pleno,
// sin grilla ni niebla, con uno o más sprites centrados a mano.
function renderTableau(placements: EntitySpritePlacement[]): void {
  fb.clear("a");
  renderer.syncEntities(placements, undefined);
  renderer.render(fb, undefined);
}

function tableauSlot(offsetTiles: number): number {
  return VIEWPORT_TILES_WIDE / 2 + offsetTiles;
}

// ── Portada ─────────────────────────────────────────────────────────────
// Loop propio (no uno solo): la textura del sprite carga de forma
// asíncrona, así que un único render podía quedar corrido si el frame
// pasaba antes de que la imagen terminara de llegar por red.
let introActive = true;
function introFrame(): void {
  if (!introActive) return;
  renderTableau([
    {
      image: SPRITE_ROOT + "hero-0.png",
      tileX: tableauSlot(0),
      tileY: VIEWPORT_TILES_TALL - 1.4,
      heightTiles: 3.2,
    },
  ]);
  requestAnimationFrame(introFrame);
}
requestAnimationFrame(introFrame);
showOverlay(introLines.join("\n"), "intro");

function startOnIntro(): void {
  introActive = false;
  window.removeEventListener("keydown", startOnIntro);
  canvas.removeEventListener("click", startOnIntro);
  hideOverlay();
  startGame();
}
window.addEventListener("keydown", startOnIntro);
canvas.addEventListener("click", startOnIntro);

// ── Partida ─────────────────────────────────────────────────────────────
function startGame(): void {
  const seed = Date.now() >>> 0;
  let state = createInitialState(seed);
  let running = true;
  let records: SaveEntry[] = [];

  interface Anim {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    start: number;
  }
  let heroAnim: Anim | null = null;
  const enemyAnims = new Map<number, Anim>();

  function easeOutCubic(t: number): number {
    return 1 - (1 - t) ** 3;
  }

  function interpolate(anim: Anim, now: number): Point {
    const t = Math.min(1, (now - anim.start) / MOVE_ANIM_MS);
    const e = easeOutCubic(t);
    return { x: anim.fromX + (anim.toX - anim.fromX) * e, y: anim.fromY + (anim.toY - anim.fromY) * e };
  }

  // Al estilo Pokémon: el cazador solo alterna frame ("camina") mientras
  // se desliza a la casilla siguiente; quieto, es un único frame fijo —
  // nada de parpadeo constante en reposo.
  function currentHeroMotion(now: number): { pos?: Point; walkFrame: number } {
    if (!heroAnim) return { walkFrame: 0 };
    const elapsed = now - heroAnim.start;
    if (elapsed >= MOVE_ANIM_MS) {
      heroAnim = null;
      return { walkFrame: 0 };
    }
    const walkFrame = Math.floor((elapsed / MOVE_ANIM_MS) * 2) % 2;
    return { pos: interpolate(heroAnim, now), walkFrame };
  }

  function currentEnemyPositions(now: number): Map<number, Point> {
    const result = new Map<number, Point>();
    for (const [id, anim] of enemyAnims) {
      if (now - anim.start >= MOVE_ANIM_MS) {
        enemyAnims.delete(id);
        continue;
      }
      result.set(id, interpolate(anim, now));
    }
    return result;
  }

  // Reconstruye tiles + brillo + decoración de paredes (solo cuando cambia
  // el estado lógico, no en cada frame de la animación de movimiento: la
  // posición de una pared nunca se anima).
  let wallDecorations: EntitySpritePlacement[] = [];
  function updateStaticScene(): void {
    fb.clear("·");
    light.clear(1);
    wallDecorations = [];
    if (state.mode === "map") {
      drawMapOverlay(fb, state);
    } else if (state.mode === "play") {
      drawPlayScene(fb, light, state);
      wallDecorations = [...wallDecorationSprites(state), ...bushSprites(state)];
    }
  }

  function updateOverlayAndHud(): void {
    hudEl!.textContent = buildHud(state.floor, state.player, state.belt, state.gold, HUD_WIDTH_CHARS);

    if (state.mode === "help") {
      showOverlay(helpLines.join("\n"));
      logEl!.textContent = "";
    } else if (state.mode === "gameover") {
      showOverlay(gameOverLines(state, records).join("\n"), "gameover");
      logEl!.textContent = "";
    } else if (state.mode === "victory") {
      showOverlay(victoryLines(state, records).join("\n"), "victory");
      logEl!.textContent = "";
    } else {
      hideOverlay();
      const [line1, line2] = visibleLogLines(state.messages);
      logEl!.textContent = line1 + (line2 ? "\n" + line2 : "");
    }
  }

  // Al ganar, en vez de seguir mostrando la mazmorra se arma un cuadro fijo
  // con el cazador y el Alfa derrotado — la "outro" detrás del texto.
  const victoryTableau: EntitySpritePlacement[] = [
    { image: SPRITE_ROOT + "hero-0.png", tileX: tableauSlot(-1.6), tileY: VIEWPORT_TILES_TALL - 1.2, heightTiles: 2.6 },
    { image: SPRITE_ROOT + "alfa.png", tileX: tableauSlot(2), tileY: VIEWPORT_TILES_TALL - 0.9, heightTiles: 1.7, flipX: true },
  ];

  let rafHandle = 0;
  function frame(now: number): void {
    if (state.mode === "play") {
      const { pos: heroPos, walkFrame } = currentHeroMotion(now);
      const enemyPos = currentEnemyPositions(now);
      renderer.syncEntities(
        [
          ...wallDecorations,
          ...playEntitySprites(state, { hero: heroPos, heroFrame: walkFrame, enemies: enemyPos }),
        ],
        light,
      );
      renderer.render(fb, light);
    } else if (state.mode === "map") {
      renderer.syncEntities([]);
      renderer.render(fb);
    } else if (state.mode === "victory") {
      fb.clear("a");
      renderer.syncEntities(victoryTableau);
      renderer.render(fb);
    } else {
      renderer.syncEntities([]);
      renderer.render(fb);
    }
    rafHandle = requestAnimationFrame(frame);
  }

  function pause(message: string): void {
    running = false;
    stopListening();
    cancelAnimationFrame(rafHandle);
    showOverlay(message);
  }

  const stopListening = listenForInput((action) => {
    if (!running) return;

    const prevFloor = state.floor;
    const prevPlayerPos: Point = { x: state.player.x, y: state.player.y };
    const prevEnemyPos = new Map(state.enemies.map((e) => [e.id, { x: e.x, y: e.y }]));

    const result = step(state, action);
    let nextState = result.state;

    for (const event of result.events) {
      if (event.type === "quit") {
        state = nextState;
        pause("Partida en pausa.\n\nCerrá o recargá la pestaña para jugar de nuevo.");
        return;
      }
      if (event.type === "restartRequested") {
        nextState = createInitialState(Date.now() >>> 0);
      }
      if (event.type === "gameover") {
        records = recordRun({
          date: new Date().toISOString(),
          score: nextState.score,
          floor: event.floor,
          cause: event.cause,
          seed: nextState.seed,
        }).top;
      }
      if (event.type === "victory") {
        records = recordRun({
          date: new Date().toISOString(),
          score: nextState.score,
          floor: event.floor,
          cause: "victoria",
          seed: nextState.seed,
        }).top;
      }
    }

    const now = performance.now();
    if (nextState.floor === prevFloor && nextState.mode === "play") {
      if (nextState.player.x !== prevPlayerPos.x || nextState.player.y !== prevPlayerPos.y) {
        heroAnim = {
          fromX: prevPlayerPos.x,
          fromY: prevPlayerPos.y,
          toX: nextState.player.x,
          toY: nextState.player.y,
          start: now,
        };
      }
      for (const enemy of nextState.enemies) {
        const prev = prevEnemyPos.get(enemy.id);
        if (prev && (prev.x !== enemy.x || prev.y !== enemy.y)) {
          enemyAnims.set(enemy.id, { fromX: prev.x, fromY: prev.y, toX: enemy.x, toY: enemy.y, start: now });
        }
      }
    } else {
      heroAnim = null;
      enemyAnims.clear();
    }

    state = nextState;
    updateStaticScene();
    updateOverlayAndHud();
  });

  updateStaticScene();
  updateOverlayAndHud();
  rafHandle = requestAnimationFrame(frame);
}
