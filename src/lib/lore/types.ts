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
  | { type: "unlock_location"; locationId: string }
  | { type: "copy_last_ability"; rounds: number }
  | { type: "steal_memory" }
  | { type: "travel" }
  | { type: "borrow_neighbor"; rounds: number }
  | {
      type: "apply_status";
      status: {
        id: string;
        title: string;
        body: string;
        kind?: "mark" | "blessing" | "curse" | "restraint";
        blocks?: ("move" | "talk" | "inspect" | "ability")[];
        rounds?: number;
      };
    }
  | { type: "clear_status"; statusId?: string; kind?: "mark" | "blessing" | "curse" | "restraint" }
  | { type: "bind_oath" }
  | { type: "seal_exits"; rounds: number }
  | { type: "open_doors" }
  | { type: "reveal_hidden"; rounds?: number }
  | { type: "shift_background" }
  | { type: "clear_flags"; flags: string[] }
  | { type: "consume_spark" }
  | { type: "room_status"; status: { id: string; title: string; body: string; kind?: "mark" | "blessing" | "curse" | "restraint"; blocks?: ("move" | "talk" | "inspect" | "ability")[]; rounds?: number } };;

export type AbilityMechanics = {
  cost: "action";
  cooldownRounds?: number;
  oncePerGame?: boolean;
  requiresFlags?: string[];
  setsFlags?: string[];
  effects: AbilityEffect[];
};

export type AbilityKind = "active" | "passive" | "reaction";
/** none — без цели. person — кто-то в локации. spark — искра. any — человек или искра. */
export type AbilityTarget = "none" | "person" | "spark" | "any" | "location";
/** На что реагирует способность. Не тратит ход. */
export type AbilityTrigger = "inspect" | "talk" | "enter" | "ability";

export type AbilityDef = {
  id: string;
  nameRu: string;
  descriptionRu: string;
  /** По умолчанию активная: тратит ход. Пассивная работает, пока зелье на персонаже. Реакция срабатывает сама. */
  kind?: AbilityKind;
  /** По умолчанию без цели. */
  target?: AbilityTarget;
  /** Только для реакции: на какое действие в этой локации отозваться. */
  on?: AbilityTrigger;
  mechanics: AbilityMechanics;
};

export type SequenceDef = {
  rank: 9 | 8 | 7 | 6 | 5 | 4;
  nameRu: string;
  nameEn: string;
  /** Short potion / sequence blurb for character card */
  profileRu: string;
  potionSummaryRu?: string;
  actingPrincipleRu?: string;
  abilities: AbilityDef[];
};

export type PathwayDef = {
  id: string;
  nameRu: string;
  nameEn: string;
  group: string;
  /** Соседние пути той же группы. Можно взять один, способности добавятся, свои не пропадут. */
  neighbors?: string[];
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
  neighborId?: string,
): string[] {
  return abilitiesForSequence(base, pathwayId, rank, neighborId).map((a) => a.id);
}

export function abilitiesForSequence(
  base: LoreBase,
  pathwayId: string,
  rank: number,
  neighborId?: string,
): { id: string; nameRu: string; rank: number; kind: AbilityKind; neighbor?: boolean }[] {
  const collect = (id: string, neighbor: boolean) => {
    const path = base.pathways.find((p) => p.id === id);
    if (!path) return [];
    const out: { id: string; nameRu: string; rank: number; kind: AbilityKind; neighbor?: boolean }[] = [];
    for (const seq of path.sequences) {
      if (seq.rank < rank) continue;
      for (const a of seq.abilities) {
        out.push({
          id: a.id,
          nameRu: a.nameRu,
          rank: seq.rank,
          kind: a.kind ?? "active",
          neighbor: neighbor || undefined,
        });
      }
    }
    return out;
  };
  const own = collect(pathwayId, false);
  const extra = neighborId && neighborId !== pathwayId ? collect(neighborId, true) : [];
  return [...own, ...extra].sort((a, b) => b.rank - a.rank);
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

export function findSequence(
  base: LoreBase,
  pathwayId: string,
  rank: number,
): SequenceDef | null {
  const path = base.pathways.find((p) => p.id === pathwayId);
  return path?.sequences.find((s) => s.rank === rank) ?? null;
}
