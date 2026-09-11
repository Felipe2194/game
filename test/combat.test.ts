import { describe, expect, it } from "vitest";
import { enemies } from "../src/content/enemies.js";
import { enemyHitChance, playerAttackDamage, resolveEnemyAttack } from "../src/game/combat.js";
import { createRng } from "../src/game/rng.js";

describe("combat", () => {
  it("el jugador siempre acierta y el daño es su ataque", () => {
    expect(playerAttackDamage(1)).toBe(1);
    expect(playerAttackDamage(3)).toBe(3);
  });

  it("la defensa baja la probabilidad de que te peguen, no el daño", () => {
    const rata = enemies.rata; // precisión 60%
    expect(enemyHitChance(rata, 0)).toBeCloseTo(0.6);
    expect(enemyHitChance(rata, 2)).toBeCloseTo(0.4);
    expect(enemyHitChance(rata, 10)).toBe(0); // nunca negativo
  });

  it("la precisión efectiva nunca supera 1 ni baja de 0", () => {
    const luzMala = enemies["luz-mala"]; // precisión 90%
    expect(enemyHitChance(luzMala, -5)).toBeLessThanOrEqual(1);
  });

  it("resolveEnemyAttack es determinista para el mismo rng", () => {
    const rng = createRng(99);
    const [hitA] = resolveEnemyAttack(rng, enemies.esqueleto, 0);
    const [hitB] = resolveEnemyAttack(rng, enemies.esqueleto, 0);
    expect(hitA).toBe(hitB);
  });
});
