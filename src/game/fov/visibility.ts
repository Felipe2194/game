import type { Dungeon, Point } from "../dungeon/types.js";
import { isWalkable } from "../dungeon/types.js";

// Línea de Bresenham entre dos puntos, extremos incluidos.
export function bresenhamLine(x0: number, y0: number, x1: number, y1: number): Point[] {
  const points: Point[] = [];
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  for (;;) {
    points.push({ x, y });
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }

  return points;
}

// Todas las casillas visibles desde `origin` dentro de `radius`, section 9:
// una línea de Bresenham por casilla del radio, cortada por la primera pared.
export function computeVisible(dungeon: Dungeon, origin: Point, radius: number): Set<number> {
  const visible = new Set<number>();
  const radiusSq = radius * radius;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radiusSq) continue;
      const targetX = origin.x + dx;
      const targetY = origin.y + dy;

      for (const point of bresenhamLine(origin.x, origin.y, targetX, targetY)) {
        const index = point.y * dungeon.width + point.x;
        visible.add(index);
        if (!isWalkable(dungeon, point.x, point.y)) break;
      }
    }
  }

  return visible;
}
