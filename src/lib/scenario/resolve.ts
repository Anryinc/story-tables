import { compileScenario, type CompiledScenario } from "./compile";
import { getStoredScenario } from "./store";
import { cherwoodScenario } from "@/projects/cherwood/scenario";
import { getProject } from "@/projects/registry";

/** Resolve playable pack: localStorage → bundled scenario → legacy graph. */
export function resolvePlayable(projectId: string): CompiledScenario | null {
  const stored = getStoredScenario(projectId);
  if (stored) return compileScenario(stored);

  if (projectId === "cherwood") {
    return compileScenario(cherwoodScenario);
  }

  const bundled = getProject(projectId);
  if (!bundled) return null;
  return {
    projectId: bundled.manifest.id,
    title: bundled.manifest.title,
    graph: bundled.graph,
    timeline: [],
  };
}
