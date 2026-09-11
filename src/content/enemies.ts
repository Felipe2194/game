export type EnemyKind = "rata" | "murcielago" | "esqueleto" | "familiar" | "luz-mala" | "lobizon";

export type Speed = "lenta" | "normal" | "rapida";
export type Behavior = "perseguir" | "erratico" | "olfato" | "atraviesa" | "saltar";

export interface EnemyDef {
  kind: EnemyKind;
  nombre: string;
  verbo: string;
  pisos: [number, number];
  vida: number;
  dano: number;
  precision: number;
  velocidad: Speed;
  comportamiento: Behavior;
  esJefe?: boolean;
}

// Tabla de enemigos — sección 6 del documento de diseño.
export const enemies: Record<EnemyKind, EnemyDef> = {
  rata: {
    kind: "rata",
    nombre: "una rata",
    verbo: "te mordió",
    pisos: [1, 3],
    vida: 1,
    dano: 1,
    precision: 0.6,
    velocidad: "normal",
    comportamiento: "perseguir",
  },
  murcielago: {
    kind: "murcielago",
    nombre: "un murciélago",
    verbo: "te arañó",
    pisos: [1, 4],
    vida: 1,
    dano: 1,
    precision: 0.5,
    velocidad: "rapida",
    comportamiento: "erratico",
  },
  esqueleto: {
    kind: "esqueleto",
    nombre: "un esqueleto",
    verbo: "te golpeó",
    pisos: [3, 7],
    vida: 3,
    dano: 1,
    precision: 0.75,
    velocidad: "normal",
    comportamiento: "perseguir",
  },
  familiar: {
    kind: "familiar",
    nombre: "un familiar",
    verbo: "te mordió",
    pisos: [5, 9],
    vida: 4,
    dano: 2,
    precision: 0.7,
    velocidad: "normal",
    comportamiento: "olfato",
  },
  "luz-mala": {
    kind: "luz-mala",
    nombre: "una luz mala",
    verbo: "te quemó",
    pisos: [6, 9],
    vida: 2,
    dano: 1,
    precision: 0.9,
    velocidad: "lenta",
    comportamiento: "atraviesa",
  },
  lobizon: {
    kind: "lobizon",
    nombre: "el lobizón",
    verbo: "te destrozó",
    pisos: [10, 10],
    vida: 14,
    dano: 2,
    precision: 0.8,
    velocidad: "normal",
    comportamiento: "saltar",
    esJefe: true,
  },
};

const SPEED_FACTOR: Record<Speed, number> = {
  lenta: 0.5,
  normal: 1,
  rapida: 2,
};

export function speedFactor(speed: Speed): number {
  return SPEED_FACTOR[speed];
}

export function enemiesForFloor(floor: number): EnemyDef[] {
  return Object.values(enemies).filter(
    (def) => !def.esJefe && floor >= def.pisos[0] && floor <= def.pisos[1],
  );
}

// Cantidad por piso: 2 + número de piso, con un máximo de 9.
export function enemyCountForFloor(floor: number): number {
  return Math.min(9, 2 + floor);
}
