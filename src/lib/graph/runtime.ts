import type {
  GraphDocument,
  GraphInspectable,
  GraphNpc,
  GraphTalkOption,
} from "./types";
import { gateOpen } from "./types";

export function locationName(graph: GraphDocument, id: string): string {
  return graph.locations[id]?.name ?? id;
}

export function availableExits(
  graph: GraphDocument,
  locationId: string,
  flags: Record<string, boolean>,
) {
  const loc = graph.locations[locationId];
  if (!loc) return [];
  return loc.exits
    .filter((e) => gateOpen(e, flags))
    .map((e) => ({ to: e.to, label: e.label ?? locationName(graph, e.to) }));
}

export function availableInspect(
  graph: GraphDocument,
  locationId: string,
  flags: Record<string, boolean>,
  seen: Set<string>,
): GraphInspectable[] {
  const loc = graph.locations[locationId];
  if (!loc) return [];
  return loc.inspect.filter((t) => {
    if (!gateOpen(t, flags)) return false;
    if (t.once && seen.has(t.id)) return false;
    return true;
  });
}

export function availableNpcs(
  graph: GraphDocument,
  locationId: string,
  flags: Record<string, boolean>,
): GraphNpc[] {
  const loc = graph.locations[locationId];
  if (!loc?.npcs) return [];
  return loc.npcs.filter((n) => gateOpen(n, flags));
}

export function availableTalkOptions(
  npc: GraphNpc,
  flags: Record<string, boolean>,
  used: Set<string>,
): GraphTalkOption[] {
  return npc.options.filter((o) => {
    if (!gateOpen(o, flags)) return false;
    if (o.once && used.has(`${npc.id}:${o.id}`)) return false;
    return true;
  });
}
