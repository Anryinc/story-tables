import { useState, type CSSProperties } from "react";
import { addAssetFromFile, resolveAssetUrl } from "@/lib/assets/store";
import type { ScenarioDocument } from "@/lib/scenario/types";

export function PreviewPanel({
  doc,
  onChange,
}: {
  doc: ScenarioDocument;
  onChange: (d: ScenarioDocument) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const m = doc.manifest;

  const patchManifest = (patch: Partial<typeof m>) => {
    onChange({
      ...doc,
      manifest: {
        ...m,
        ...patch,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const onCoverFile = async (file: File | undefined) => {
    if (!file?.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const meta = await addAssetFromFile(file, { category: "background", name: `bg_${file.name}` });
      const url = await resolveAssetUrl(meta);
      if (url) patchManifest({ coverImage: url });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        padding: 20,
        display: "grid",
        gap: 24,
        gridTemplateColumns: "minmax(280px, 1fr) minmax(300px, 420px)",
        alignItems: "start",
        maxWidth: 1100,
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Live preview — like project splash */}
      <div>
        <p className="brass" style={{ fontSize: 11, letterSpacing: "0.16em", marginBottom: 10 }}>
          КАК УВИДЯТ НА СТРАНИЦЕ ПРОЕКТА
        </p>
        <div
          style={{
            position: "relative",
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid var(--line)",
            minHeight: 360,
            background: "#0c0b0a",
          }}
        >
          {m.coverImage ? (
            <img
              src={m.coverImage}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.4,
              }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                color: "#5a564c",
                fontSize: 13,
              }}
            >
              Нет обложки
            </div>
          )}
          <div
            style={{
              position: "relative",
              padding: "48px 24px 28px",
              minHeight: 360,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              background:
                "linear-gradient(to top, rgba(12,11,10,0.95) 30%, transparent)",
            }}
          >
            {m.subtitle ? (
              <p className="brass" style={{ fontSize: 11, letterSpacing: "0.14em", margin: 0 }}>
                {m.subtitle}
              </p>
            ) : null}
            <h1
              className="font-display"
              style={{ margin: "6px 0", fontSize: 36, color: "var(--paper)" }}
            >
              {m.title || "Без названия"}
            </h1>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 420 }}>
              {m.blurb || "Описание сценария появится здесь."}
            </p>
            <div
              className="btn btn-primary"
              style={{
                marginTop: 16,
                width: "100%",
                maxWidth: 280,
                pointerEvents: "none",
                textAlign: "center",
              }}
            >
              Открыть стол на этом ПК
            </div>
          </div>
        </div>
      </div>

      {/* Editors */}
      <div style={{ display: "grid", gap: 14 }}>
        <h2 className="font-display" style={{ margin: 0, color: "var(--paper)", fontSize: 28 }}>
          Превью сценария
        </h2>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          Обложка и текст попадают на хаб и страницу «Играть». Сохраняется в
          manifest сценария.
        </p>

        <label className="muted" style={{ fontSize: 12 }}>
          Название
          <input
            value={m.title}
            onChange={(e) => patchManifest({ title: e.target.value })}
            style={field}
          />
        </label>

        <label className="muted" style={{ fontSize: 12 }}>
          Подзаголовок
          <input
            value={m.subtitle ?? ""}
            onChange={(e) =>
              patchManifest({ subtitle: e.target.value || undefined })
            }
            placeholder="Акт I · …"
            style={field}
          />
        </label>

        <label className="muted" style={{ fontSize: 12 }}>
          Описание
          <textarea
            value={m.blurb}
            onChange={(e) => patchManifest({ blurb: e.target.value })}
            rows={5}
            placeholder="О чём дело, тон, сеттинг…"
            style={{ ...field, lineHeight: 1.45 }}
          />
        </label>

        <div style={{ display: "grid", gap: 8 }}>
          <span className="muted" style={{ fontSize: 12 }}>
            Обложка / фон превью
          </span>
          <input
            value={m.coverImage ?? ""}
            onChange={(e) =>
              patchManifest({ coverImage: e.target.value || undefined })
            }
            placeholder="https://… или загрузите файл"
            style={field}
          />
          <label
            className="btn"
            style={{ textAlign: "center", cursor: "pointer", height: 34, fontSize: 12 }}
          >
            {uploading ? "Загрузка…" : "Загрузить изображение"}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                void onCoverFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {m.coverImage ? (
            <button
              type="button"
              className="btn"
              style={{ fontSize: 12, color: "var(--danger)" }}
              onClick={() => patchManifest({ coverImage: undefined })}
            >
              Убрать обложку
            </button>
          ) : null}
        </div>

        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
          <label className="muted" style={{ fontSize: 12 }}>
            Игроков мин.
            <input
              type="number"
              min={1}
              max={12}
              value={m.playersMin}
              onChange={(e) =>
                patchManifest({ playersMin: Number(e.target.value) || 1 })
              }
              style={field}
            />
          </label>
          <label className="muted" style={{ fontSize: 12 }}>
            Игроков макс.
            <input
              type="number"
              min={1}
              max={12}
              value={m.playersMax}
              onChange={(e) =>
                patchManifest({ playersMax: Number(e.target.value) || 4 })
              }
              style={field}
            />
          </label>
        </div>

        <label className="muted" style={{ fontSize: 12 }}>
          Статус
          <select
            value={m.status}
            onChange={(e) =>
              patchManifest({
                status: e.target.value as "draft" | "playable",
              })
            }
            style={field}
          >
            <option value="draft">Черновик</option>
            <option value="playable">Играбелен</option>
          </select>
        </label>
      </div>
    </div>
  );
}

const field: CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  background: "#0c0b0a",
  border: "1px solid var(--line)",
  borderRadius: 8,
  padding: 8,
  color: "var(--paper)",
  font: "inherit",
  fontSize: 13,
};
