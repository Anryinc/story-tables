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
  saveScenario(next);
  return next;
}