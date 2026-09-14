import type { EnemyKind } from "../content/enemies.js";
import { CAPA_FLOOR_RANGE, DAGA_FLOOR_RANGE } from "../content/items.js";
import { PLAYER_BASE, SCORE_PER_FLOOR } from "./config.js";
import type { Dungeon } from "./dungeon/types.js";
import { generateDungeon } from "./dungeon/generate.js";
import { populateFloor } from "./dungeon/populate.js";
import type { Enemy, ItemPickup } from "./entities.js";
import { computeVisible } from "./fov/visibility.js";
import { createEmptyBelt } from "./items.js";
import type { Belt } from "./items.js";
import type { Rng } from "./rng.js";
import { createRng, nextInt } from "./rng.js";

export type Mode = "play" | "map" | "help" | "gameover" | "victory";

export interface Player {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  vision: number;
}

export interface GameState {
  seed: number;
  rng: Rng;
  floor: number;
  dungeon: Dungeon;
  player: Player;
  enemies: Enemy[];
  items: ItemPickup[];
  belt: Belt;
  dagaFloor: number;
  capaFloor: number;
  visible: Set<number>;
  seen: Set<number>;
  messages: string[];
  mode: Mode;
  animFrame: number;
  facingLeft: boolean;
  gold: number;
  score: number;
  deathCause: EnemyKind | null;
}

function withUpdatedVision(dungeon: Dungeon, player: Player, seen: Set<number>): {
  visible: Set<number>;
  seen: Set<number>;
} {
  const visible = computeVisible(dungeon, player, player.vision);
  const nextSeen = new Set(seen);
  for (const index of visible) nextSeen.add(index);
  return { visible, seen: nextSeen };
}

export function createInitialState(seed: number): GameState {
  const rng = createRng(seed);
  const [dagaFloor, afterDaga] = nextInt(rng, DAGA_FLOOR_RANGE[0], DAGA_FLOOR_RANGE[1]);
  const [capaFloor, afterCapa] = nextInt(afterDaga, CAPA_FLOOR_RANGE[0], CAPA_FLOOR_RANGE[1]);

  const [dungeon, afterGen] = generateDungeon(afterCapa, 1);
  const { enemies, items, rng: nextRng } = populateFloor(dungeon, 1, afterGen, {
    dagaFloor,
    capaFloor,
  });
  const player: Player = {
    x: dungeon.start.x,
    y: dungeon.start.y,
    hp: PLAYER_BASE.maxHp,
    maxHp: PLAYER_BASE.maxHp,
    attack: PLAYER_BASE.attack,
    defense: PLAYER_BASE.defense,
    vision: PLAYER_BASE.vision,
  };
  const { visible, seen } = withUpdatedVision(dungeon, player, new Set());

  return {
    seed,
    rng: nextRng,
    floor: 1,
    dungeon,
    player,
    enemies,
    items,
    belt: createEmptyBelt(),
    dagaFloor,
    capaFloor,
    visible,
    seen,
    messages: ["Entrás al bosque oscuro."],
    mode: "play",
    animFrame: 0,
    facingLeft: false,
    gold: 0,
    score: 0,
    deathCause: null,
  };
}

// Recalcula FOV (visible + acumulado de recordadas) para el estado actual.
// Se llama después de cualquier acción que pueda mover al jugador o cambiar
// de piso.
export function refreshVision(state: GameState): GameState {
  const { visible, seen } = withUpdatedVision(state.dungeon, state.player, state.seen);
  return { ...state, visible, seen };
}

const MAX_LOG_MESSAGES = 50;

export function logMessage(state: GameState, message: string): GameState {
  const messages = [...state.messages, message].slice(-MAX_LOG_MESSAGES);
  return { ...state, messages };
}

// Genera el piso siguiente y reposiciona al jugador en su entrada,
// conservando vida, equipo y semilla/rng para que la partida siga
// siendo reproducible. El efecto de la antorcha termina al bajar (sección 7).
export function descendToNextFloor(state: GameState): GameState {
  const nextFloorNumber = state.floor + 1;
  const [dungeon, afterGen] = generateDungeon(state.rng, nextFloorNumber);
  const { enemies, items, rng: nextRng } = populateFloor(dungeon, nextFloorNumber, afterGen, {
    dagaFloor: state.dagaFloor,
    capaFloor: state.capaFloor,
  });
  const player: Player = {
    ...state.player,
    x: dungeon.start.x,
    y: dungeon.start.y,
    vision: PLAYER_BASE.vision,
  };
  const { visible, seen } = withUpdatedVision(dungeon, player, new Set());

  return {
    ...state,
    rng: nextRng,
    floor: nextFloorNumber,
    dungeon,
    enemies,
    items,
    player,
    visible,
    seen,
    score: state.score + SCORE_PER_FLOOR,
  };
}
