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
import { hero } from "./assets/sprites/hero.js";
import { createInitialState } from "./game/state.js";
import { step } from "./game/step.js";

const COLS = 80;
const GAME_ROWS = 21; // filas 2–22 (1-indexado)
const HUD_ROW = 1;
const LOG_ROW_1 = 23;
const LOG_ROW_2 = 24;
const GAME_ORIGIN_ROW = 2;

const TILE_WIDTH = 13;
const TILE_HEIGHT = 7;

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
  const fb = new Framebuffer(COLS, TILE_HEIGHT * 6);
  const renderer = new Renderer(COLS, GAME_ROWS, GAME_ORIGIN_ROW, truecolor);

  let state = createInitialState(TILE_WIDTH, TILE_HEIGHT);
  const messages = ["Bajás a la Salamanca."];
  let running = true;

  const draw = () => {
    fb.clear("·");
    for (let y = 0; y < state.room.height; y++) {
      for (let x = 0; x < state.room.width; x++) {
        const wall = x === 0 || y === 0 || x === state.room.width - 1 || y === state.room.height - 1;
        fb.fillTile(x, y, wall ? "j" : "a");
      }
    }
    fb.drawSprite(state.player.x, state.player.y, hero, state.animFrame, state.facingLeft);

    renderer.render(fb, (chunk) => process.stdout.write(chunk));

    process.stdout.write(
      writeLine(HUD_ROW, "piso 1  ♥♥♥♥♥♥  atq 1 def 0  [1]· [2]· [3]·            oro 0"),
    );
    const [line1, line2] = messages.slice(-2);
    process.stdout.write(writeLine(LOG_ROW_1, line1 ?? ""));
    process.stdout.write(writeLine(LOG_ROW_2, line2 ?? ""));
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
      if (event.type === "blocked") {
        messages.push("No podés pasar por ahí.");
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
