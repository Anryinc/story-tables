import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { emptyScenario } from "@/lib/scenario/types";
import {
  deleteScenario,
  importScenarioJson,
  listStoredScenarios,
  saveScenario,
} from "@/lib/scenario/store";
import { seedScenarioToStudio } from "@/lib/scenario/seed";
import { getBundledScenario, listBundledScenarios } from "@/projects/bundled";

const STAMP = "preview-tab-v0.8";

export function HubPage() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const stored = useMemo(() => listStoredScenarios(), [tick]);
  const bundled = listBundledScenarios();

  const createNew = () => {
    const doc = emptyScenario("Новый сценарий");
    saveScenario(doc);
    navigate(`/studio/${doc.manifest.id}`);
  };

  const openBundledStudio = (id: string, force: boolean, go = true) => {
    const doc = getBundledScenario(id);
    if (!doc) return;
    seedScenarioToStudio(doc, force);
    setTick((t) => t + 1);
    if (go) navigate(`/studio/${id}`);
  };

  const onImport = async (file: File) => {
    const text = await file.text();
    const doc = importScenarioJson(text);
    setTick((t) => t + 1);
    navigate(`/studio/${doc.manifest.id}`);
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
          <h1
            className="font-display"
            style={{ fontSize: 40, color: "var(--paper)", margin: "8px 0" }}
          >
            Сценарии
          </h1>
          <p className="muted" style={{ maxWidth: 520, fontSize: 14 }}>
            Обложка и описание задаются во вкладке «Превью» мастерской.
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button type="button" className="btn btn-primary" onClick={createNew}>
            + Новый сценарий
          </button>
          <button type="button" className="btn" onClick={() => openBundledStudio("cherwood", false)}>
            Червуд в мастерской
          </button>
          <button
            type="button"
            className="btn"
            title="Перезаписать localStorage каноном из кода"
            onClick={() => openBundledStudio("cherwood", true)}
          >
            Сбросить Червуд
          </button>
          <label className="btn" style={{ cursor: "pointer" }}>
            Import JSON
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onImport(f);
              }}
            />
          </label>
        </div>
      </header>

      <h2
        className="brass"
        style={{
          fontSize: 11,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginTop: 36,
        }}
      >
        Ваши сценарии
      </h2>
      {stored.length === 0 ? (
        <p className="muted" style={{ marginTop: 12 }}>
          Пока пусто — «Червуд в мастерской» или новый сценарий.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
            marginTop: 12,
          }}
        >
          {stored.map((s) => (
            <article
              key={s.manifest.id}
              className="card"
              style={{ overflow: "hidden", padding: 0 }}
            >
              <div style={{ aspectRatio: "16/10", background: "#1a1814" }}>
                {s.manifest.coverImage ? (
                  <img
                    src={s.manifest.coverImage}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : null}
              </div>
              <div style={{ padding: 14 }}>
                {s.manifest.subtitle ? (
                  <p className="brass" style={{ fontSize: 10, margin: 0 }}>
                    {s.manifest.subtitle}
                  </p>
                ) : null}
                <h3
                  className="font-display"
                  style={{ margin: "4px 0", fontSize: 22, color: "var(--paper)" }}
                >
                  {s.manifest.title}
                </h3>
                <p className="muted" style={{ fontSize: 13 }}>
                  {s.manifest.blurb}
                </p>
                <p className="faint" style={{ fontSize: 11 }}>
                  {s.nodes.filter((n) => n.kind === "location").length} комнат ·{" "}
                  {s.manifest.status}
                </p>
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <Link className="btn btn-primary" to={`/studio/${s.manifest.id}`}>
                    Редактировать
                  </Link>
                  <Link className="btn" to={`/project/${s.manifest.id}`}>
                    Играть
                  </Link>
                  <button
                    type="button"
                    className="btn"
                    style={{ color: "var(--danger)" }}
                    onClick={() => {
                      if (confirm("Удалить сценарий?")) {
                        deleteScenario(s.manifest.id);
                        setTick((t) => t + 1);
                      }
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <h2
        className="brass"
        style={{
          fontSize: 11,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginTop: 40,
        }}
      >
        Быстрый старт
      </h2>
      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
          marginTop: 12,
        }}
      >
        {bundled.map((doc) => (
          <div key={doc.manifest.id} className="card" style={{ overflow: "hidden", padding: 0 }}>
            <div style={{ aspectRatio: "16/10", overflow: "hidden", background: "#1a1814" }}>
              {doc.manifest.coverImage ? (
                <img
                  src={doc.manifest.coverImage}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : null}
            </div>
            <div style={{ padding: 14 }}>
              {doc.manifest.subtitle ? (
                <p className="brass" style={{ fontSize: 10, margin: 0 }}>
                  {doc.manifest.subtitle}
                </p>
              ) : null}
              <h3
                className="font-display"
                style={{ margin: "4px 0", fontSize: 22, color: "var(--paper)" }}
              >
                {doc.manifest.title}
              </h3>
              <p className="muted" style={{ fontSize: 13 }}>
                {doc.manifest.blurb}
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <Link className="btn btn-primary" to={`/project/${doc.manifest.id}`}>
                  Играть
                </Link>
                <button
                  type="button"
                  className="btn"
                  onClick={() => openBundledStudio(doc.manifest.id, false)}
                >
                  В мастерской
                </button>
                <button
                  type="button"
                  className="btn"
                  title="Перезаписать локальную копию файлом из кода"
                  onClick={() => openBundledStudio(doc.manifest.id, true, false)}
                >
                  Обновить копию
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="faint" style={{ marginTop: 32, fontSize: 12 }}>
        Build: {STAMP}
      </p>
    </main>
  );
}
