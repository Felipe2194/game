import type { PaletteKey } from "../assets/palette.js";

const TILE_SIZE = 6;

export class Framebuffer {
  readonly width: number;
  readonly height: number;
  private cells: PaletteKey[];

  constructor(width: number, height: number, background: PaletteKey = "·") {
    this.width = width;
    this.height = height;
    this.cells = new Array(width * height).fill(background);
  }

  clear(background: PaletteKey = "·"): void {
    this.cells.fill(background);
  }

  set(x: number, y: number, key: PaletteKey): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    this.cells[y * this.width + x] = key;
  }

  get(x: number, y: number): PaletteKey {
    return this.cells[y * this.width + x] ?? "·";
  }

  // Dibuja un tile de 6×6 relleno de un solo color, en coordenadas de tile.
  fillTile(tileX: number, tileY: number, key: PaletteKey): void {
    const originX = tileX * TILE_SIZE;
    const originY = tileY * TILE_SIZE;
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        this.set(originX + x, originY + y, key);
      }
    }
  }
}
