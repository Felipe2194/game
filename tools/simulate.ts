// Bot headless para medir balance: juega partidas sin pantalla y reporta
// en qué piso muere la gente (sección 14, punto 2 del doc). Uso:
//   npx tsx tools/simulate.ts [cantidad] [semillaInicial]
import { computeDistanceMap, stepTowards } from "../src/game/ai/distance-map.js";
import { enemyAt } from "../src/game/dungeon/populate.js";
import { createInitialState } from "../src/game/state.js";
import type { GameState } from "../src/game/state.js";
import { step } from "../src/game/step.js";
import type { Action } from "../src/engine/input.js";

const LOW_HP_RATIO = 0.5;
const MAX_TURNS_PER_GAME = 4000;

function directionTo(from: { x: number; y: number }, to: { x: number; y: number }): Action {
  return { type: "move", dx: Math.sign(to.x - from.x), dy: Math.sign(to.y - from.y) };
}

// Heurística simple y deliberadamente sin memoria entre turnos: pelear lo
// que está al lado, curarse si conviene, y si no, avanzar directo hacia la
// escalera (o hacia el jugador, si es el lobizón el que persigue). No junta
// botín al pasar: una versión anterior que perseguía ítems visibles podía
// alternar entre "ir a la escalera" e "ir al ítem" turno a turno según
// parpadeaba la visibilidad de un enemigo, quedando en un loop infinito de
// 2 casillas. Este bot mide dificultad de combate/generación, no óptimo de
// recolección — es un límite inferior razonable, no un jugador perfecto.
function chooseAction(state: GameState): Action {
  const { player, dungeon } = state;

  const neighbors = [
    { x: player.x + 1, y: player.y },
    { x: player.x - 1, y: player.y },
    { x: player.x, y: player.y + 1 },
    { x: player.x, y: player.y - 1 },
  ];
  for (const n of neighbors) {
    if (enemyAt(state.enemies, n.x, n.y)) return directionTo(player, n);
  }

  if (player.hp / player.maxHp <= LOW_HP_RATIO && state.belt.includes("mate")) {
    const slot = (state.belt.indexOf("mate") + 1) as 1 | 2 | 3;
    return { type: "useItem", slot };
  }

  if (dungeon.stairs && player.x === dungeon.stairs.x && player.y === dungeon.stairs.y) {
    return { type: "descend" };
  }

  const target = dungeon.isBossFloor ? state.enemies[0] : dungeon.stairs;
  if (target) {
    const distanceMap = computeDistanceMap(dungeon, target);
    const next = stepTowards(dungeon, distanceMap, player);
    if (next) return directionTo(player, next);
  }

  return { type: "wait" };
}

interface RunResult {
  floor: number;
  turns: number;
  outcome: "victory" | "death" | "timeout";
  cause: string | null;
}

function runOne(seed: number): RunResult {
  let state = createInitialState(seed);
  for (let turn = 0; turn < MAX_TURNS_PER_GAME; turn++) {
    if (state.mode === "victory") return { floor: state.floor, turns: turn, outcome: "victory", cause: null };
    if (state.mode === "gameover") {
      return { floor: state.floor, turns: turn, outcome: "death", cause: state.deathCause };
    }
    const action = chooseAction(state);
    state = step(state, action).state;
  }
  return { floor: state.floor, turns: MAX_TURNS_PER_GAME, outcome: "timeout", cause: null };
}

function main(): void {
  const count = Number(process.argv[2] ?? 500);
  const startSeed = Number(process.argv[3] ?? 1);

  const results: RunResult[] = [];
  for (let i = 0; i < count; i++) results.push(runOne(startSeed + i));

  const floors = results.map((r) => r.floor);
  const avgFloor = floors.reduce((a, b) => a + b, 0) / results.length;
  const victories = results.filter((r) => r.outcome === "victory").length;
  const timeouts = results.filter((r) => r.outcome === "timeout").length;

  const byFloor = new Map<number, number>();
  for (const r of results) byFloor.set(r.floor, (byFloor.get(r.floor) ?? 0) + 1);

  const causeCounts = new Map<string, number>();
  for (const r of results) {
    if (r.cause) causeCounts.set(r.cause, (causeCounts.get(r.cause) ?? 0) + 1);
  }

  console.log(`Partidas simuladas: ${results.length}`);
  console.log(`Piso promedio alcanzado: ${avgFloor.toFixed(2)}`);
  console.log(`Victorias: ${victories} (${((victories / results.length) * 100).toFixed(1)}%)`);
  if (timeouts > 0) console.log(`Partidas colgadas (bug de IA?): ${timeouts}`);
  console.log("\nMuertes/llegadas por piso:");
  for (const floor of [...byFloor.keys()].sort((a, b) => a - b)) {
    console.log(`  piso ${floor}: ${byFloor.get(floor)}`);
  }
  console.log("\nCausas de muerte:");
  for (const [cause, n] of [...causeCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cause}: ${n}`);
  }
}

main();
