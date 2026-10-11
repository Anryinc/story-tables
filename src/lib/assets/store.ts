/** Project asset library (IndexedDB). Images/audio as blob or external URL. */

export type AssetKind = "image" | "audio" | "other";

export type AssetMeta = {
  id: string;
  name: string;
  kind: AssetKind;
  /** external https url OR empty if blob stored */
  url?: string;
  mime?: string;
  size?: number;
  createdAt: string;
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
): Promise<AssetMeta> {
  const meta: AssetMeta = {
    id: `a_${Math.random().toString(36).slice(2, 10)}`,
    name,
    kind,
    url,
    createdAt: new Date().toISOString(),
  };
  writeMeta([meta, ...readMeta()]);
  return meta;
}

export async function addAssetFromFile(file: File): Promise<AssetMeta> {
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
    name: file.name,
    kind,
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
