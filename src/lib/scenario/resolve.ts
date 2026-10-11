import { compileScenario, type CompiledScenario } from "./compile";
import { getStoredScenario } from "./store";
import { getProject } from "@/projects/registry";

/** Resolve playable pack: studio localStorage first, then bundled Cherwood. */
export function resolvePlayable(projectId: string): CompiledScenario | null {
  const stored = getStoredScenario(projectId);
  if (stored) return compileScenario(stored);

  const bundled = getProject(projectId);
  if (!bundled) return null;
  return {
    projectId: bundled.manifest.id,
    title: bundled.manifest.title,
    graph: bundled.graph,
    timeline: [],
  };
}
