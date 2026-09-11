export type Action =
  | { type: "move"; dx: number; dy: number }
  | { type: "wait" }
  | { type: "descend" }
  | { type: "useItem"; slot: 1 | 2 | 3 }
  | { type: "viewMap" }
  | { type: "help" }
  | { type: "quit" };

const CTRL_C = "\x03";

// Mapeo directo tecla → acción para las teclas de un solo byte.
const KEY_TO_ACTION: Record<string, Action> = {
  // Flechas se manejan aparte (secuencias de escape de 3 bytes).
  w: { type: "move", dx: 0, dy: -1 },
  a: { type: "move", dx: -1, dy: 0 },
  s: { type: "move", dx: 0, dy: 1 },
  d: { type: "move", dx: 1, dy: 0 },
  k: { type: "move", dx: 0, dy: -1 },
  h: { type: "move", dx: -1, dy: 0 },
  j: { type: "move", dx: 0, dy: 1 },
  l: { type: "move", dx: 1, dy: 0 },
  " ": { type: "wait" },
  ".": { type: "wait" },
  "\r": { type: "descend" },
  ">": { type: "descend" },
  "1": { type: "useItem", slot: 1 },
  "2": { type: "useItem", slot: 2 },
  "3": { type: "useItem", slot: 3 },
  m: { type: "viewMap" },
  M: { type: "viewMap" },
  "?": { type: "help" },
  q: { type: "quit" },
  Q: { type: "quit" },
};

const ARROW_TO_ACTION: Record<string, Action> = {
  A: { type: "move", dx: 0, dy: -1 }, // arriba
  B: { type: "move", dx: 0, dy: 1 }, // abajo
  C: { type: "move", dx: 1, dy: 0 }, // derecha
  D: { type: "move", dx: -1, dy: 0 }, // izquierda
};

// Convierte un chunk crudo de stdin en cero o más acciones. Puede llegar
// más de una tecla por chunk si el usuario tipea rápido.
export function parseInput(chunk: string): Action[] {
  const actions: Action[] = [];
  let i = 0;
  while (i < chunk.length) {
    const char = chunk[i];
    if (char === CTRL_C) {
      actions.push({ type: "quit" });
      i++;
      continue;
    }
    if (char === "\x1b" && chunk[i + 1] === "[" && chunk[i + 2]) {
      const arrow = ARROW_TO_ACTION[chunk[i + 2] as string];
      if (arrow) actions.push(arrow);
      i += 3;
      continue;
    }
    const action = char !== undefined ? KEY_TO_ACTION[char] : undefined;
    if (action) actions.push(action);
    i++;
  }
  return actions;
}

export function listenForInput(onAction: (action: Action) => void): () => void {
  const handler = (data: Buffer) => {
    const chunk = data.toString("utf8");
    for (const action of parseInput(chunk)) {
      onAction(action);
    }
  };
  process.stdin.on("data", handler);
  return () => process.stdin.off("data", handler);
}
