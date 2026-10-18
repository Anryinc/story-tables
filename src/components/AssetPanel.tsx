import { useEffect, useState, type CSSProperties } from "react";
import {
  addAssetFromFile,
  addAssetFromUrl,
  deleteAsset,
  ensureBundledAssets,
  listAssets,
  resolveAssetUrl,
  type AssetCategory,
  type AssetMeta,
} from "@/lib/assets/store";
import { BUNDLED_ASSETS } from "@/lib/assets/bundled";

type Category = "all" | "backgrounds" | "npcs" | "clues" | "items" | "audio";

const CATS: { id: Category; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "backgrounds", label: "Фоны" },
  { id: "npcs", label: "NPC" },
  { id: "clues", label: "Улики" },
  { id: "items", label: "Предметы" },
  { id: "audio", label: "Звук" },
];

/** Prefer the stored category; fall back to the name prefix. */
function matchesCat(m: AssetMeta, cat: Category): boolean {
  if (cat === "all") return true;
  if (cat === "audio") return m.kind === "audio" || m.category === "audio";
  const wanted: AssetCategory =
    cat === "backgrounds" ? "background" : cat === "npcs" ? "npc" : cat === "clues" ? "clue" : "item";
  if (m.category) return m.category === wanted;
  const n = m.name.toLowerCase();
  if (wanted === "background") return n.startsWith("bg") || n.includes("фон");
  if (wanted === "npc") return n.startsWith("npc") || n.includes("портрет");
  if (wanted === "clue") return n.startsWith("clue") || n.includes("улик");
  if (wanted === "item") return n.startsWith("item") || n.includes("предмет");
  return false;
}

export function AssetPanel({
  onPick,
  categorized = false,
}: {
  onPick?: (meta: AssetMeta, resolvedUrl: string) => void;
  categorized?: boolean;
}) {
  const [list, setList] = useState<AssetMeta[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [cat, setCat] = useState<Category>("all");

  const refresh = async () => {
    ensureBundledAssets(BUNDLED_ASSETS);
    const items = listAssets();
    setList(items);
    const map: Record<string, string> = {};
    for (const m of items) {
      const u = await resolveAssetUrl(m);
      if (u) map[m.id] = u;
    }
    setPreviews(map);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = list.filter((m) => matchesCat(m, cat));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
      <p
        className="brass"
        style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}
      >
        Библиотека ассетов
      </p>

      {categorized ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {CATS.map((c) => (
            <button
              key={c.id}
              type="button"
              className="btn"
              style={{
                height: 26,
                fontSize: 10,
                padding: "0 8px",
                borderColor: cat === c.id ? "var(--brass)" : undefined,
              }}
              onClick={() => setCat(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      ) : null}

      <label className="btn" style={{ cursor: "pointer", textAlign: "center" }}>
        Загрузить с диска
        <input
          type="file"
          accept="image/*,audio/*"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            await addAssetFromFile(f, { category: cat === "npcs" ? "npc" : cat === "items" ? "item" : cat === "clues" ? "clue" : cat === "audio" ? "audio" : "background" });
            await refresh();
          }}
        />
      </label>
      <input
        placeholder="Имя (bg_… / npc_… / clue_…)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={inputStyle}
      />
      <input
        placeholder="https://…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={inputStyle}
      />
      <button
        type="button"
        className="btn"
        onClick={async () => {
          if (!url.trim()) return;
          await addAssetFromUrl(name.trim() || "url-asset", url.trim());
          setUrl("");
          setName("");
          await refresh();
        }}
      >
        По ссылке
      </button>

      <div style={{ overflow: "auto", flex: 1, display: "grid", gap: 8 }}>
        {filtered.length === 0 ? (
          <p className="muted" style={{ fontSize: 12 }}>
            Пусто в этой категории. Имена с префиксами bg_ / npc_ / clue_ / item_
            помогают сортировке.
          </p>
        ) : (
          filtered.map((m) => (
            <div
              key={m.id}
              className="card"
              style={{ padding: 8, cursor: onPick ? "pointer" : "default" }}
              onClick={async () => {
                if (!onPick) return;
                const u = previews[m.id] || (await resolveAssetUrl(m));
                if (u) onPick(m, u);
              }}
            >
              {m.kind === "image" && previews[m.id] ? (
                <img
                  src={previews[m.id]}
                  alt=""
                  style={{
                    width: "100%",
                    height: 64,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              ) : (
                <div className="faint" style={{ fontSize: 11 }}>
                  {m.kind}
                </div>
              )}
              <div style={{ fontSize: 12, color: "var(--paper)", marginTop: 4 }}>
                {m.name}
              </div>
              <button
                type="button"
                className="btn"
                style={{ height: 26, fontSize: 11, marginTop: 4 }}
                onClick={async (e) => {
                  e.stopPropagation();
                  await deleteAsset(m.id);
                  await refresh();
                }}
              >
                Удалить
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  background: "#0c0b0a",
  border: "1px solid var(--line)",
  borderRadius: 8,
  padding: 8,
  color: "var(--paper)",
  font: "inherit",
  fontSize: 12,
};
