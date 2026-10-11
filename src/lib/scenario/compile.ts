/** Compile Studio ScenarioDocument → playable GraphDocument + timeline rules. */

import type { GraphDocument, GraphLocation, GraphNpc, GraphInspectable } from "@/lib/graph/types";
import type { ScenarioDocument, ScenarioNode } from "./types";

export type TimelineRule = {
  atRound: number;
  title: string;
  body: string;
  scope: "actor" | "same_location" | "all";
  scopeLocationId?: string;
  setFlags?: string[];
  grantClue?: { id: string; title: string; body: string; source: string };
  unlockLocationId?: string;
};

export type CompiledScenario = {
  graph: GraphDocument;
  timeline: TimelineRule[];
  title: string;
  projectId: string;
};

function locIdOf(n: ScenarioNode): string {
  return n.data.locationId || n.id;
}

export function compileScenario(doc: ScenarioDocument): CompiledScenario {
  const byId = Object.fromEntries(doc.nodes.map((n) => [n.id, n]));
  const locations: Record<string, GraphLocation> = {};

  for (const n of doc.nodes) {
    if (n.kind !== "location") continue;
    const id = locIdOf(n);
    locations[id] = {
      id,
      name: n.data.title || id,
      image: n.data.background,
      exits: [],
      inspect: [],
      npcs: [],
    };
  }

  for (const e of doc.edges) {
    const a = byId[e.from];
    const b = byId[e.to];
    if (!a || !b) continue;
    if (a.kind === "location" && b.kind === "location") {
      const from = locIdOf(a);
      const to = locIdOf(b);
      if (locations[from] && locations[to]) {
        locations[from].exits.push({
          to,
          label: e.label || b.data.title || to,
        });
      }
    }
  }

  for (const e of doc.edges) {
    const a = byId[e.from];
    const b = byId[e.to];
    if (!a || !b) continue;

    const pair: [ScenarioNode, ScenarioNode][] = [];
    if (a.kind === "location" && (b.kind === "inspect" || b.kind === "npc"))
      pair.push([a, b]);
    if (b.kind === "location" && (a.kind === "inspect" || a.kind === "npc"))
      pair.push([b, a]);

    for (const [locNode, child] of pair) {
      const lid = locIdOf(locNode);
      const loc = locations[lid];
      if (!loc) continue;

      if (child.kind === "inspect") {
        const item: GraphInspectable = {
          id: child.id,
          label: child.data.inspectLabel || child.data.title || "Осмотр",
          result: child.data.inspectResult || child.data.body || "…",
          once: child.data.once !== false,
          setFlags: child.data.setFlags,
          clue: child.data.grantClue,
        };
        if (!loc.inspect.some((x) => x.id === item.id)) loc.inspect.push(item);
      }

      if (child.kind === "npc") {
        const npc: GraphNpc = {
          id: child.id,
          name: child.data.npcName || child.data.title || "NPC",
          intro: child.data.npcIntro || child.data.description,
          options: [
            {
              id: "talk",
              label: "Поговорить",
              reply: child.data.body || child.data.npcIntro || "…",
              once: false,
              setFlags: child.data.setFlags,
              clue: child.data.grantClue,
            },
          ],
        };
        if (!loc.npcs!.some((x) => x.id === npc.id)) loc.npcs!.push(npc);
      }
    }
  }

  let startLocationId = Object.keys(locations)[0] ?? "room_1";
  const startNode = doc.nodes.find((n) => n.kind === "start");
  if (startNode) {
    const edge = doc.edges.find((e) => e.from === startNode.id);
    const target = edge ? byId[edge.to] : null;
    if (target?.kind === "location") startLocationId = locIdOf(target);
  }

  if (Object.keys(locations).length === 0) {
    locations.room_1 = {
      id: "room_1",
      name: "Пустая комната",
      exits: [],
      inspect: [],
      npcs: [],
    };
    startLocationId = "room_1";
  }

  const timeline: TimelineRule[] = [];

  // Primary: timeline ruler markers
  for (const m of doc.timeline ?? []) {
    timeline.push({
      atRound: m.atRound,
      title: m.title,
      body: m.body,
      scope: m.scope,
      scopeLocationId: m.scopeLocationId,
      setFlags: m.setFlags,
      grantClue: m.grantClue,
      unlockLocationId: m.unlockLocationId,
    });
  }

  // Legacy: timeline nodes on graph
  for (const n of doc.nodes) {
    if (n.kind !== "timeline") continue;
    const atRound = n.data.atRound ?? 1;
    const outs = doc.edges.filter((e) => e.from === n.id);
    if (outs.length === 0) {
      timeline.push({
        atRound,
        title: n.data.title || `Ход ${atRound}`,
        body: n.data.body || n.data.description || "",
        scope: n.data.scope ?? "all",
        scopeLocationId: n.data.scopeLocationId,
        setFlags: n.data.setFlags,
        grantClue: n.data.grantClue,
        unlockLocationId: n.data.unlockLocationId,
      });
      continue;
    }
    for (const e of outs) {
      const ev = byId[e.to];
      if (!ev) continue;
      timeline.push({
        atRound,
        title: ev.data.title || n.data.title || `Ход ${atRound}`,
        body: ev.data.body || ev.data.description || "",
        scope: ev.data.scope ?? n.data.scope ?? "all",
        scopeLocationId: ev.data.scopeLocationId ?? n.data.scopeLocationId,
        setFlags: ev.data.setFlags ?? n.data.setFlags,
        grantClue: ev.data.grantClue ?? n.data.grantClue,
        unlockLocationId: ev.data.unlockLocationId ?? n.data.unlockLocationId,
      });
    }
  }

  return {
    projectId: doc.manifest.id,
    title: doc.manifest.title,
    graph: { version: 1, startLocationId, locations },
    timeline,
  };
}
