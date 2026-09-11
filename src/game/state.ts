export interface GameState {
  player: { x: number; y: number };
  room: { width: number; height: number };
  animFrame: number;
  facingLeft: boolean;
}

export function createInitialState(width: number, height: number): GameState {
  return {
    player: { x: Math.floor(width / 2), y: Math.floor(height / 2) },
    room: { width, height },
    animFrame: 0,
    facingLeft: false,
  };
}
