import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AssetPanel } from "@/components/AssetPanel";
import { FloatingScene } from "@/components/FloatingScene";
import { NodeCanvas } from "@/components/NodeCanvas";
import { SceneStage } from "@/components/SceneStage";
import { TimelineStrip } from "@/components/TimelineStrip";
import {
  exportScenarioJson,
  getStoredScenario,
  saveScenario,
} from "@/lib/scenario/store";
import type { ScenarioDocument } from "@/lib/scenario/types";

type Tab = "plan" | "scene";

export function StudioPage() {
  const { projectId = "" } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<ScenarioDocument | null>(null);
  const [tab, setTab] = useState<Tab>("plan");
  const [sceneLocId, setSceneLocId] = useState<string | null>(null);
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [floatScene, setFloatScene] = useState(false);

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
        <p className="muted">Сценарий не найден.</p>
        <Link to="/">← К списку</Link>
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
        {(["plan", "scene"] as Tab[]).map((t) => (
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
            {t === "plan" ? "План" : "Сцена"}
          </button>
        ))}
        <button
          type="button"
          className="btn"
          style={{ height: 32, fontSize: 12 }}
          onClick={() => setAssetsOpen((v) => !v)}
        >
          {assetsOpen ? "◄ Ассеты" : "Ассеты ►"}
        </button>
        {tab === "plan" ? (
          <button
            type="button"
            className="btn"
            style={{ height: 32, fontSize: 12 }}
            onClick={() => setFloatScene((v) => !v)}
          >
            {floatScene ? "Закрыть превью" : "Превью сцены"}
          </button>
        ) : null}
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

      <div style={{ flex: 1, minHeight: 0, display: "flex", position: "relative" }}>
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {tab === "plan" ? (
            <>
              <TimelineStrip doc={doc} onChange={onChange} />
              <div style={{ flex: 1, minHeight: 0 }}>
                <NodeCanvas doc={doc} onChange={onChange} hideTimelineNodes />
              </div>
            </>
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
                      borderColor:
                        sceneLoc?.id === l.id ? "var(--brass)" : undefined,
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
                  <p className="muted">Нет локаций</p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Slide-out asset library */}
        <aside
          style={{
            width: assetsOpen ? 280 : 0,
            transition: "width 0.2s ease",
            overflow: "hidden",
            borderLeft: assetsOpen ? "1px solid var(--line)" : "none",
            background: "#0f0e0c",
          }}
        >
          <div style={{ width: 280, height: "100%", padding: 12, overflow: "auto" }}>
            <AssetPanel
              categorized
              onPick={(meta, resolvedUrl) => {
                if (tab === "scene" && sceneLoc && meta.kind === "image") {
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
          </div>
        </aside>

        {tab === "plan" && floatScene ? (
          <FloatingScene
            doc={doc}
            onChange={onChange}
            onClose={() => setFloatScene(false)}
          />
        ) : null}
      </div>
    </div>
  );
}
