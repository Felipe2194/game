import { describe, expect, it } from "vitest";
import { createRng, nextFloat, nextInt } from "../src/game/rng.js";

describe("rng", () => {
  it("es determinista para la misma semilla", () => {
    const a = createRng(7);
    const b = createRng(7);
    const [va] = nextFloat(a);
    const [vb] = nextFloat(b);
    expect(va).toBe(vb);
  });

  it("produce valores distintos para semillas distintas", () => {
    const [va] = nextFloat(createRng(1));
    const [vb] = nextFloat(createRng(2));
    expect(va).not.toBe(vb);
  });

  it("nextInt respeta el rango inclusive", () => {
    let rng = createRng(123);
    for (let i = 0; i < 1000; i++) {
      const [value, next] = nextInt(rng, 3, 5);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(5);
      rng = next;
    }
  });
});
