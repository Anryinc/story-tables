/** @deprecated Use scenario.characters — kept for MAX_PARTY constant. */

import type { ScenarioCharacter } from "@/lib/scenario/types";

export const MAX_PARTY = 6;

export type CharacterView = {
  id: string;
  name: string;
  pathway: string;
  blurb: string;
  portraitUrl?: string;
};

export function charactersToView(list: ScenarioCharacter[] | undefined): CharacterView[] {
  return (list ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    pathway: c.lore
      ? `${c.lore.pathwayId} · C${c.lore.sequenceRank}`
      : "—",
    blurb: c.blurb,
    portraitUrl: c.portraitUrl,
  }));
}
