import { TILE_SIZE, VIEWPORT_TILES_TALL, VIEWPORT_TILES_WIDE } from "./game/config.js";
import { Framebuffer } from "./engine/framebuffer.js";
import { listenForInput } from "./engine/input.js";
import { Renderer } from "./engine/renderer.js";
import { Scheduler } from "./engine/scheduler.js";
import { createInitialState } from "./game/state.js";
import { step } from "./game/step.js";
import { drawPlayScene, playEntitySprites } from "./scenes/play.js";
import { drawMapOverlay } from "./scenes/map-overlay.js";
import { helpLines } from "./scenes/help.js";
import { gameOverLines } from "./scenes/gameover.js";
import { victoryLines } from "./scenes/victory.js";
import { buildHud } from "./ui/hud.js";
import { visibleLogLines } from "./ui/log.js";
import { recordRun } from "./storage/save.js";
import type { SaveEntry } from "./storage/save.js";

const FB_WIDTH = VIEWPORT_TILES_WIDE * TILE_SIZE;
const FB_HEIGHT = VIEWPORT_TILES_TALL * TILE_SIZE;
const HUD_WIDTH_CHARS = 60; // ancho "virtual" en caracteres para alinear el HUD (ver ui/hud.ts)

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
const renderer = new Renderer(canvas, FB_WIDTH, FB_HEIGHT);

function resize(): void {
  renderer.resize(app!.clientWidth, app!.clientHeight);
}
window.addEventListener("resize", resize);
resize();

const seed = Date.now() >>> 0;
let state = createInitialState(seed);
let running = true;
let records: SaveEntry[] = [];

function draw(): void {
  fb.clear("·");

  if (state.mode === "map") {
    drawMapOverlay(fb, state);
  } else if (state.mode === "play") {
    drawPlayScene(fb, state);
  }

  renderer.syncEntities(state.mode === "play" ? playEntitySprites(state) : []);
  renderer.render(fb);

  hudEl!.textContent = buildHud(state.floor, state.player, state.belt, state.gold, HUD_WIDTH_CHARS);

  if (state.mode === "help") {
    showOverlay(helpLines.join("\n"));
  } else if (state.mode === "gameover") {
    showOverlay(gameOverLines(state, records).join("\n"));
  } else if (state.mode === "victory") {
    showOverlay(victoryLines(state, records).join("\n"));
  } else {
    hideOverlay();
    const [line1, line2] = visibleLogLines(state.messages);
    logEl!.textContent = line1 + (line2 ? "\n" + line2 : "");
  }
}

function showOverlay(text: string): void {
  overlayEl!.textContent = text;
  overlayEl!.hidden = false;
  logEl!.textContent = "";
}

function hideOverlay(): void {
  overlayEl!.hidden = true;
}

const scheduler = new Scheduler(draw, () => {
  state = { ...state, animFrame: state.animFrame + 1 };
});

function pause(message: string): void {
  running = false;
  stopListening();
  scheduler.stop();
  showOverlay(message);
}

const stopListening = listenForInput((action) => {
  if (!running) return;
  const result = step(state, action);
  state = result.state;

  for (const event of result.events) {
    if (event.type === "quit") {
      pause("Partida en pausa.\n\nCerrá o recargá la pestaña para jugar de nuevo.");
      return;
    }
    if (event.type === "restartRequested") {
      state = createInitialState(Date.now() >>> 0);
    }
    if (event.type === "gameover") {
      records = recordRun({
        date: new Date().toISOString(),
        score: state.score,
        floor: event.floor,
        cause: event.cause,
        seed: state.seed,
      }).top;
    }
    if (event.type === "victory") {
      records = recordRun({
        date: new Date().toISOString(),
        score: state.score,
        floor: event.floor,
        cause: "victoria",
        seed: state.seed,
      }).top;
    }
  }

  scheduler.notify();
});

scheduler.start();
