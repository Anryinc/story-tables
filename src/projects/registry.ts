import { cherwoodGraph } from "./cherwood/graph";
import { cherwoodManifest } from "./cherwood/manifest";
import type { GraphDocument } from "@/lib/graph/types";

export type Project = {
  manifest: typeof cherwoodManifest;
  graph: GraphDocument;
};

const PROJECTS: Project[] = [
  { manifest: cherwoodManifest, graph: cherwoodGraph },
];

export function listProjects() {
  return PROJECTS.map((p) => p.manifest);
}

export function getProject(id: string): Project | null {
  return PROJECTS.find((p) => p.manifest.id === id) ?? null;
}
