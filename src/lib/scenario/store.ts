import type { ScenarioDocument } from "./types";

const KEY = "story-tables.scenarios.v1";

function readAll(): Record<string, ScenarioDocument> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ScenarioDocument>;
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, ScenarioDocument>) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function listStoredScenarios(): ScenarioDocument[] {
  return Object.values(readAll()).sort(
    (a, b) =>
      (b.manifest.updatedAt || "").localeCompare(a.manifest.updatedAt || ""),
  );
}

export function getStoredScenario(id: string): ScenarioDocument | null {
  return readAll()[id] ?? null;
}

export function saveScenario(doc: ScenarioDocument) {
  const map = readAll();
  doc.manifest.updatedAt = new Date().toISOString();
  map[doc.manifest.id] = doc;
  writeAll(map);
}

export function deleteScenario(id: string) {
  const map = readAll();
  delete map[id];
  writeAll(map);
}

export function exportScenarioJson(doc: ScenarioDocument): string {
  return JSON.stringify(doc, null, 2);
}

export function importScenarioJson(text: string): ScenarioDocument {
  const doc = JSON.parse(text) as ScenarioDocument;
  if (!doc.manifest?.id || !Array.isArray(doc.nodes)) {
    throw new Error("Неверный файл сценария");
  }
  saveScenario(doc);
  return doc;
}
