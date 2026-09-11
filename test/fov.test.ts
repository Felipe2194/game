import { describe, expect, it } from "vitest";
import type { Dungeon, TileType } from "../src/game/dungeon/types.js";
import { computeVisible } from "../src/game/fov/visibility.js";

function makeDungeon(rows: string[]): Dungeon {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const tiles: TileType[] = [];
  for (const row of rows) {
    for (const char of row) {
      tiles.push(char === "#" ? "wall" : "floor");
    }
  }
  return { width, height, tiles, rooms: [], start: { x: 0, y: 0 }, stairs: null, isBossFloor: false };
}

describe("computeVisible", () => {
  it("ve casillas en línea recta dentro del radio", () => {
    const dungeon = makeDungeon([
      ".........",
      ".........",
      ".........",
      ".........",
      "....@....",
      ".........",
      ".........",
      ".........",
      ".........",
    ]);
    const visible = computeVisible(dungeon, { x: 4, y: 4 }, 3);
    expect(visible.has(4 * dungeon.width + 5)).toBe(true); // a la derecha
    expect(visible.has(4 * dungeon.width + 4)).toBe(true); // el propio jugador
  });

  it("una pared bloquea lo que está detrás", () => {
    const dungeon = makeDungeon([
      ".........",
      ".........",
      ".........",
      "....#....",
      "....@....",
      ".........",
      ".........",
      ".........",
      ".........",
    ]);
    const visible = computeVisible(dungeon, { x: 4, y: 4 }, 5);
    const wallIndex = 3 * dungeon.width + 4;
    const behindWallIndex = 1 * dungeon.width + 4;
    expect(visible.has(wallIndex)).toBe(true); // la pared misma se ve
    expect(visible.has(behindWallIndex)).toBe(false); // detrás, no
  });

  it("no ve más allá del radio", () => {
    const dungeon = makeDungeon(Array.from({ length: 20 }, () => ".".repeat(20)));
    const visible = computeVisible(dungeon, { x: 10, y: 10 }, 3);
    expect(visible.has(10 * dungeon.width + 19)).toBe(false);
  });
});
