import { Framebuffer } from "./engine/framebuffer.js";
import { listenForInput } from "./engine/input.js";
import { Renderer } from "./engine/renderer.js";
import { Scheduler } from "./engine/scheduler.js";
import {
  enterScreen,
  fitsMinimumSize,
  getSize,
  installExitHandlers,
  restoreScreen,
  supportsTruecolor,
} from "./engine/terminal.js";
import { centered, writeLine } from "./engine/text.js";
import { createInitialState } from "./game/state.js";
import { step } from "./game/step.js";
import { TILE_SIZE, VIEWPORT_TILES_TALL, VIEWPORT_TILES_WIDE } from "./game/config.js";
import { drawPlayScene } from "./scenes/play.js";
import { drawMapOverlay } from "./scenes/map-overlay.js";
import { helpLines } from "./scenes/help.js";
import { gameOverLines } from "./scenes/gameover.js";
import { buildHud } from "./ui/hud.js";
import { visibleLogLines } from "./ui/log.js";

const COLS = 80;
const GAME_ROWS = VIEWPORT_TILES_TALL * (TILE_SIZE / 2); // filas 2–22 (1-indexado)
const HUD_ROW = 1;
const LOG_ROW_1 = 23;
const LOG_ROW_2 = 24;
const GAME_ORIGIN_ROW = 2;

async function waitForMinimumSize(): Promise<void> {
  if (fitsMinimumSize(getSize())) return;
  process.stdout.write("\x1b[2J\x1b[H");
  await new Promise<void>((resolve) => {
    const check = () => {
      const size = getSize();
      if (fitsMinimumSize(size)) {
        process.stdout.off("resize", check);
        resolve();
        return;
      }
      process.stdout.write("\x1b[2J\x1b[H");
      process.stdout.write(
        centered(
          `La terminal necesita al menos 80×24 (actual ${size.cols}×${size.rows}). Agrandala para continuar…`,
          size.cols || 80,
        ),
      );
    };
    check();
    process.stdout.on("resize", check);
  });
}

async function main(): Promise<void> {
  if (!process.stdin.isTTY) {
    console.error("Salamanca necesita correr en una terminal interactiva (TTY).");
    process.exit(1);
  }

  await waitForMinimumSize();

  const truecolor = supportsTruecolor();
  const fb = new Framebuffer(COLS, VIEWPORT_TILES_TALL * TILE_SIZE);
  const renderer = new Renderer(COLS, GAME_ROWS, GAME_ORIGIN_ROW, truecolor);

  const seed = Date.now() >>> 0;
  let state = createInitialState(seed);
  let running = true;

  const drawOverlayText = (lines: string[]) => {
    lines.forEach((line, i) => {
      if (GAME_ORIGIN_ROW + i < LOG_ROW_1) {
        process.stdout.write(writeLine(GAME_ORIGIN_ROW + i, centered(line, COLS)));
      }
    });
    process.stdout.write(writeLine(LOG_ROW_1, ""));
    process.stdout.write(writeLine(LOG_ROW_2, ""));
  };

  const draw = () => {
    fb.clear("·");

    if (state.mode === "map") {
      drawMapOverlay(fb, state);
    } else if (state.mode === "play") {
      drawPlayScene(fb, state);
    }

    renderer.render(fb, (chunk) => process.stdout.write(chunk));

    process.stdout.write(
      writeLine(HUD_ROW, buildHud(state.floor, state.player, [undefined, undefined, undefined], state.gold, COLS)),
    );

    if (state.mode === "help") {
      drawOverlayText(helpLines);
    } else if (state.mode === "gameover") {
      drawOverlayText(gameOverLines(state));
    } else {
      const [line1, line2] = visibleLogLines(state.messages);
      process.stdout.write(writeLine(LOG_ROW_1, line1));
      process.stdout.write(writeLine(LOG_ROW_2, line2));
    }
  };

  const scheduler = new Scheduler(
    draw,
    () => {
      state = { ...state, animFrame: state.animFrame + 1 };
    },
  );

  const stopListening = listenForInput((action) => {
    if (!running) return;
    const result = step(state, action);
    state = result.state;

    for (const event of result.events) {
      if (event.type === "quit") {
        running = false;
        stopListening();
        scheduler.stop();
        restoreScreen();
        process.exit(0);
      }
      if (event.type === "restartRequested") {
        state = createInitialState(Date.now() >>> 0);
      }
    }

    scheduler.notify();
  });

  installExitHandlers(() => {
    stopListening();
    scheduler.stop();
  });

  enterScreen();
  scheduler.start();
}

main().catch((err) => {
  restoreScreen();
  console.error(err);
  process.exit(1);
});
