import type { Dungeon, Point } from "../dungeon/types.js";
import { isWalkable, tileIndex } from "../dungeon/types.js";

// Un solo BFS desde `from` sirve tanto para validar que la escalera es
// alcanzable (generación de pisos) como para que todos los enemigos
// persigan al jugador en el mismo turno (sección 9 del doc).
export function computeDistanceMap(dungeon: Dungeon, from: Point): number[] {
  const size = dungeon.width * dungeon.height;
  const distances = new Array<number>(size).fill(Infinity);
  if (!isWalkable(dungeon, from.x, from.y)) return distances;

  const startIndex = tileIndex(dungeon, from.x, from.y);
  distances[startIndex] = 0;
  const queue: number[] = [startIndex];
  let head = 0;

  while (head < queue.length) {
    const index = queue[head] as number;
    head++;
    const x = index % dungeon.width;
    const y = Math.floor(index / dungeon.width);
    const dist = distances[index] as number;

    const neighbors: Point[] = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
    ];

    for (const n of neighbors) {
      if (!isWalkable(dungeon, n.x, n.y)) continue;
      const nIndex = tileIndex(dungeon, n.x, n.y);
      if (distances[nIndex] as number > dist + 1) {
        distances[nIndex] = dist + 1;
        queue.push(nIndex);
      }
    }
  }

  return distances;
}

export function distanceAt(dungeon: Dungeon, map: number[], point: Point): number {
  return map[tileIndex(dungeon, point.x, point.y)] ?? Infinity;
}

// Vecino transitable con menor distancia a `from` (para que un enemigo
// avance un paso). Devuelve null si no hay ninguno mejor que quedarse.
export function stepTowards(dungeon: Dungeon, map: number[], from: Point): Point | null {
  const currentDist = distanceAt(dungeon, map, from);
  if (!Number.isFinite(currentDist)) return null;

  const candidates: Point[] = [
    { x: from.x + 1, y: from.y },
    { x: from.x - 1, y: from.y },
    { x: from.x, y: from.y + 1 },
    { x: from.x, y: from.y - 1 },
  ];

  let best: Point | null = null;
  let bestDist = currentDist;
  for (const candidate of candidates) {
    if (!isWalkable(dungeon, candidate.x, candidate.y)) continue;
    const d = distanceAt(dungeon, map, candidate);
    if (d < bestDist) {
      bestDist = d;
      best = candidate;
    }
  }
  return best;
}
