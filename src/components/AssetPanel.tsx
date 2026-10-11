import { useEffect, useState, type CSSProperties } from "react";
import {
  addAssetFromFile,
  addAssetFromUrl,
  deleteAsset,
  listAssets,
  resolveAssetUrl,
  type AssetMeta,
} from "@/lib/assets/store";

export function AssetPanel({
  onPick,
}: {
  onPick?: (meta: AssetMeta, resolvedUrl: string) => void;
}) {
  const [list, setList] = useState<AssetMeta[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");

  const refresh = async () => {
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
      <p className="brass" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>
        Библиотека ассетов
      </p>
      <label className="btn" style={{ cursor: "pointer", textAlign: "center" }}>
        Загрузить с диска
        <input
          type="file"
          accept="image/*,audio/*"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            await addAssetFromFile(f);
            await refresh();
          }}
        />
      </label>
      <input
        placeholder="Имя"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={inputStyle}
      />
      <input
        placeholder="https://… картинка или звук"
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
        Добавить по ссылке
      </button>
      <div style={{ overflow: "auto", flex: 1, display: "grid", gap: 8 }}>
        {list.length === 0 ? (
          <p className="muted" style={{ fontSize: 12 }}>
            Пока пусто. Загрузите фон, портрет NPC или звук.
          </p>
        ) : (
          list.map((m) => (
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
                    height: 72,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              ) : (
                <div className="faint" style={{ fontSize: 11 }}>
                  {m.kind} · {m.mime || "url"}
                </div>
              )}
              <div style={{ fontSize: 12, color: "var(--paper)", marginTop: 4 }}>
                {m.name}
              </div>
              <button
                type="button"
                className="btn"
                style={{ height: 28, fontSize: 11, marginTop: 4 }}
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
