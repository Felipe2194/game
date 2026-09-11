const ENTER_ALT_SCREEN = "\x1b[?1049h";
const EXIT_ALT_SCREEN = "\x1b[?1049l";
const HIDE_CURSOR = "\x1b[?25l";
const SHOW_CURSOR = "\x1b[?25h";
const CLEAR_SCREEN = "\x1b[2J";

export const MIN_COLS = 80;
export const MIN_ROWS = 24;

export interface TerminalSize {
  cols: number;
  rows: number;
}

export function getSize(): TerminalSize {
  return {
    cols: process.stdout.columns ?? 0,
    rows: process.stdout.rows ?? 0,
  };
}

export function fitsMinimumSize(size: TerminalSize): boolean {
  return size.cols >= MIN_COLS && size.rows >= MIN_ROWS;
}

export function supportsTruecolor(): boolean {
  const colorterm = process.env.COLORTERM ?? "";
  return colorterm.includes("truecolor") || colorterm.includes("24bit");
}

let restored = false;

export function enterScreen(): void {
  process.stdout.write(ENTER_ALT_SCREEN + HIDE_CURSOR + CLEAR_SCREEN);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  restored = false;
}

// Restaura la terminal a su estado normal. Idempotente: puede llamarse
// varias veces (exit, señales, excepciones) sin escribir de más.
export function restoreScreen(): void {
  if (restored) return;
  restored = true;
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdout.write(SHOW_CURSOR + EXIT_ALT_SCREEN);
}

export function installExitHandlers(onExit: () => void): void {
  const cleanup = (code: number) => {
    restoreScreen();
    onExit();
    process.exit(code);
  };
  process.on("exit", () => restoreScreen());
  process.on("SIGINT", () => cleanup(0));
  process.on("SIGTERM", () => cleanup(0));
  process.on("uncaughtException", (err) => {
    restoreScreen();
    console.error(err);
    onExit();
    process.exit(1);
  });
  process.on("unhandledRejection", (err) => {
    restoreScreen();
    console.error(err);
    onExit();
    process.exit(1);
  });
}
