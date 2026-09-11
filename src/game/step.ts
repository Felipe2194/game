import type { Action } from "../engine/input.js";
import { enemies as enemyDefs } from "../content/enemies.js";
import { enemyDefeatedMessage, playerAttackMessage } from "../content/messages.js";
import { SCORE_PER_ENEMY, SCORE_VICTORY } from "./config.js";
import { playerAttackDamage } from "./combat.js";
import { isWalkable, tileAt } from "./dungeon/types.js";
import { enemyAt, itemAt } from "./dungeon/populate.js";
import type { GameEvent } from "./events.js";
import { pickUpItem, useBeltSlot } from "./items.js";
import type { GameState, Mode } from "./state.js";
import { descendToNextFloor, logMessage, refreshVision } from "./state.js";
import { resolveEnemyTurns } from "./turns.js";

export type { GameEvent } from "./events.js";

export interface StepResult {
  state: GameState;
  events: GameEvent[];
}

const MODE_TOGGLES: Partial<Record<Action["type"], Mode>> = {
  viewMap: "map",
  help: "help",
};

function runEnemyTurn(state: GameState, events: GameEvent[]): StepResult {
  const result = resolveEnemyTurns(state);
  return { state: result.state, events: [...events, ...result.events] };
}

// step es pura: no toca la terminal ni el reloj. Recibe una acción y
// devuelve el estado siguiente más los eventos ocurridos, sin efectos
// secundarios — así se puede testear y simular sin pantalla.
export function step(state: GameState, action: Action): StepResult {
  if (action.type === "quit") {
    return { state, events: [{ type: "quit" }] };
  }

  if (state.mode === "gameover" || state.mode === "victory") {
    return { state, events: [{ type: "restartRequested" }] };
  }

  const toggledMode = MODE_TOGGLES[action.type];
  if (toggledMode) {
    const nextMode = state.mode === toggledMode ? "play" : toggledMode;
    return { state: { ...state, mode: nextMode }, events: [] };
  }
  if (state.mode !== "play") {
    // Cualquier otra tecla cierra la pantalla superpuesta (mapa/ayuda).
    return { state: { ...state, mode: "play" }, events: [] };
  }

  if (action.type === "descend") {
    if (tileAt(state.dungeon, state.player.x, state.player.y) !== "stairs") {
      return { state: logMessage(state, "No hay ninguna escalera acá."), events: [] };
    }
    const next = descendToNextFloor(state);
    return {
      state: logMessage(next, `Bajás al piso ${next.floor}.`),
      events: [{ type: "descended", floor: next.floor }],
    };
  }

  if (action.type === "wait") {
    return runEnemyTurn(state, []);
  }

  if (action.type === "useItem") {
    const result = useBeltSlot(state, action.slot - 1);
    return result.consumedTurn ? runEnemyTurn(result.state, []) : { state: result.state, events: [] };
  }

  if (action.type !== "move") {
    return { state, events: [] };
  }

  const nextX = state.player.x + action.dx;
  const nextY = state.player.y + action.dy;
  const facingLeft = action.dx !== 0 ? action.dx < 0 : state.facingLeft;

  const target = enemyAt(state.enemies, nextX, nextY);
  if (target) {
    const damage = playerAttackDamage(state.player.attack);
    const hp = target.hp - damage;
    const defeated = hp <= 0;
    const enemies = defeated
      ? state.enemies.filter((e) => e.id !== target.id)
      : state.enemies.map((e) => (e.id === target.id ? { ...e, hp } : e));

    const def = enemyDefs[target.kind];
    const message = defeated ? enemyDefeatedMessage(def) : playerAttackMessage(def, damage);

    if (defeated && target.kind === "lobizon") {
      const victoryState: GameState = {
        ...state,
        enemies,
        facingLeft,
        mode: "victory",
        score: state.score + SCORE_VICTORY,
      };
      return {
        state: logMessage(victoryState, message),
        events: [
          { type: "attacked", enemyKind: target.kind, defeated },
          { type: "victory", floor: state.floor },
        ],
      };
    }

    const attacked: GameState = {
      ...state,
      enemies,
      facingLeft,
      score: state.score + (defeated ? SCORE_PER_ENEMY : 0),
    };

    return runEnemyTurn(logMessage(attacked, message), [
      { type: "attacked", enemyKind: target.kind, defeated },
    ]);
  }

  if (!isWalkable(state.dungeon, nextX, nextY)) {
    return { state, events: [{ type: "blocked" }] };
  }

  const moved: GameState = {
    ...state,
    player: { ...state.player, x: nextX, y: nextY },
    facingLeft,
  };

  const pickedUpItem = itemAt(moved.items, nextX, nextY);
  const afterPickup = pickedUpItem ? pickUpItem(moved, pickedUpItem) : moved;

  return runEnemyTurn(refreshVision(afterPickup), [{ type: "moved" }]);
}
