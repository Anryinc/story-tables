import { cherwoodScenario } from "@/projects/cherwood/scenario";
import { getStoredScenario, saveScenario } from "./store";
import type { ScenarioDocument } from "./types";

/** Install / refresh bundled Cherwood into localStorage for the studio. */
export function seedCherwoodToStudio(force = false): ScenarioDocument {
  const existing = getStoredScenario("cherwood");
  if (existing && !force) return existing;
  const doc: ScenarioDocument = {
    ...cherwoodScenario,
    manifest: {
      ...cherwoodScenario.manifest,
      updatedAt: new Date().toISOString(),
    },
  };
  saveScenario(doc);
  return doc;
}
