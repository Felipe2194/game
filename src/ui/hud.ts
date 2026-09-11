import type { Player } from "../game/state.js";

function hearts(player: Player): string {
  const full = "♥".repeat(Math.max(0, player.hp));
  const empty = "♡".repeat(Math.max(0, player.maxHp - player.hp));
  return full + empty;
}

export interface BeltSlot {
  label: string;
}

// Referencia de sección 10: `piso 3  ♥♥♥♥♡♡  atq 2 def 1  [1]mate [2]vela [3]·            oro 12`
export function buildHud(
  floor: number,
  player: Player,
  belt: [BeltSlot | undefined, BeltSlot | undefined, BeltSlot | undefined],
  gold: number,
  width: number,
): string {
  const left =
    `piso ${floor}  ${hearts(player)}  atq ${player.attack} def ${player.defense}  ` +
    belt.map((slot, i) => `[${i + 1}]${slot?.label ?? "·"}`).join(" ");
  const right = `oro ${gold}`;
  const gap = Math.max(1, width - left.length - right.length);
  return left + " ".repeat(gap) + right;
}
