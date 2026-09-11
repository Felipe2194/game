import { describe, expect, it } from "vitest";
import { createRng } from "../src/game/rng.js";
import { generateDungeon } from "../src/game/dungeon/generate.js";
import { computeDistanceMap, distanceAt } from "../src/game/ai/distance-map.js";
import { BOSS_FLOOR } from "../src/game/config.js";

const SEED_COUNT = 10_000;

describe("generateDungeon", () => {
  it("genera pisos normales válidos y con la escalera alcanzable en 10.000 semillas", () => {
    for (let seed = 0; seed < SEED_COUNT; seed++) {
      const floorNumber = (seed % 9) + 1; // pisos 1–9
      const [dungeon] = generateDungeon(createRng(seed), floorNumber);

      expect(dungeon.rooms.length).toBeGreaterThanOrEqual(3);
      expect(dungeon.stairs).not.toBeNull();

      const distances = computeDistanceMap(dungeon, dungeon.start);
      const stairsDistance = distanceAt(dungeon, distances, dungeon.stairs!);
      expect(Number.isFinite(stairsDistance)).toBe(true);
      expect(stairsDistance).toBeGreaterThan(0);
    }
  });

  it("genera el piso del jefe como una sola sala sin escalera", () => {
    for (let seed = 0; seed < 200; seed++) {
      const [dungeon] = generateDungeon(createRng(seed), BOSS_FLOOR);
      expect(dungeon.isBossFloor).toBe(true);
      expect(dungeon.rooms.length).toBe(1);
      expect(dungeon.stairs).toBeNull();
    }
  });

  it("es determinista: la misma semilla produce el mismo piso", () => {
    const [a] = generateDungeon(createRng(42), 3);
    const [b] = generateDungeon(createRng(42), 3);
    expect(a).toEqual(b);
  });
});
