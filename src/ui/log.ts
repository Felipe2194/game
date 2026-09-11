// Las últimas 2 líneas del log de mensajes (sección 10: filas 22–23).
export function visibleLogLines(messages: string[]): [string, string] {
  const [line1, line2] = messages.slice(-2);
  return [line1 ?? "", line2 ?? ""];
}
