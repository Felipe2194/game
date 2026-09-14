// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { loadSave, recordRun } from "../src/storage/save.js";

beforeEach(() => {
  localStorage.clear();
});

describe("save", () => {
  it("no crashea si todavía no hay nada guardado", () => {
    expect(loadSave()).toEqual({ top: [] });
  });

  it("guarda una partida y la puede volver a leer", () => {
    recordRun({ date: new Date().toISOString(), score: 100, floor: 3, cause: "un escarabajo", seed: 1 });
    const data = loadSave();
    expect(data.top).toHaveLength(1);
    expect(data.top[0]?.score).toBe(100);
  });

  it("se queda solo con las 5 mejores, ordenadas de mayor a menor", () => {
    const scores = [50, 200, 10, 300, 150, 90];
    for (const score of scores) {
      recordRun({ date: new Date().toISOString(), score, floor: 1, cause: "x", seed: 1 });
    }
    const data = loadSave();
    expect(data.top).toHaveLength(5);
    expect(data.top.map((e) => e.score)).toEqual([300, 200, 150, 90, 50]);
  });
});
