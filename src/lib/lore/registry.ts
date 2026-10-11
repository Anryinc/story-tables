import { LOTM_BASE } from "./lotm";
import type { AbilityDef, LoreBase } from "./types";

const BASES: LoreBase[] = [LOTM_BASE];

export function listLoreBases(): LoreBase[] {
  return BASES;
}

export function getLoreBase(id: string | undefined | null): LoreBase | null {
  if (!id) return null;
  return BASES.find((b) => b.id === id) ?? null;
}

export function findAbility(base: LoreBase, abilityId: string): AbilityDef | null {
  for (const p of base.pathways) {
    for (const s of p.sequences) {
      const a = s.abilities.find((x) => x.id === abilityId);
      if (a) return a;
    }
  }
  return null;
}
