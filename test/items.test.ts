import { describe, expect, it } from "vitest";
import type { Dungeon, TileType } from "../src/game/dungeon/types.js";
import type { GameState, Player } from "../src/game/state.js";
import { createRng } from "../src/game/rng.js";
import { createEmptyBelt, pickUpItem, useBeltSlot } from "../src/game/items.js";
import type { ItemPickup } from "../src/game/entities.js";

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
  return { x: 2, y: 2, hp: 4, maxHp: 6, attack: 1, defense: 0, vision: 5, ...overrides };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    seed: 1,
    rng: createRng(1),
    floor: 1,
    dungeon: makeOpenDungeon(7),
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
    facingLeft: false,
    gold: 0,
    score: 0,
    deathCause: null,
    ...overrides,
  };
}

describe("items", () => {
  it("una poción en el cinturón cura al usarla y desaparece del cinturón", () => {
    let state = makeState({ belt: ["pocion", undefined, undefined] });
    const result = useBeltSlot(state, 0);
    expect(result.consumedTurn).toBe(true);
    expect(result.state.player.hp).toBe(6); // 4 + 2, sin pasarse del máximo
    expect(result.state.belt[0]).toBeUndefined();
  });

  it("con la vida al máximo, la poción no se gasta ni consume turno", () => {
    const state = makeState({
      player: makePlayer({ hp: 6, maxHp: 6 }),
      belt: ["pocion", undefined, undefined],
    });
    const result = useBeltSlot(state, 0);
    expect(result.consumedTurn).toBe(false);
    expect(result.state.belt[0]).toBe("pocion");
    expect(result.state.player.hp).toBe(6);
  });

  it("usar un slot vacío no consume turno", () => {
    const state = makeState();
    const result = useBeltSlot(state, 0);
    expect(result.consumedTurn).toBe(false);
  });

  it("una antorcha sube la visión hasta bajar de piso", () => {
    let state = makeState({ belt: [undefined, "antorcha", undefined] });
    const result = useBeltSlot(state, 1);
    expect(result.state.player.vision).toBe(8);
  });

  it("si el cinturón está lleno, la poción queda en el suelo", () => {
    const item: ItemPickup = { id: 0, kind: "pocion", x: 2, y: 2 };
    const state = makeState({ belt: ["pocion", "antorcha", "pocion"], items: [item] });
    const result = pickUpItem(state, item);
    expect(result.items).toHaveLength(1); // sigue en el suelo
    expect(result.belt).toEqual(state.belt);
  });

  it("una ración de carne suma vida máxima y cura", () => {
    const item: ItemPickup = { id: 0, kind: "racion", x: 2, y: 2 };
    const state = makeState({ items: [item] });
    const result = pickUpItem(state, item);
    expect(result.player.maxHp).toBe(7);
    expect(result.player.hp).toBe(5);
    expect(result.items).toHaveLength(0);
  });

  it("una daga equipada suma ataque permanentemente", () => {
    const item: ItemPickup = { id: 0, kind: "daga", x: 2, y: 2 };
    const result = pickUpItem(makeState({ items: [item] }), item);
    expect(result.player.attack).toBe(2);
  });

  it("una moneda suma oro y puntaje", () => {
    const item: ItemPickup = { id: 0, kind: "moneda", x: 2, y: 2 };
    const result = pickUpItem(makeState({ items: [item] }), item);
    expect(result.gold).toBe(1);
    expect(result.score).toBe(10);
  });
});
