import type { PaletteKey } from "../assets/palette.js";
import type { Sprite, SpriteCell } from "../assets/sprite.js";
import { TRANSPARENT } from "../assets/sprite.js";

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

  // Dibuja un sprite de 6×6 sobre un tile, respetando transparencia.
  drawSprite(tileX: number, tileY: number, sprite: Sprite, frame = 0, flipX = false): void {
    const pixels = sprite.frames[frame % sprite.frames.length];
    if (!pixels) return;
    const originX = tileX * TILE_SIZE;
    const originY = tileY * TILE_SIZE;
    for (let row = 0; row < pixels.length; row++) {
      const line = pixels[row];
      if (!line) continue;
      for (let col = 0; col < line.length; col++) {
        const cell: SpriteCell | undefined = line[col];
        if (!cell || cell === TRANSPARENT) continue;
        const x = flipX ? line.length - 1 - col : col;
        this.set(originX + x, originY + row, cell);
      }
    }
  }
}
