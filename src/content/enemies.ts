export type EnemyKind = "escarabajo" | "cuervo" | "espiritu" | "lobo" | "fuego-fatuo" | "alfa";

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

// Tabla de enemigos — sección 6 del documento de diseño, retemada sobre
// "GANK — El Monte Oscuro" (ver referencia sheet.png en la sección 10).
export const enemies: Record<EnemyKind, EnemyDef> = {
  escarabajo: {
    kind: "escarabajo",
    nombre: "un escarabajo de río",
    verbo: "te picó",
    pisos: [1, 3],
    vida: 1,
    dano: 1,
    precision: 0.6,
    velocidad: "normal",
    comportamiento: "perseguir",
  },
  cuervo: {
    kind: "cuervo",
    nombre: "un cuervo sombrío",
    verbo: "te picoteó",
    pisos: [1, 4],
    vida: 1,
    dano: 1,
    precision: 0.5,
    velocidad: "rapida",
    comportamiento: "erratico",
  },
  espiritu: {
    kind: "espiritu",
    nombre: "un espíritu del bosque",
    verbo: "te golpeó",
    pisos: [3, 7],
    vida: 3,
    dano: 1,
    precision: 0.75,
    velocidad: "normal",
    comportamiento: "perseguir",
  },
  lobo: {
    kind: "lobo",
    nombre: "un lobo acechador",
    verbo: "te mordió",
    pisos: [5, 9],
    vida: 4,
    dano: 2,
    precision: 0.7,
    velocidad: "normal",
    comportamiento: "olfato",
  },
  "fuego-fatuo": {
    kind: "fuego-fatuo",
    nombre: "un fuego fatuo",
    verbo: "te quemó",
    pisos: [6, 9],
    vida: 2,
    dano: 1,
    precision: 0.9,
    velocidad: "lenta",
    comportamiento: "atraviesa",
  },
  alfa: {
    kind: "alfa",
    nombre: "el Alfa",
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
