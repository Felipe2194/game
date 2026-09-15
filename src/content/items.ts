export type ItemKind = "pocion" | "antorcha" | "racion" | "daga" | "capa" | "moneda" | "cofre";
export type ItemCategory = "cinturon" | "inmediato" | "equipo" | "cofre";

export interface ItemDef {
  kind: ItemKind;
  nombre: string;
  categoria: ItemCategory;
}

// Tabla de objetos — sección 7 del documento de diseño, retemada sobre
// "GANK — El Monte Oscuro" (ver referencia sheet.png en la sección 10).
export const items: Record<ItemKind, ItemDef> = {
  pocion: { kind: "pocion", nombre: "una poción de vida", categoria: "cinturon" },
  antorcha: { kind: "antorcha", nombre: "una antorcha", categoria: "cinturon" },
  racion: { kind: "racion", nombre: "una ración de carne", categoria: "inmediato" },
  daga: { kind: "daga", nombre: "una daga de caza", categoria: "equipo" },
  capa: { kind: "capa", nombre: "una capa de cuero", categoria: "equipo" },
  moneda: { kind: "moneda", nombre: "una moneda", categoria: "inmediato" },
  cofre: { kind: "cofre", nombre: "un cofre", categoria: "cofre" },
};

export const POCION_HEAL = 2;
export const ANTORCHA_VISION_BONUS = 3; // visión 5 → 8
export const RACION_MAX_HP_BONUS = 1;
export const RACION_HEAL = 1;
export const DAGA_ATTACK_BONUS = 1;
export const CAPA_DEFENSE_BONUS = 1;
export const MONEDA_SCORE = 10; // sección 12: "por moneda"

export const POCION_PER_FLOOR: [min: number, max: number] = [1, 2];
export const ANTORCHA_SPAWN_CHANCE = 0.3;
export const RACION_EVERY_N_FLOORS = 3;
export const COINS_PER_FLOOR: [min: number, max: number] = [3, 5];
export const DAGA_FLOOR_RANGE: [min: number, max: number] = [2, 4];
export const CAPA_FLOOR_RANGE: [min: number, max: number] = [3, 6];

export const BELT_SLOTS = 3;

// Cofres (sección 7): pueden estar vacíos o dar oro. Uno cada tantos pisos.
export const COFRE_EVERY_N_FLOORS = 2;
export const COFRE_EMPTY_CHANCE = 0.35;
export const COFRE_GOLD_RANGE: [min: number, max: number] = [4, 9];
