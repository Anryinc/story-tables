import { Link, useParams } from "react-router-dom";
import { getProject } from "@/projects/registry";

export function StudioPage() {
  const { projectId = "" } = useParams();
  const project = getProject(projectId);
  if (!project) {
    return (
      <main style={{ padding: 40 }}>
        <Link to="/">Назад</Link>
        <p>Нет проекта</p>
      </main>
    );
  }
  const g = project.graph;
  const locs = Object.values(g.locations);
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <Link to={`/project/${projectId}`} className="faint" style={{ fontSize: 12 }}>
        ← {project.manifest.title}
      </Link>
      <h1 className="font-display" style={{ color: "var(--paper)" }}>
        Мастерская
      </h1>
      <p className="muted" style={{ fontSize: 14 }}>
        Канон графа в git: <code>src/projects/{projectId}/graph.ts</code>. Start:{" "}
        {g.startLocationId}
      </p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {locs.map((loc) => (
          <li key={loc.id} className="card" style={{ marginBottom: 10 }}>
            <strong style={{ color: "var(--paper)" }}>{loc.name}</strong>
            <span className="faint" style={{ fontSize: 12 }}>
              {" "}
              · выходов {loc.exits.length} · осмотров {loc.inspect.length} · NPC{" "}
              {loc.npcs?.length ?? 0}
            </span>
          </li>
        ))}
      </ul>
      <pre
        className="card"
        style={{ fontSize: 11, overflow: "auto", maxHeight: 360, color: "var(--muted)" }}
      >
        {JSON.stringify(g, null, 2)}
      </pre>
    </main>
  );
}
