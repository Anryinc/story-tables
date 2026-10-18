/** Project asset library (IndexedDB). Images/audio as blob or external URL. */

export type AssetKind = "image" | "audio" | "other";
export type AssetCategory = "background" | "npc" | "item" | "clue" | "audio" | "other";

export type AssetMeta = {
  id: string;
  name: string;
  kind: AssetKind;
  category?: AssetCategory;
  /** external or app-relative url. Empty when the file is a blob in IndexedDB. */
  url?: string;
  mime?: string;
  size?: number;
  createdAt: string;
  bundled?: boolean;
};

const DB_NAME = "story-tables-assets";
const DB_VER = 1;
const STORE = "files";
const META_KEY = "story-tables.asset-meta.v1";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function readMeta(): AssetMeta[] {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) || "[]") as AssetMeta[];
  } catch {
    return [];
  }
}

function writeMeta(list: AssetMeta[]) {
  localStorage.setItem(META_KEY, JSON.stringify(list));
}

export function listAssets(): AssetMeta[] {
  return readMeta().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addAssetFromUrl(
  name: string,
  url: string,
  kind: AssetKind = "image",
  category?: AssetCategory,
): Promise<AssetMeta> {
  const existing = readMeta().find((a) => a.url === url);
  if (existing) return existing;
  const meta: AssetMeta = {
    id: `a_${Math.random().toString(36).slice(2, 10)}`,
    name,
    kind,
    category,
    url,
    createdAt: new Date().toISOString(),
  };
  writeMeta([meta, ...readMeta()]);
  return meta;
}

export async function addAssetFromFile(
  file: File,
  opts?: { name?: string; category?: AssetCategory },
): Promise<AssetMeta> {
  const kind: AssetKind = file.type.startsWith("audio/")
    ? "audio"
    : file.type.startsWith("image/")
      ? "image"
      : "other";
  const id = `a_${Math.random().toString(36).slice(2, 10)}`;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  const meta: AssetMeta = {
    id,
    name: opts?.name || file.name,
    kind,
    category: opts?.category ?? (kind === "audio" ? "audio" : "other"),
    mime: file.type,
    size: file.size,
    createdAt: new Date().toISOString(),
  };
  writeMeta([meta, ...readMeta()]);
  return meta;
}

/** Resolve displayable URL (object URL for blob assets). Caller should revoke when done if needed. */
export async function resolveAssetUrl(meta: AssetMeta): Promise<string | null> {
  if (meta.url) return meta.url;
  const db = await openDb();
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(meta.id);
    req.onsuccess = () => resolve(req.result as Blob | undefined);
    req.onerror = () => reject(req.error);
  });
  db.close();
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export function findAsset(id: string): AssetMeta | undefined {
  return readMeta().find((a) => a.id === id);
}

/** Register shipped pictures once. Skips anything already stored by id or url. */
export function ensureBundledAssets(
  items: { id: string; name: string; url: string; category: AssetCategory }[],
): void {
  const existing = readMeta();
  const ids = new Set(existing.map((a) => a.id));
  const urls = new Set(existing.map((a) => a.url).filter(Boolean));
  const added: AssetMeta[] = [];
  for (const item of items) {
    if (ids.has(item.id) || urls.has(item.url)) continue;
    added.push({
      id: item.id,
      name: item.name,
      kind: "image",
      category: item.category,
      url: item.url,
      bundled: true,
      createdAt: "2026-10-18T00:00:00.000Z",
    });
  }
  if (added.length) writeMeta([...added, ...existing]);
}

export async function deleteAsset(id: string) {
  writeMeta(readMeta().filter((m) => m.id !== id));
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* */
  }
}
