import type { EngineState } from "./turn-engine";

export type TablePersist = {
  version: 1;
  projectId: string;
  hostClientId: string;
  hostPeerId?: string;
  engine: EngineState;
};

function key(code: string) {
  return `story-tables.table.v1.${code.toUpperCase()}`;
}

export function loadTable(code: string): TablePersist | null {
  try {
    const raw = localStorage.getItem(key(code));
    if (!raw) return null;
    const data = JSON.parse(raw) as TablePersist;
    if (data?.version !== 1 || !data.engine || !data.projectId) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveTable(code: string, data: TablePersist) {
  localStorage.setItem(key(code), JSON.stringify(data));
}

export function clearTable(code: string) {
  localStorage.removeItem(key(code));
}
