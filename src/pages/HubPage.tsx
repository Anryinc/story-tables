import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { emptyScenario, type ScenarioDocument } from "@/lib/scenario/types";
import {
  deleteScenario,
  hideScenario,
  hiddenScenarioIds,
  listStoredScenarios,
  saveScenario,
} from "@/lib/scenario/store";
import { seedScenarioToStudio } from "@/lib/scenario/seed";
import { getBundledScenario, listBundledScenarios } from "@/projects/bundled";

type ShelfCard = { doc: ScenarioDocument; fromCode: boolean };

function cloneScenario(source: ScenarioDocument, title: string): ScenarioDocument {
  const id = `sc_${Math.random().toString(36).slice(2, 9)}`;
  const copy = structuredClone(source);
  copy.manifest = {
    ...copy.manifest,
    id,
    title: title.trim() || `${source.manifest.title} (копия)`,
    status: "draft",
    updatedAt: new Date().toISOString(),
  };
  return copy;
}

export function HubPage() {
  const [tick, setTick] = useState(0);
  const [editing, setEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [naming, setNaming] = useState<"new" | "copy" | null>(null);
  const [copyFrom, setCopyFrom] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);

  const stored = useMemo(() => listStoredScenarios(), [tick]);
  const hidden = useMemo(() => new Set(hiddenScenarioIds()), [tick]);
  const cards: ShelfCard[] = useMemo(() => {
    const own = stored
      .filter((doc) => !hidden.has(doc.manifest.id))
      .map((doc) => ({ doc, fromCode: false }));
    const known = new Set(own.map((c) => c.doc.manifest.id));
    const baked = listBundledScenarios()
      .filter((doc) => !known.has(doc.manifest.id) && !hidden.has(doc.manifest.id))
      .map((doc) => ({ doc, fromCode: true }));
    return [...own, ...baked];
  }, [stored, hidden]);

  const current = cards.find((c) => c.doc.manifest.id === currentId) ?? null;

  const refresh = () => setTick((t) => t + 1);

  const closeCreate = () => {
    setCreateOpen(false);
    setNaming(null);
    setCopyFrom(null);
    setTitleDraft("");
  };

  const placeNamed = () => {
    const title = titleDraft.trim();
    if (!title) return;
    if (naming === "new") {
      const doc = emptyScenario(title);
      saveScenario(doc);
      setCurrentId(doc.manifest.id);
    } else if (naming === "copy" && copyFrom) {
      const source =
        stored.find((s) => s.manifest.id === copyFrom) ?? getBundledScenario(copyFrom);
      if (!source) return;
      const doc = cloneScenario(source, title);
      saveScenario(doc);
      setCurrentId(doc.manifest.id);
    }
    refresh();
    closeCreate();
  };

  const askCopy = () => {
    setNaming("copy");
    setCopyFrom(current?.doc.manifest.id ?? null);
    setTitleDraft(current ? `${current.doc.manifest.title} (копия)` : "");
  };

  const removeCard = (id: string) => {
    deleteScenario(id);
    hideScenario(id);
    if (currentId === id) setCurrentId(null);
    setPendingDelete(null);
    refresh();
  };

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px" }}>
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <p
            className="brass"
            style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase" }}
          >
            Мастерская столов
          </p>
          <h1 className="font-display" style={{ fontSize: 40, color: "var(--paper)", margin: "8px 0" }}>
            Сценарии
          </h1>
          <p className="muted" style={{ maxWidth: 520, fontSize: 14 }}>
            Выберите сценарий и нажмите «Играть». Чтобы править полку, включите «Редактировать».
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, position: "relative" }}>
          <button
            type="button"
            className="btn btn-primary"
            aria-expanded={createOpen}
            onClick={() => {
              setCreateOpen((v) => !v);
              setNaming(null);
              setCopyFrom(null);
              setTitleDraft("");
            }}
          >
            Создать
          </button>
          <button
            type="button"
            className="btn"
            aria-pressed={editing}
            onClick={() => setEditing((v) => !v)}
            style={
              editing
                ? { borderColor: "var(--brass)", color: "var(--brass)" }
                : undefined
            }
          >
            Редактировать
          </button>
          {createOpen ? (
            <div
              className="card"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                zIndex: 5,
                width: 280,
                padding: 12,
                display: "grid",
                gap: 8,
              }}
            >
              {naming == null ? (
                <>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setNaming("new");
                      setTitleDraft("");
                    }}
                  >
                    Создать новый сценарий
                  </button>
                  <button type="button" className="btn" onClick={askCopy}>
                    Копировать текущий сценарий
                  </button>
                </>
              ) : (
                <>
                  <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                    {naming === "new" ? "Как назвать новый сценарий?" : "Как назвать копию?"}
                  </p>
                  {naming === "copy" && !current && cards.length > 0 ? (
                    <div style={{ display: "grid", gap: 6 }}>
                      {cards.map((c) => (
                        <button
                          key={c.doc.manifest.id}
                          type="button"
                          className="btn"
                          style={
                            copyFrom === c.doc.manifest.id
                              ? { borderColor: "var(--brass)", color: "var(--brass)" }
                              : undefined
                          }
                          onClick={() => {
                            setCopyFrom(c.doc.manifest.id);
                            setTitleDraft(`${c.doc.manifest.title} (копия)`);
                          }}
                        >
                          {c.doc.manifest.title}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {naming === "copy" && cards.length === 0 ? (
                    <p className="faint" style={{ margin: 0, fontSize: 12 }}>
                      Копировать пока нечего.
                    </p>
                  ) : (
                    <input
                      value={titleDraft}
                      autoFocus
                      placeholder="Название"
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") placeNamed();
                      }}
                      style={{
                        height: 36,
                        borderRadius: 8,
                        border: "1px solid var(--line)",
                        background: "transparent",
                        color: "var(--paper)",
                        padding: "0 10px",
                      }}
                    />
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="btn btn-primary" onClick={placeNamed} disabled={!titleDraft.trim() || (naming === "copy" && !copyFrom)}>
                      Разместить
                    </button>
                    <button type="button" className="btn" onClick={closeCreate}>
                      Отмена
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>
      </header>

      {cards.length === 0 ? (
        <p className="muted" style={{ marginTop: 28 }}>
          Пока пусто. «Создать» — новый сценарий или копия.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
            marginTop: 28,
          }}
        >
          {cards.map(({ doc, fromCode }) => {
            const selected = currentId === doc.manifest.id;
            return (
              <article
                key={doc.manifest.id}
                className="card"
                onClick={() => setCurrentId(doc.manifest.id)}
                style={{
                  overflow: "hidden",
                  padding: 0,
                  cursor: "pointer",
                  outline: selected ? "1px solid var(--brass)" : "none",
                }}
              >
                <div style={{ position: "relative", aspectRatio: "16/10", background: "#1a1814" }}>
                  {doc.manifest.coverImage ? (
                    <img
                      src={doc.manifest.coverImage}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : null}
                  {editing ? (
                    <>
                      <Link
                        to={`/studio/${doc.manifest.id}`}
                        aria-label={`Править ${doc.manifest.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (fromCode) seedScenarioToStudio(doc, false);
                        }}
                        style={iconBtn("left")}
                      >
                        <PencilIcon />
                      </Link>
                      <button
                        type="button"
                        aria-label={`Удалить ${doc.manifest.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDelete({ id: doc.manifest.id, title: doc.manifest.title });
                        }}
                        style={{ ...iconBtn("right"), color: "#fff", background: "var(--danger)" }}
                      >
                        <CrossIcon />
                      </button>
                    </>
                  ) : null}
                </div>
                <div style={{ padding: 14 }}>
                  {doc.manifest.subtitle ? (
                    <p className="brass" style={{ fontSize: 10, margin: 0 }}>
                      {doc.manifest.subtitle}
                    </p>
                  ) : null}
                  <h3 className="font-display" style={{ margin: "4px 0", fontSize: 22, color: "var(--paper)" }}>
                    {doc.manifest.title}
                  </h3>
                  <p className="muted" style={{ fontSize: 13 }}>
                    {doc.manifest.blurb}
                  </p>
                  <Link
                    className="btn btn-primary"
                    to={`/project/${doc.manifest.id}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{ marginTop: 12 }}
                  >
                    Играть
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pendingDelete ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(8,7,6,0.72)",
            display: "grid",
            placeItems: "center",
            padding: 20,
            zIndex: 20,
          }}
        >
          <div className="card" style={{ maxWidth: 380, display: "grid", gap: 12 }}>
            <p style={{ margin: 0, color: "var(--paper)" }}>
              Точно удалить «{pendingDelete.title}»?
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn"
                style={{ background: "var(--danger)", color: "#fff", borderColor: "transparent" }}
                onClick={() => removeCard(pendingDelete.id)}
              >
                Удалить
              </button>
              <button type="button" className="btn" onClick={() => setPendingDelete(null)}>
                Оставить
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function iconBtn(side: "left" | "right"): CSSProperties {
  return {
    position: "absolute",
    top: 8,
    [side]: 8,
    width: 32,
    height: 32,
    borderRadius: 8,
    display: "grid",
    placeItems: "center",
    background: "rgba(12,11,10,0.82)",
    color: "var(--paper)",
    border: "1px solid var(--line)",
  };
}

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M11.2 1.4a1.5 1.5 0 0 1 2.1 0l1.3 1.3a1.5 1.5 0 0 1 0 2.1l-7.6 7.6-3.4.7.7-3.4 7-8.3Zm.7 1.4-6.6 7.2-.3 1.6 1.6-.3 7.2-7.2-1.9-1.3Z"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3.2 3.2a1 1 0 0 1 1.4 0L8 6.6l3.4-3.4a1 1 0 1 1 1.4 1.4L9.4 8l3.4 3.4a1 1 0 0 1-1.4 1.4L8 9.4l-3.4 3.4a1 1 0 0 1-1.4-1.4L6.6 8 3.2 4.6a1 1 0 0 1 0-1.4Z"
      />
    </svg>
  );
}
