import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AssetPanel } from "@/components/AssetPanel";
import { NodeCanvas } from "@/components/NodeCanvas";
import { SceneStage } from "@/components/SceneStage";
import {
  exportScenarioJson,
  getStoredScenario,
  saveScenario,
} from "@/lib/scenario/store";
import type { ScenarioDocument } from "@/lib/scenario/types";

type Tab = "graph" | "scene" | "assets";

export function StudioPage() {
  const { projectId = "" } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<ScenarioDocument | null>(null);
  const [tab, setTab] = useState<Tab>("graph");
  const [sceneLocId, setSceneLocId] = useState<string | null>(null);

  useEffect(() => {
    const s = getStoredScenario(projectId);
    setDoc(s);
    const firstLoc = s?.nodes.find((n) => n.kind === "location");
    if (firstLoc) setSceneLocId(firstLoc.id);
  }, [projectId]);

  const onChange = useCallback((d: ScenarioDocument) => {
    setDoc(d);
    saveScenario(d);
  }, []);

  if (!doc) {
    return (
      <main style={{ padding: 40 }}>
        <p className="muted">Сценарий не найден в localStorage.</p>
        <Link to="/">← К списку</Link>
        <p className="faint" style={{ marginTop: 12, fontSize: 13 }}>
          На хабе: «Червуд в мастерской» или «Новый сценарий».
        </p>
      </main>
    );
  }

  const locations = doc.nodes.filter((n) => n.kind === "location");
  const sceneLoc =
    locations.find((n) => n.id === sceneLocId) ?? locations[0] ?? null;

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <Link to="/" className="faint" style={{ fontSize: 12 }}>
          ← Сценарии
        </Link>
        <input
          value={doc.manifest.title}
          onChange={(e) =>
            onChange({
              ...doc,
              manifest: { ...doc.manifest, title: e.target.value },
            })
          }
          style={{
            flex: 1,
            minWidth: 140,
            background: "transparent",
            border: "none",
            color: "var(--paper)",
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: 22,
          }}
        />
        {(["graph", "scene", "assets"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className="btn"
            style={{
              height: 32,
              fontSize: 12,
              borderColor: tab === t ? "var(--paper)" : undefined,
            }}
            onClick={() => setTab(t)}
          >
            {t === "graph" ? "Граф" : t === "scene" ? "Сцена" : "Ассеты"}
          </button>
        ))}
        <button
          type="button"
          className="btn"
          onClick={() => {
            const blob = new Blob([exportScenarioJson(doc)], {
              type: "application/json",
            });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${doc.manifest.id}.json`;
            a.click();
          }}
        >
          Export
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            saveScenario(doc);
            sessionStorage.setItem("story-tables.project", doc.manifest.id);
            navigate(`/project/${doc.manifest.id}`);
          }}
        >
          К столу
        </button>
      </header>

      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        {tab === "graph" ? (
          <div style={{ flex: 1, minHeight: 0 }}>
            <NodeCanvas doc={doc} onChange={onChange} />
          </div>
        ) : null}

        {tab === "scene" ? (
          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
            <aside
              style={{
                width: 180,
                borderRight: "1px solid var(--line)",
                padding: 10,
                overflow: "auto",
              }}
            >
              <p className="brass" style={{ fontSize: 11, textTransform: "uppercase" }}>
                Локации
              </p>
              {locations.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className="btn"
                  style={{
                    width: "100%",
                    marginTop: 6,
                    height: "auto",
                    padding: 8,
                    fontSize: 12,
                    borderColor: sceneLoc?.id === l.id ? "var(--brass)" : undefined,
                  }}
                  onClick={() => setSceneLocId(l.id)}
                >
                  {l.data.title}
                </button>
              ))}
            </aside>
            <div style={{ flex: 1, padding: 12, minHeight: 0 }}>
              {sceneLoc ? (
                <SceneStage
                  location={sceneLoc}
                  onChange={(objects, background) => {
                    onChange({
                      ...doc,
                      nodes: doc.nodes.map((n) =>
                        n.id === sceneLoc.id
                          ? {
                              ...n,
                              data: {
                                ...n.data,
                                sceneObjects: objects,
                                background:
                                  background !== undefined
                                    ? background
                                    : n.data.background,
                              },
                            }
                          : n,
                      ),
                    });
                  }}
                />
              ) : (
                <p className="muted">Нет локаций — добавьте на вкладке Граф.</p>
              )}
            </div>
            <aside
              style={{
                width: 220,
                borderLeft: "1px solid var(--line)",
                padding: 10,
                overflow: "auto",
              }}
            >
              <AssetPanel
                onPick={(meta, resolvedUrl) => {
                  if (!sceneLoc) return;
                  if (meta.kind === "image") {
                    onChange({
                      ...doc,
                      nodes: doc.nodes.map((n) =>
                        n.id === sceneLoc.id
                          ? {
                              ...n,
                              data: {
                                ...n.data,
                                background: resolvedUrl,
                                backgroundAssetId: meta.id,
                              },
                            }
                          : n,
                      ),
                    });
                  }
                }}
              />
              <p className="faint" style={{ fontSize: 11, marginTop: 8 }}>
                Клик по картинке → фон выбранной локации
              </p>
            </aside>
          </div>
        ) : null}

        {tab === "assets" ? (
          <div style={{ flex: 1, maxWidth: 360, margin: "0 auto", padding: 16 }}>
            <AssetPanel />
            <p className="muted" style={{ fontSize: 13, marginTop: 16 }}>
              Ассеты хранятся в браузере (IndexedDB + localStorage). Их можно
              назначать фонам, NPC и объектам сцены. Позже — экспорт вместе со
              сценарием.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
