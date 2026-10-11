/** Pluggable lore bases (LoTM, etc.). */

export type AbilityEffect =
  | {
      type: "reveal_text";
      title: string;
      body: string;
      scope: "self" | "same_location" | "all";
    }
  | { type: "grant_clue"; clue: { id: string; title: string; body: string; source: string } }
  | { type: "set_flag"; flag: string }
  | { type: "unlock_location"; locationId: string };

export type AbilityMechanics = {
  cost: "action";
  cooldownRounds?: number;
  oncePerGame?: boolean;
  requiresFlags?: string[];
  setsFlags?: string[];
  effects: AbilityEffect[];
};

export type AbilityDef = {
  id: string;
  nameRu: string;
  descriptionRu: string;
  mechanics: AbilityMechanics;
};

export type SequenceDef = {
  rank: 9 | 8 | 7 | 6 | 5 | 4;
  nameRu: string;
  nameEn: string;
  potionSummaryRu?: string;
  actingPrincipleRu?: string;
  abilities: AbilityDef[];
};

export type PathwayDef = {
  id: string;
  nameRu: string;
  nameEn: string;
  group: string;
  sequences: SequenceDef[];
};

export type LoreBase = {
  id: string;
  title: string;
  version: string;
  locale: "ru";
  pathways: PathwayDef[];
};

export function abilityIdsForSequence(
  base: LoreBase,
  pathwayId: string,
  rank: number,
): string[] {
  const path = base.pathways.find((p) => p.id === pathwayId);
  if (!path) return [];
  const ids: string[] = [];
  for (const seq of path.sequences) {
    if (seq.rank >= rank) {
      for (const a of seq.abilities) ids.push(a.id);
    }
  }
  return ids;
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
