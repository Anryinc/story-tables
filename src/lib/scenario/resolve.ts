import { compileScenario, type CompiledScenario } from "./compile";
import { getStoredScenario } from "./store";
import { getBundledScenario } from "@/projects/bundled";
import { getProject } from "@/projects/registry";
import type { ScenarioDocument, ScenarioNode } from "./types";

function freshen(url?: string) {
  if (!url) return url;
  return url.replace("/third-bell/ida.jpg", "/third-bell/ida.png");
}

/** If a studio copy was saved before the art, keep the text and put the pictures back. */
function withBundledArt(stored: ScenarioDocument, bundled: ScenarioDocument): ScenarioDocument {
  const art = new Map(bundled.nodes.map((n) => [n.id, n]));
  const nodes: ScenarioNode[] = stored.nodes.map((n) => {
    const source = art.get(n.id);
    if (!source) return n;
    return {
      ...n,
      data: {
        ...n.data,
        background: n.data.background || source.data.background,
        portraitUrl: freshen(n.data.portraitUrl || source.data.portraitUrl),
        imageUrl: n.data.imageUrl || source.data.imageUrl,
        grantItem: n.data.grantItem ?? source.data.grantItem,
        sceneObjects: (n.data.sceneObjects && n.data.sceneObjects.length > 0
          ? n.data.sceneObjects
          : source.data.sceneObjects
        )?.map((o) => ({ ...o, url: freshen(o.url) })),
      },
    };
  });
  return {
    ...stored,
    nodes,
    manifest: {
      ...stored.manifest,
      coverImage: stored.manifest.coverImage || bundled.manifest.coverImage,
    },
  };
}

/** localStorage overrides the copy shipped in the repo. */
export function resolvePlayable(projectId: string): CompiledScenario | null {
  const stored = getStoredScenario(projectId);
  const bundled = getBundledScenario(projectId);
  if (stored) return compileScenario(bundled ? withBundledArt(stored, bundled) : stored);

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