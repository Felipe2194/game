// Paleta de 16 colores — ver sección 10 del documento de diseño.
export const paletteKeys = [
  "·", "a", "b", "c", "d", "e", "f", "g",
  "h", "i", "j", "k", "l", "m", "n", "o",
] as const;

export type PaletteKey = (typeof paletteKeys)[number];

export const palette: Record<PaletteKey, string> = {
  "·": "#0e0f1a", // Fondo, zonas nunca vistas
  a: "#1a1c2c", // Piso, sombras profundas
  b: "#29366f", // Detalles fríos
  c: "#5d275d", // Cuervo sombrío, magia
  d: "#b13e53", // Vida, ojos de enemigos, poción de vida
  e: "#ef7d57", // Brillos cálidos, fuego fatuo, antorcha
  f: "#ffcd75", // Escalera, oro, antorcha
  g: "#a7f070", // Fuego fatuo (núcleo)
  h: "#38b764", // Veneno, musgo, espíritu del bosque
  i: "#257179", // Agua, detalles de pared, escarabajo de río
  j: "#333c57", // Paredes
  k: "#8b5a3c", // Lobo acechador
  l: "#4e342e", // Madera, cazador errante, sombras marrones
  m: "#f4f4f4", // Texto, brillo de vidrio (poción)
  n: "#c9a26b", // Capa de cuero, ración de carne
  o: "#94b0c2", // Borde superior de paredes, metal, daga
};

// Tabla de atenuación para casillas recordadas (sección 10).
export const dimmed: Record<PaletteKey, PaletteKey> = {
  "·": "·",
  o: "j",
  j: "a",
  l: "a",
  f: "l",
  n: "l",
  e: "l",
  a: "·",
  b: "·",
  c: "·",
  d: "·",
  g: "·",
  h: "·",
  i: "·",
  k: "·",
  m: "·",
};

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const rgbCache = new Map<PaletteKey, Rgb>();

export function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

export function rgbOf(key: PaletteKey): Rgb {
  let cached = rgbCache.get(key);
  if (!cached) {
    cached = hexToRgb(palette[key]);
    rgbCache.set(key, cached);
  }
  return cached;
}
