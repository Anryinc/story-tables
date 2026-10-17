import { compileScenario, type CompiledScenario } from "./compile";
import { getStoredScenario } from "./store";
import { getBundledScenario } from "@/projects/bundled";
import { getProject } from "@/projects/registry";

/** localStorage overrides the copy shipped in the repo. */
export function resolvePlayable(projectId: string): CompiledScenario | null {
  const stored = getStoredScenario(projectId);
  if (stored) return compileScenario(stored);

  const bundled = getBundledScenario(projectId);
  if (bundled) return compileScenario(bundled);

  const legacy = getProject(projectId);
  if (!legacy) return null;
  return {
    projectId: legacy.manifest.id,
    title: legacy.manifest.title,
    graph: legacy.graph,
    timeline: [],
    characters: [],
    playersMax: legacy.manifest.playersMax ?? 4,
    playersMin: legacy.manifest.playersMin ?? 1,
    initialFlags: [],
  };
}