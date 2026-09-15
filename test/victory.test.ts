import { describe, expect, it } from "vitest";
import type { Dungeon, TileType } from "../src/game/dungeon/types.js";
import type { GameState, Player } from "../src/game/state.js";
import { createRng } from "../src/game/rng.js";
import { createEnemy } from "../src/game/entities.js";
import { createEmptyBelt } from "../src/game/items.js";
import { step } from "../src/game/step.js";
import { resolveEnemyTurns } from "../src/game/turns.js";

function makeBossDungeon(): Dungeon {
  const size = 12;
  const tiles: TileType[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const border = x === 0 || y === 0 || x === size - 1 || y === size - 1;
      tiles.push(border ? "wall" : "floor");
    }
  }
  return {
    width: size,
    height: size,
    tiles,
    rooms: [{ x: 1, y: 1, width: size - 2, height: size - 2 }],
    start: { x: 1, y: 1 },
    stairs: null,
    isBossFloor: true,
  };
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return { x: 5, y: 5, hp: 6, maxHp: 6, attack: 20, defense: 0, vision: 5, ...overrides };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    seed: 1,
    rng: createRng(1),
    floor: 10,
    dungeon: makeBossDungeon(),
    player: makePlayer(),
    enemies: [],
    items: [],
    bushes: [],
    belt: createEmptyBelt(),
    dagaFloor: 2,
    capaFloor: 3,
    visible: new Set(),
    seen: new Set(),
    messages: [],
    mode: "play",
    animFrame: 0,
    facingLeft: false,
    gold: 0,
    score: 0,
    deathCause: null,
    ...overrides,
  };
}

describe("Alfa y victoria", () => {
  it("derrotar al Alfa dispara la victoria y suma 1000 puntos", () => {
    const boss = createEnemy(0, "alfa", 6, 5); // adyacente, ataque 20 lo mata de un golpe
    const state = makeState({ enemies: [boss] });

    const result = step(state, { type: "move", dx: 1, dy: 0 });

    expect(result.state.mode).toBe("victory");
    expect(result.state.score).toBe(1000);
    expect(result.events.some((e) => e.type === "victory")).toBe(true);
  });

  it("el Alfa sigue el ciclo persigue/agazapa/salta cada 3 turnos", () => {
    const boss = createEnemy(0, "alfa", 2, 5); // lejos, en línea recta
    let state = makeState({ enemies: [boss], player: makePlayer({ x: 9, y: 5 }) });

    const phases: number[] = [];
    for (let i = 0; i < 3; i++) {
      const result = resolveEnemyTurns(state);
      state = result.state;
      phases.push(state.enemies[0]!.phase % 3);
    }

    // Tras 3 turnos, el ciclo completo pasó por las 3 fases (1, 2, 0).
    expect(phases).toEqual([1, 2, 0]);
  });
});
