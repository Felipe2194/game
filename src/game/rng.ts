// RNG determinista (mulberry32) con estado inmutable: cada función pura
// recibe un Rng y devuelve el valor más el Rng siguiente, para poder
// testear, simular y reproducir partidas a partir de una semilla + lista
// de acciones sin depender de mutación oculta.
export interface Rng {
  readonly state: number;
}

export function createRng(seed: number): Rng {
  return { state: seed >>> 0 };
}

export function nextFloat(rng: Rng): [number, Rng] {
  let a = (rng.state + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, { state: a }];
}

// Entero al azar entre min y max, ambos inclusive.
export function nextInt(rng: Rng, min: number, max: number): [number, Rng] {
  const [f, next] = nextFloat(rng);
  return [min + Math.floor(f * (max - min + 1)), next];
}

export function nextBool(rng: Rng, probabilityTrue = 0.5): [boolean, Rng] {
  const [f, next] = nextFloat(rng);
  return [f < probabilityTrue, next];
}

export function pick<T>(rng: Rng, items: readonly T[]): [T, Rng] {
  const [index, next] = nextInt(rng, 0, items.length - 1);
  const item = items[index] as T;
  return [item, next];
}

// Fisher-Yates, sin mutar el array de entrada.
export function shuffle<T>(rng: Rng, items: readonly T[]): [T[], Rng] {
  const result = [...items];
  let current = rng;
  for (let i = result.length - 1; i > 0; i--) {
    const [j, next] = nextInt(current, 0, i);
    current = next;
    const a = result[i] as T;
    const b = result[j] as T;
    result[i] = b;
    result[j] = a;
  }
  return [result, current];
}
