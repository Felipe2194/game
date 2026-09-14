export type Action =
  | { type: "move"; dx: number; dy: number }
  | { type: "wait" }
  | { type: "descend" }
  | { type: "useItem"; slot: 1 | 2 | 3 }
  | { type: "viewMap" }
  | { type: "help" }
  | { type: "quit" };

// Mapeo tecla del navegador → acción (sección 3 del documento de diseño).
function resolveAction(key: string): Action | undefined {
  switch (key) {
    case "ArrowUp":
    case "w":
    case "k":
      return { type: "move", dx: 0, dy: -1 };
    case "ArrowDown":
    case "s":
    case "j":
      return { type: "move", dx: 0, dy: 1 };
    case "ArrowLeft":
    case "a":
    case "h":
      return { type: "move", dx: -1, dy: 0 };
    case "ArrowRight":
    case "d":
    case "l":
      return { type: "move", dx: 1, dy: 0 };
    case " ":
    case ".":
      return { type: "wait" };
    case "Enter":
    case ">":
      return { type: "descend" };
    case "1":
      return { type: "useItem", slot: 1 };
    case "2":
      return { type: "useItem", slot: 2 };
    case "3":
      return { type: "useItem", slot: 3 };
    case "m":
    case "M":
      return { type: "viewMap" };
    case "?":
      return { type: "help" };
    case "q":
    case "Q":
      return { type: "quit" };
    default:
      return undefined;
  }
}

// Escucha keydown del navegador y traduce a acciones (sección 14: reemplaza
// el modo raw de la terminal). Devuelve una función para dejar de escuchar.
export function listenForInput(onAction: (action: Action) => void): () => void {
  const handler = (event: KeyboardEvent) => {
    const action = resolveAction(event.key);
    if (!action) return;
    event.preventDefault();
    onAction(action);
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}
