import { useState } from "react";
import { getLoreBase, listLoreBases } from "@/lib/lore/registry";
import type { ScenarioDocument } from "@/lib/scenario/types";

export function LoreDrawer({
  doc,
  onChange,
  open,
  onClose,
}: {
  doc: ScenarioDocument;
  onChange: (d: ScenarioDocument) => void;
  open: boolean;
  onClose: () => void;
}) {
  const bases = listLoreBases();
  const active = getLoreBase(doc.loreBaseId);
  const [pathId, setPathId] = useState<string | null>(null);
  const path = active?.pathways.find((p) => p.id === pathId) ?? null;

  if (!open) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 320,
        zIndex: 30,
        background: "#0f0e0c",
        borderRight: "1px solid var(--line)",
        display: "flex",
        flexDirection: "column",
        boxShadow: "8px 0 24px rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 12px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <span className="brass" style={{ flex: 1, fontSize: 12, letterSpacing: "0.14em" }}>
          БАЗЫ ЛОРА
        </span>
        <button type="button" className="btn" style={{ height: 28 }} onClick={onClose}>
          ✕
        </button>
      </div>

      <div style={{ padding: 12, borderBottom: "1px solid var(--line)" }}>
        {bases.map((b) => (
          <button
            key={b.id}
            type="button"
            className="btn"
            style={{
              width: "100%",
              marginBottom: 6,
              borderColor: doc.loreBaseId === b.id ? "var(--brass)" : undefined,
            }}
            onClick={() => onChange({ ...doc, loreBaseId: b.id })}
          >
            {b.title} · v{b.version}
            {doc.loreBaseId === b.id ? " ✓" : ""}
          </button>
        ))}
        {doc.loreBaseId ? (
          <button
            type="button"
            className="btn"
            style={{ width: "100%", fontSize: 11 }}
            onClick={() => onChange({ ...doc, loreBaseId: undefined })}
          >
            Отключить базу
          </button>
        ) : null}
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
        {!active ? (
          <p className="muted" style={{ fontSize: 13 }}>
            Выберите базу, чтобы открыть справочник путей и способностей.
          </p>
        ) : !path ? (
          <>
            <p className="brass" style={{ fontSize: 11, textTransform: "uppercase" }}>
              Пути · {active.title}
            </p>
            {active.pathways.map((p) => (
              <button
                key={p.id}
                type="button"
                className="btn"
                style={{
                  width: "100%",
                  marginTop: 6,
                  height: "auto",
                  padding: 8,
                  textAlign: "left",
                  fontSize: 12,
                }}
                onClick={() => setPathId(p.id)}
              >
                <div style={{ color: "var(--paper)" }}>{p.nameRu}</div>
                <div className="faint" style={{ fontSize: 10 }}>
                  {p.group}
                </div>
              </button>
            ))}
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn"
              style={{ height: 28, fontSize: 11, marginBottom: 8 }}
              onClick={() => setPathId(null)}
            >
              ← Пути
            </button>
            <h3 style={{ color: "var(--paper)", margin: "0 0 8px" }}>{path.nameRu}</h3>
            {path.sequences.map((s) => (
              <div key={s.rank} className="card" style={{ marginBottom: 8, padding: 10 }}>
                <div className="brass" style={{ fontSize: 11 }}>
                  C{s.rank} · {s.nameRu}
                </div>
                <p className="muted" style={{ fontSize: 12, margin: "4px 0" }}>
                  {s.actingPrincipleRu}
                </p>
                {s.abilities.map((a) => (
                  <div key={a.id} style={{ marginTop: 6 }}>
                    <div style={{ color: "var(--paper)", fontSize: 13 }}>{a.nameRu}</div>
                    <div className="faint" style={{ fontSize: 11 }}>
                      {a.descriptionRu}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
