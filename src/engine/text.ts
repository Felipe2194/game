function cursorTo(row1: number, col1: number): string {
  return `\x1b[${row1};${col1}H`;
}

const RESET = "\x1b[0m";
const CLEAR_LINE = "\x1b[2K";

// Escribe una línea de texto plano (sin color) en una fila 1-indexada.
export function writeLine(row1: number, text: string): string {
  return cursorTo(row1, 1) + RESET + CLEAR_LINE + text;
}

export function centered(text: string, width: number): string {
  const pad = Math.max(0, Math.floor((width - text.length) / 2));
  return " ".repeat(pad) + text;
}

// Últimas `maxLines` líneas del log de mensajes, la más nueva al final.
export function lastLines(messages: string[], maxLines: number): string[] {
  return messages.slice(Math.max(0, messages.length - maxLines));
}
