export type ItemKind = "mate" | "vela" | "alfajor" | "facon" | "poncho" | "moneda";
export type ItemCategory = "cinturon" | "inmediato" | "equipo";

export interface ItemDef {
  kind: ItemKind;
  nombre: string;
  categoria: ItemCategory;
}

// Tabla de objetos — sección 7 del documento de diseño.
export const items: Record<ItemKind, ItemDef> = {
  mate: { kind: "mate", nombre: "un mate", categoria: "cinturon" },
  vela: { kind: "vela", nombre: "una vela", categoria: "cinturon" },
  alfajor: { kind: "alfajor", nombre: "un alfajor", categoria: "inmediato" },
  facon: { kind: "facon", nombre: "un facón", categoria: "equipo" },
  poncho: { kind: "poncho", nombre: "un poncho", categoria: "equipo" },
  moneda: { kind: "moneda", nombre: "una moneda", categoria: "inmediato" },
};

export const MATE_HEAL = 2;
export const VELA_VISION_BONUS = 3; // visión 5 → 8
export const ALFAJOR_MAX_HP_BONUS = 1;
export const ALFAJOR_HEAL = 1;
export const FACON_ATTACK_BONUS = 1;
export const PONCHO_DEFENSE_BONUS = 1;
export const MONEDA_SCORE = 10; // sección 12: "por moneda"

export const MATE_PER_FLOOR: [min: number, max: number] = [1, 2];
export const VELA_SPAWN_CHANCE = 0.3;
export const ALFAJOR_EVERY_N_FLOORS = 3;
export const COINS_PER_FLOOR: [min: number, max: number] = [3, 5];
export const FACON_FLOOR_RANGE: [min: number, max: number] = [2, 4];
export const PONCHO_FLOOR_RANGE: [min: number, max: number] = [3, 6];

export const BELT_SLOTS = 3;
