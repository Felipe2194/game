import { describe, expect, it } from "vitest";
import type { Dungeon, TileType } from "../src/game/dungeon/types.js";
import type { GameState, Player } from "../src/game/state.js";
import { createRng } from "../src/game/rng.js";
import { createEnemy } from "../src/game/entities.js";
import { step } from "../src/game/step.js";

function makeOpenDungeon(size: number): Dungeon {
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
    stairs: { x: size - 2, y: size - 2 },
    isBossFloor: false,
  };
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return { x: 2, y: 2, hp: 6, maxHp: 6, attack: 1, defense: 0, vision: 5, ...overrides };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  const dungeon = makeOpenDungeon(7);
  return {
    seed: 1,
    rng: createRng(1),
    floor: 1,
    dungeon,
    player: makePlayer(),
    enemies: [],
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

describe("step", () => {
  it("moverse hacia un enemigo lo ataca en vez de moverse", () => {
    const enemy = createEnemy(0, "rata", 3, 2); // vida 1, a la derecha del jugador
    const state = makeState({ enemies: [enemy] });

    const result = step(state, { type: "move", dx: 1, dy: 0 });

    expect(result.state.player.x).toBe(2); // no se movió
    expect(result.state.enemies).toHaveLength(0); // la rata (vida 1) murió
    expect(result.state.score).toBeGreaterThan(0);
  });

  it("chocar contra una pared no consume turno", () => {
    const state = makeState({ player: makePlayer({ x: 1, y: 2 }) });
    const result = step(state, { type: "move", dx: -1, dy: 0 });
    expect(result.events).toEqual([{ type: "blocked" }]);
    expect(result.state.player.x).toBe(1);
  });

  it("se puede morir de forma justa: un enemigo adyacente puede terminar la partida", () => {
    const enemy = createEnemy(0, "esqueleto", 3, 2); // adyacente, precisión 75%
    let state = makeState({ player: makePlayer({ hp: 2, maxHp: 2 }), enemies: [enemy] });

    let diedAt = -1;
    for (let turn = 0; turn < 200 && diedAt === -1; turn++) {
      const result = step(state, { type: "wait" });
      state = result.state;
      if (state.mode === "gameover") diedAt = turn;
    }

    expect(diedAt).toBeGreaterThanOrEqual(0);
    expect(state.player.hp).toBe(0);
    expect(state.deathCause).toBe("esqueleto");
  });

  it("es determinista: la misma semilla y acciones dan el mismo resultado", () => {
    const actions = Array.from({ length: 20 }, () => ({ type: "wait" as const }));

    function run(): GameState {
      let s = makeState({ player: makePlayer({ hp: 6 }), enemies: [createEnemy(0, "esqueleto", 3, 2)] });
      for (const a of actions) s = step(s, a).state;
      return s;
    }

    const a = run();
    const b = run();
    expect(a.player.hp).toBe(b.player.hp);
    expect(a.messages).toEqual(b.messages);
  });
});
