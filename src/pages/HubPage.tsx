import { Link } from "react-router-dom";
import { listProjects } from "@/projects/registry";

const STAMP = "clean-v0.1.0";

export function HubPage() {
  const projects = listProjects();
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 20px" }}>
      <p className="brass" style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase" }}>
        Стол проектов
      </p>
      <h1 className="font-display" style={{ fontSize: 42, color: "var(--paper)", margin: "8px 0" }}>
        Активные сценарии
      </h1>
      <p className="muted" style={{ maxWidth: 480 }}>
        ПК — хаб стола. Телефоны — личные ходы. Состояние в памяти хоста, связь через PeerJS.
      </p>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", marginTop: 28 }}>
        {projects.map((p) => (
          <Link key={p.id} to={`/project/${p.id}`} className="card" style={{ overflow: "hidden", padding: 0 }}>
            <div style={{ aspectRatio: "16/10", overflow: "hidden" }}>
              <img src={p.coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ padding: 14 }}>
              <h2 className="font-display" style={{ margin: 0, fontSize: 24, color: "var(--paper)" }}>
                {p.title}
              </h2>
              <p className="brass" style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                {p.subtitle}
              </p>
              <p className="muted" style={{ fontSize: 14 }}>
                {p.blurb}
              </p>
            </div>
          </Link>
        ))}
      </div>
      <p className="faint" style={{ marginTop: 32, fontSize: 12 }}>
        Build: {STAMP} · репозиторий story-tables (не story-constructor)
      </p>
    </main>
  );
}
