// Brillo por tile (0–1) para el efecto linterna/antorcha: multiplica el
// color real del tile en vez de remapearlo a otra entrada de la paleta
// (así una casilla recordada sigue siendo reconocible, solo más oscura).
export class Lightmap {
  readonly width: number;
  readonly height: number;
  private cells: Float32Array;

  constructor(width: number, height: number, defaultBrightness = 1) {
    this.width = width;
    this.height = height;
    this.cells = new Float32Array(width * height).fill(defaultBrightness);
  }

  clear(defaultBrightness = 1): void {
    this.cells.fill(defaultBrightness);
  }

  set(tileX: number, tileY: number, brightness: number): void {
    if (tileX < 0 || tileY < 0 || tileX >= this.width || tileY >= this.height) return;
    this.cells[tileY * this.width + tileX] = brightness;
  }

  get(tileX: number, tileY: number): number {
    return this.cells[tileY * this.width + tileX] ?? 1;
  }
}
