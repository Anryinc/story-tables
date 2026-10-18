import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AssetPanel } from "@/components/AssetPanel";
import { CharactersPanel } from "@/components/CharactersPanel";
import { FloatingScene } from "@/components/FloatingScene";
import { LoreDrawer } from "@/components/LoreDrawer";
import { NodeCanvas } from "@/components/NodeCanvas";
import { PreviewPanel } from "@/components/PreviewPanel";
import { SceneEditor } from "@/components/SceneEditor";
import { TimelineStrip } from "@/components/TimelineStrip";
import { BUNDLED_ASSETS } from "@/lib/assets/bundled";
import { ensureBundledAssets } from "@/lib/assets/store";
import { restoreBundledArt } from "@/lib/scenario/resolve";
import {
  exportScenarioJson,
  getStoredScenario,
  saveScenario,
} from "@/lib/scenario/store";
import type { ScenarioDocument } from "@/lib/scenario/types";

type Tab = "preview" | "plan" | "scene" | "characters";

const TAB_LABEL: Record<Tab, string> = {
  preview: "Превью",
  plan: "План",
  scene: "Сцена",
  characters: "Персонажи",
};

export function StudioPage() {
  const { projectId = "" } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<ScenarioDocument | null>(null);
  const [tab, setTab] = useState<Tab>("plan");
  const [sceneLocId, setSceneLocId] = useState<string | null>(null);
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [loreOpen, setLoreOpen] = useState(false);
  const [floatSceneLocId, setFloatSceneLocId] = useState<string | null>(null);

  useEffect(() => {
    ensureBundledAssets(BUNDLED_ASSETS);
    const stored = getStoredScenario(projectId);
    const s = stored ? restoreBundledArt(stored) : null;
    setDoc(s);
    if (s && stored && JSON.stringify(s) !== JSON.stringify(stored)) saveScenario(s);
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
              manifest: {
                ...doc.manifest,
                title: e.target.value,
                updatedAt: new Date().toISOString(),
              },
            })
          }
          style={{
            flex: 1,
            minWidth: 100,
            background: "transparent",
            border: "none",
            color: "var(--paper)",
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: 22,
          }}
        />
        {(["preview", "plan", "scene", "characters"] as Tab[]).map((t) => (
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
            {TAB_LABEL[t]}
          </button>
        ))}
        {tab === "plan" ? (
          <button
            type="button"
            className="btn"
            style={{
              height: 32,
              fontSize: 12,
              borderColor: loreOpen ? "var(--brass)" : undefined,
            }}
            title="Базы лора"
            onClick={() => setLoreOpen((v) => !v)}
          >
            ✦ Лор
          </button>
        ) : null}
        <button
          type="button"
          className="btn"
          style={{ height: 32, fontSize: 12 }}
          onClick={() => setAssetsOpen((v) => !v)}
        >
          {assetsOpen ? "◄ Ассеты" : "Ассеты ►"}
        </button>
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
        <div
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {tab === "preview" ? (
            <PreviewPanel doc={doc} onChange={onChange} />
          ) : null}

          {tab === "plan" ? (
            <>
              <TimelineStrip doc={doc} onChange={onChange} />
              <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
                <LoreDrawer
                  doc={doc}
                  onChange={onChange}
                  open={loreOpen}
                  onClose={() => setLoreOpen(false)}
                />
                <NodeCanvas
                  doc={doc}
                  onChange={onChange}
                  hideTimelineNodes
                  onOpenScene={(locNodeId) => setFloatSceneLocId(locNodeId)}
                />
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
              <div style={{ flex: 1, padding: 12, minHeight: 0, minWidth: 0 }}>
                {sceneLoc ? (
                  <SceneEditor
                    doc={doc}
                    locationId={sceneLoc.id}
                    onChange={onChange}
                  />
                ) : (
                  <p className="muted">Нет локаций</p>
                )}
              </div>
            </div>
          ) : null}

          {tab === "characters" ? (
            <CharactersPanel doc={doc} onChange={onChange} />
          ) : null}
        </div>

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
            <AssetPanel categorized />
          </div>
        </aside>

        {floatSceneLocId ? (
          <FloatingScene
            doc={doc}
            onChange={onChange}
            initialLocId={floatSceneLocId}
            onClose={() => setFloatSceneLocId(null)}
          />
        ) : null}
      </div>
    </div>
  );
}
