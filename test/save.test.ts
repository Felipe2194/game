import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSave, recordRun } from "../src/storage/save.js";

// os.homedir() en Windows lee USERPROFILE; en POSIX, HOME. Lo apuntamos a
// un directorio temporal para no tocar el save real del usuario.
let tempHome: string;
let originalUserProfile: string | undefined;
let originalHome: string | undefined;

beforeEach(() => {
  tempHome = mkdtempSync(join(tmpdir(), "salamanca-save-test-"));
  originalUserProfile = process.env.USERPROFILE;
  originalHome = process.env.HOME;
  process.env.USERPROFILE = tempHome;
  process.env.HOME = tempHome;
});

afterEach(() => {
  if (originalUserProfile === undefined) delete process.env.USERPROFILE;
  else process.env.USERPROFILE = originalUserProfile;
  if (originalHome === undefined) delete process.env.HOME;
  else process.env.HOME = originalHome;
  rmSync(tempHome, { recursive: true, force: true });
});

describe("save", () => {
  it("no crashea si todavía no hay archivo de guardado", () => {
    expect(loadSave()).toEqual({ top: [] });
  });

  it("guarda una partida y la puede volver a leer", () => {
    recordRun({ date: new Date().toISOString(), score: 100, floor: 3, cause: "una rata", seed: 1 });
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
