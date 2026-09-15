import type { ItemKind } from "../content/items.js";
import type { Player } from "../game/state.js";

function hearts(player: Player): string {
  const full = "♥".repeat(Math.max(0, player.hp));
  const empty = "♡".repeat(Math.max(0, player.maxHp - player.hp));
  return full + empty;
}

// Referencia de sección 10: `zona 3  ♥♥♥♥♡♡  atq 2 def 1  [1]pocion [2]antorcha [3]·            oro 12`
export function buildHud(
  floor: number,
  player: Player,
  belt: (ItemKind | undefined)[],
  gold: number,
  width: number,
): string {
  const left =
    `zona ${floor}  ${hearts(player)}  atq ${player.attack} def ${player.defense}  ` +
    belt.map((slot, i) => `[${i + 1}]${slot ?? "·"}`).join(" ");
  const right = `oro ${gold}`;
  const gap = Math.max(1, width - left.length - right.length);
  return left + " ".repeat(gap) + right;
}
