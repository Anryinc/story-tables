import { LOTM_BASE } from "./lotm";
import type { LoreBase } from "./types";

const BASES: LoreBase[] = [LOTM_BASE];

export function listLoreBases(): LoreBase[] {
  return BASES;
}

export function getLoreBase(id: string | undefined | null): LoreBase | null {
  if (!id) return null;
  return BASES.find((b) => b.id === id) ?? null;
}
