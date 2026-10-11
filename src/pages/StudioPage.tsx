import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { NodeCanvas } from "@/components/NodeCanvas";
import {
  exportScenarioJson,
  getStoredScenario,
  saveScenario,
} from "@/lib/scenario/store";
import type { ScenarioDocument } from "@/lib/scenario/types";

export function StudioPage() {
  const { projectId = "" } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<ScenarioDocument | null>(null);

  useEffect(() => {
    const s = getStoredScenario(projectId);
    if (!s) {
      setDoc(null);
      return;
    }
    setDoc(s);
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
          Встроенный Cherwood пока редактируется только кодом. Создайте «Новый
          сценарий» на хабе.
        </p>
      </main>
    );
  }

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 12,
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
            minWidth: 160,
            background: "transparent",
            border: "none",
            color: "var(--paper)",
            fontFamily: "\"Cormorant Garamond\", serif",
            fontSize: 22,
          }}
        />
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
          Export JSON
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
          К запуску стола
        </button>
      </header>
      <div style={{ flex: 1, minHeight: 0 }}>
        <NodeCanvas doc={doc} onChange={onChange} />
      </div>
    </div>
  );
}
