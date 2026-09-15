import {
  ANTORCHA_VISION_BONUS,
  BELT_SLOTS,
  CAPA_DEFENSE_BONUS,
  COFRE_EMPTY_CHANCE,
  COFRE_GOLD_RANGE,
  DAGA_ATTACK_BONUS,
  MONEDA_SCORE,
  POCION_HEAL,
  RACION_HEAL,
  RACION_MAX_HP_BONUS,
  items as itemDefs,
} from "../content/items.js";
import type { ItemKind } from "../content/items.js";
import type { ItemPickup } from "./entities.js";
import { nextBool, nextInt } from "./rng.js";
import { logMessage } from "./state.js";
import type { GameState } from "./state.js";

export type Belt = (ItemKind | undefined)[];

export function createEmptyBelt(): Belt {
  return new Array(BELT_SLOTS).fill(undefined);
}

// Los objetos se agarran solos al pisarlos (sección 7). Cinturón, equipo e
// inmediatos se resuelven acá; si el cinturón está lleno, el objeto queda
// en el suelo.
export function pickUpItem(state: GameState, item: ItemPickup): GameState {
  const def = itemDefs[item.kind];

  if (def.categoria === "cofre") {
    const [isEmpty, afterEmpty] = nextBool(state.rng, COFRE_EMPTY_CHANCE);
    if (isEmpty) {
      return removeItem(logMessage({ ...state, rng: afterEmpty }, "El cofre está vacío."), item.id, {});
    }
    const [gold, afterGold] = nextInt(afterEmpty, COFRE_GOLD_RANGE[0], COFRE_GOLD_RANGE[1]);
    return removeItem(
      logMessage({ ...state, rng: afterGold }, `Abrís el cofre: ${gold} monedas.`),
      item.id,
      { gold: state.gold + gold, score: state.score + gold * MONEDA_SCORE },
    );
  }

  if (def.categoria === "equipo") {
    const player =
      item.kind === "daga"
        ? { ...state.player, attack: state.player.attack + DAGA_ATTACK_BONUS }
        : { ...state.player, defense: state.player.defense + CAPA_DEFENSE_BONUS };
    return removeItem(logMessage(state, `Agarrás ${def.nombre}.`), item.id, { player });
  }

  if (def.categoria === "inmediato") {
    if (item.kind === "racion") {
      const maxHp = state.player.maxHp + RACION_MAX_HP_BONUS;
      const hp = Math.min(maxHp, state.player.hp + RACION_HEAL);
      return removeItem(logMessage(state, `Comés ${def.nombre}.`), item.id, {
        player: { ...state.player, maxHp, hp },
      });
    }
    // moneda
    return removeItem(logMessage(state, `Agarrás ${def.nombre}.`), item.id, {
      gold: state.gold + 1,
      score: state.score + MONEDA_SCORE,
    });
  }

  // categoria "cinturon": poción o antorcha
  const emptySlot = state.belt.indexOf(undefined);
  if (emptySlot === -1) {
    return logMessage(state, "Tu cinturón está lleno.");
  }
  const belt = [...state.belt];
  belt[emptySlot] = item.kind;
  return removeItem(logMessage(state, `Guardás ${def.nombre} en el cinturón.`), item.id, { belt });
}

function removeItem(state: GameState, itemId: number, patch: Partial<GameState>): GameState {
  return { ...state, ...patch, items: state.items.filter((i) => i.id !== itemId) };
}

export interface UseBeltResult {
  state: GameState;
  consumedTurn: boolean;
}

// Usar el objeto del cinturón (sección 3: teclas 1·2·3). Consume turno solo
// si había algo para usar — la decisión de cuándo curarse importa porque
// gastás un turno para hacerlo (sección 4 del doc).
export function useBeltSlot(state: GameState, slot: number): UseBeltResult {
  const kind = state.belt[slot];
  if (!kind) {
    return { state: logMessage(state, "No tenés nada ahí."), consumedTurn: false };
  }

  if (kind === "pocion" && state.player.hp >= state.player.maxHp) {
    // No se gasta la poción (ni el turno) si ya tenés la vida al máximo —
    // antes se perdía sin curar nada.
    return { state: logMessage(state, "Ya tenés la vida al máximo."), consumedTurn: false };
  }

  const belt = [...state.belt];
  belt[slot] = undefined;

  if (kind === "pocion") {
    const hp = Math.min(state.player.maxHp, state.player.hp + POCION_HEAL);
    return {
      state: logMessage(
        { ...state, belt, player: { ...state.player, hp } },
        "Tomás la poción de vida.",
      ),
      consumedTurn: true,
    };
  }

  // antorcha
  const vision = state.player.vision + ANTORCHA_VISION_BONUS;
  return {
    state: logMessage(
      { ...state, belt, player: { ...state.player, vision } },
      "Encendés la antorcha.",
    ),
    consumedTurn: true,
  };
}
