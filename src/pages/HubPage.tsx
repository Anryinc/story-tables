import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { emptyScenario } from "@/lib/scenario/types";
import {
  deleteScenario,
  importScenarioJson,
  listStoredScenarios,
  saveScenario,
} from "@/lib/scenario/store";
import { listProjects } from "@/projects/registry";

const STAMP = "studio-v0.2.0";

export function HubPage() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const stored = useMemo(() => listStoredScenarios(), [tick]);
  const bundled = listProjects();

  const createNew = () => {
    const doc = emptyScenario("Новый сценарий");
    saveScenario(doc);
    navigate(`/studio/${doc.manifest.id}`);
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
            Создавайте граф локаций, событий и шкалу ходов. Затем откройте стол на
            ПК — игроки ходят с телефонов по одному действию за раунд.
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button type="button" className="btn btn-primary" onClick={createNew}>
            + Новый сценарий
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
        Ваши сценарии (localStorage)
      </h2>
      {stored.length === 0 ? (
        <p className="muted" style={{ marginTop: 12 }}>
          Пока пусто. Создайте сценарий в node-мастерской.
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
            <article key={s.manifest.id} className="card">
              <h3
                className="font-display"
                style={{ margin: 0, fontSize: 22, color: "var(--paper)" }}
              >
                {s.manifest.title}
              </h3>
              <p className="faint" style={{ fontSize: 12 }}>
                {s.nodes.length} нод · {s.edges.length} связей ·{" "}
                {s.manifest.status}
              </p>
              <p className="muted" style={{ fontSize: 13 }}>
                {s.manifest.blurb}
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <Link className="btn btn-primary" to={`/studio/${s.manifest.id}`}>
                  Редактировать
                </Link>
                <Link
                  className="btn"
                  to={`/project/${s.manifest.id}`}
                  onClick={() =>
                    sessionStorage.setItem("story-tables.project", s.manifest.id)
                  }
                >
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
        Встроенные (временно, до пересборки в мастерской)
      </h2>
      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
          marginTop: 12,
        }}
      >
        {bundled.map((p) => (
          <Link
            key={p.id}
            to={`/project/${p.id}`}
            className="card"
            style={{ overflow: "hidden", padding: 0 }}
          >
            <div style={{ aspectRatio: "16/10", overflow: "hidden" }}>
              <img
                src={p.coverImage}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ padding: 14 }}>
              <h3
                className="font-display"
                style={{ margin: 0, fontSize: 22, color: "var(--paper)" }}
              >
                {p.title}
              </h3>
              <p className="muted" style={{ fontSize: 13 }}>
                {p.blurb}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <p className="faint" style={{ marginTop: 32, fontSize: 12 }}>
        Build: {STAMP} · story-tables
      </p>
    </main>
  );
}
