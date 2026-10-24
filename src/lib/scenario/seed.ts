import { getStoredScenario, saveScenario } from "./store";
import type { ScenarioDocument } from "./types";

/** Copy a bundled scenario into localStorage so the studio can edit it. */
export function seedScenarioToStudio(doc: ScenarioDocument, force = false): ScenarioDocument {
  const existing = getStoredScenario(doc.manifest.id);
  if (existing && !force) return existing;
  const next: ScenarioDocument = {
    ...doc,
    manifest: {
      ...doc.manifest,
      updatedAt: new Date().toISOString(),
    },
  };
  if (existing && force) {
    const placed = new Map<string, { x: number; y: number; w: number; h: number; locked?: boolean }>();
    for (const n of existing.nodes) {
      for (const o of n.data.sceneObjects ?? []) {
        placed.set(o.id, { x: o.x, y: o.y, w: o.w, h: o.h, locked: o.locked });
        if (o.linkNodeId) placed.set(o.linkNodeId, placed.get(o.id)!);
      }
    }
    next.nodes = next.nodes.map((n) => {
      const pins = n.data.sceneObjects;
      if (!pins?.length) return n;
      return {
        ...n,
        data: {
          ...n.data,
          sceneObjects: pins.map((o) => {
            const keep = placed.get(o.id) ?? (o.linkNodeId ? placed.get(o.linkNodeId) : undefined);
            return keep ? { ...o, ...keep } : o;
          }),
        },
      };
    });
  }
  saveScenario(next);
  return next;
}