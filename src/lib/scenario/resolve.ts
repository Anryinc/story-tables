import { compileScenario, type CompiledScenario } from "./compile";
import { getStoredScenario } from "./store";
import { getBundledScenario } from "@/projects/bundled";
import { getProject } from "@/projects/registry";
import type { ScenarioDocument, ScenarioNode } from "./types";

function freshen(url?: string) {
  if (!url) return url;
  return url.replace("/third-bell/ida.jpg", "/third-bell/ida.png");
}

function dead(url?: string) {
  return !url || url.startsWith("blob:");
}

/** If a studio copy was saved before the art, keep the text and put the pictures back. */
function withBundledArt(stored: ScenarioDocument, bundled: ScenarioDocument): ScenarioDocument {
  const art = new Map(bundled.nodes.map((n) => [n.id, n]));
  const nodes: ScenarioNode[] = stored.nodes.map((n) => {
    const source = art.get(n.id);
    if (!source) return n;
    const srcPins = source.data.sceneObjects ?? [];
    const storedPins = n.data.sceneObjects ?? [];
    const pins = storedPins.length === 0
      ? srcPins
      : storedPins.map((o) => {
          const src = srcPins.find((s) => s.id === o.id || s.linkNodeId === o.linkNodeId);
          return {
            ...o,
            url: dead(o.url) ? src?.url : o.url,
            percent: o.percent ?? src?.percent ?? true,
          };
        });
    return {
      ...n,
      data: {
        ...n.data,
        background: dead(n.data.background) ? source.data.background : n.data.background,
        backgrounds: n.data.backgrounds?.length ? n.data.backgrounds : source.data.backgrounds,
        portraitUrl: freshen(dead(n.data.portraitUrl) ? source.data.portraitUrl : n.data.portraitUrl),
        imageUrl: dead(n.data.imageUrl) ? source.data.imageUrl : n.data.imageUrl,
        grantItem: n.data.grantItem ?? source.data.grantItem,
        sceneObjects: pins.map((o) => ({ ...o, url: freshen(o.url) })),
      },
    };
  });
  const known = new Set(nodes.map((n) => n.id));
  const extra = bundled.nodes.filter((n) => !known.has(n.id));
  const edgeIds = new Set(stored.edges.map((e) => e.id));
  const extraEdges = bundled.edges.filter(
    (e) => !edgeIds.has(e.id) && (extra.some((n) => n.id === e.from || n.id === e.to) || (known.has(e.from) && known.has(e.to) && !stored.edges.some((s) => s.from === e.from && s.to === e.to && s.fromPort === e.fromPort))),
  );
  return {
    ...stored,
    nodes: [...nodes, ...extra],
    edges: [...stored.edges, ...extraEdges],
    manifest: {
      ...stored.manifest,
      coverImage: dead(stored.manifest.coverImage)
        ? bundled.manifest.coverImage
        : stored.manifest.coverImage,
    },
  };
}

export function restoreBundledArt(doc: ScenarioDocument): ScenarioDocument {
  const bundled = getBundledScenario(doc.manifest.id);
  return bundled ? withBundledArt(doc, bundled) : doc;
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