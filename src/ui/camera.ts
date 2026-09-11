export interface Camera {
  x: number;
  y: number;
}

// La cámara sigue al jugador y se frena en los bordes del mapa (sección 10).
export function computeCamera(
  player: { x: number; y: number },
  mapWidth: number,
  mapHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): Camera {
  const maxX = Math.max(0, mapWidth - viewportWidth);
  const maxY = Math.max(0, mapHeight - viewportHeight);
  const x = clamp(player.x - Math.floor(viewportWidth / 2), 0, maxX);
  const y = clamp(player.y - Math.floor(viewportHeight / 2), 0, maxY);
  return { x, y };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
