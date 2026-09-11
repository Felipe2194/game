import type { PaletteKey } from "../assets/palette.js";
import { rgbOf, rgbToAnsi256 } from "../assets/palette.js";
import type { Framebuffer } from "./framebuffer.js";

const HALF_BLOCK = "▀";
const RESET = "\x1b[0m";

interface Cell {
  top: PaletteKey;
  bottom: PaletteKey;
}

function cursorTo(row1: number, col1: number): string {
  return `\x1b[${row1};${col1}H`;
}

export class Renderer {
  private previous: (Cell | undefined)[];
  private rows: number;
  private cols: number;
  private originRow: number;
  private truecolor: boolean;

  constructor(cols: number, rows: number, originRow: number, truecolor: boolean) {
    this.cols = cols;
    this.rows = rows;
    this.originRow = originRow;
    this.truecolor = truecolor;
    this.previous = new Array(cols * rows).fill(undefined);
  }

  private colorEscape(key: PaletteKey, layer: "38" | "48"): string {
    const rgb = rgbOf(key);
    if (this.truecolor) {
      return `\x1b[${layer};2;${rgb.r};${rgb.g};${rgb.b}m`;
    }
    return `\x1b[${layer};5;${rgbToAnsi256(rgb)}m`;
  }

  // Fuerza el redibujado completo en el próximo flush (p.ej. tras un resize).
  invalidate(): void {
    this.previous.fill(undefined);
  }

  render(fb: Framebuffer, write: (chunk: string) => void): void {
    let out = "";
    let lastRow = -1;
    let lastCol = -1;

    for (let row = 0; row < this.rows; row++) {
      const py = row * 2;
      for (let col = 0; col < this.cols; col++) {
        const top = fb.get(col, py);
        const bottom = fb.get(col, py + 1);
        const index = row * this.cols + col;
        const prev = this.previous[index];
        if (prev && prev.top === top && prev.bottom === bottom) continue;

        this.previous[index] = { top, bottom };

        if (row !== lastRow || col !== lastCol) {
          out += cursorTo(this.originRow + row, col + 1);
        }
        out += this.colorEscape(top, "38") + this.colorEscape(bottom, "48") + HALF_BLOCK;
        lastRow = row;
        lastCol = col + 1;
      }
    }

    if (out.length > 0) {
      write(out + RESET);
    }
  }
}
