/** Compile Studio ScenarioDocument → playable GraphDocument + timeline rules. */

import type { GraphDocument, GraphLocation, GraphNpc, GraphInspectable } from "@/lib/graph/types";
import type { ScenarioCharacter, ScenarioDocument, ScenarioNode } from "./types";

export type TimelineRule = {
  atRound: number;
  title: string;
  body: string;
  scope: "actor" | "same_location" | "all";
  scopeLocationId?: string;
  setFlags?: string[];
  grantClue?: { id: string; title: string; body: string; source: string; imageUrl?: string };
  unlockLocationId?: string;
  requiresAbilityId?: string;
  requiresAbilityUsed?: string;
  requiresFlag?: string;
  requiresAnyFlags?: string[];
  hideIfFlag?: string;
};

export type CompiledScenario = {
  graph: GraphDocument;
  timeline: TimelineRule[];
  title: string;
  projectId: string;
  characters: ScenarioCharacter[];
  loreBaseId?: string;
  playersMax: number;
  playersMin: number;
  initialFlags: string[];
  manifest?: ScenarioDocument["manifest"];
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
      description: n.data.description,
      exits: [],
      inspect: [],
      npcs: [],
      scene: (n.data.sceneObjects ?? [])
        .filter((o) => o.percent)
        .map((o) => ({
          id: o.id,
          label: o.label,
          url: o.url,
          x: o.x,
          y: o.y,
          w: o.w,
          h: o.h,
          linkNodeId: o.linkNodeId,
          interaction: o.interaction,
        })),
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
          requiresFlag: e.requiresFlag,
          requiresAnyFlags: e.requiresAnyFlags,
          hideIfFlag: e.hideIfFlag,
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
          audience: child.data.audience === "world" ? "world" : "each",
          setFlags: child.data.setFlags,
          clue: child.data.grantClue,
          image: child.data.imageUrl,
          item: child.data.grantItem,
          grantState: child.data.grantState,
          requiresState: child.data.requiresState,
          requiresFlag: child.data.requiresFlag,
          requiresAnyFlags: child.data.requiresAnyFlags,
          hideIfFlag: child.data.hideIfFlag,
        };
        if (!loc.inspect.some((x) => x.id === item.id)) loc.inspect.push(item);
      }

      if (child.kind === "npc") {
        const authored = child.data.talkOptions ?? [];
        const npc: GraphNpc = {
          id: child.id,
          name: child.data.npcName || child.data.title || "NPC",
          intro: child.data.npcIntro || child.data.description,
          portraitUrl: child.data.portraitUrl,
          requiresFlag: child.data.requiresFlag,
          requiresAnyFlags: child.data.requiresAnyFlags,
          hideIfFlag: child.data.hideIfFlag,
          options:
            authored.length > 0
              ? authored.map((o) => ({
                  id: o.id,
                  label: o.label || "Поговорить",
                  reply: o.reply || "…",
                  once: o.once !== false,
                  setFlags: o.setFlags,
                  clue: o.grantClue,
                  requiresFlag: o.requiresFlag,
                  requiresAnyFlags: o.requiresAnyFlags,
                  hideIfFlag: o.hideIfFlag,
                }))
              : [
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
      requiresAbilityId: m.requiresAbilityId,
      requiresAbilityUsed: m.requiresAbilityUsed,
      requiresFlag: m.requiresFlag,
      requiresAnyFlags: m.requiresAnyFlags,
      hideIfFlag: m.hideIfFlag,
    });
  }

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
        requiresAbilityId: n.data.requiresAbilityId,
        requiresAbilityUsed: n.data.requiresAbilityUsed,
        requiresFlag: n.data.requiresFlag,
        requiresAnyFlags: n.data.requiresAnyFlags,
        hideIfFlag: n.data.hideIfFlag,
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
        requiresAbilityId: ev.data.requiresAbilityId ?? n.data.requiresAbilityId,
        requiresAbilityUsed: ev.data.requiresAbilityUsed ?? n.data.requiresAbilityUsed,
        requiresFlag: ev.data.requiresFlag ?? n.data.requiresFlag,
        requiresAnyFlags: ev.data.requiresAnyFlags ?? n.data.requiresAnyFlags,
        hideIfFlag: ev.data.hideIfFlag ?? n.data.hideIfFlag,
      });
    }
  }

  const characters = doc.characters ?? [];

  return {
    projectId: doc.manifest.id,
    title: doc.manifest.title,
    graph: { version: 1, startLocationId, locations },
    timeline,
    characters,
    loreBaseId: doc.loreBaseId,
    playersMax: doc.manifest.playersMax || Math.max(4, characters.length),
    playersMin: doc.manifest.playersMin || 1,
    initialFlags: doc.initialFlags ?? [],
    manifest: doc.manifest,
  };
}
