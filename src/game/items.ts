import {
  ALFAJOR_HEAL,
  ALFAJOR_MAX_HP_BONUS,
  BELT_SLOTS,
  FACON_ATTACK_BONUS,
  MATE_HEAL,
  MONEDA_SCORE,
  PONCHO_DEFENSE_BONUS,
  VELA_VISION_BONUS,
  items as itemDefs,
} from "../content/items.js";
import type { ItemKind } from "../content/items.js";
import type { ItemPickup } from "./entities.js";
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

  if (def.categoria === "equipo") {
    const player =
      item.kind === "facon"
        ? { ...state.player, attack: state.player.attack + FACON_ATTACK_BONUS }
        : { ...state.player, defense: state.player.defense + PONCHO_DEFENSE_BONUS };
    return removeItem(logMessage(state, `Agarrás ${def.nombre}.`), item.id, { player });
  }

  if (def.categoria === "inmediato") {
    if (item.kind === "alfajor") {
      const maxHp = state.player.maxHp + ALFAJOR_MAX_HP_BONUS;
      const hp = Math.min(maxHp, state.player.hp + ALFAJOR_HEAL);
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

  // categoria "cinturon": mate o vela
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

  const belt = [...state.belt];
  belt[slot] = undefined;

  if (kind === "mate") {
    const hp = Math.min(state.player.maxHp, state.player.hp + MATE_HEAL);
    return {
      state: logMessage({ ...state, belt, player: { ...state.player, hp } }, "Tomás unos mates."),
      consumedTurn: true,
    };
  }

  // vela
  const vision = state.player.vision + VELA_VISION_BONUS;
  return {
    state: logMessage({ ...state, belt, player: { ...state.player, vision } }, "Prendés una vela."),
    consumedTurn: true,
  };
}
