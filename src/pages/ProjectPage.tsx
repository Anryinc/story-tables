import { Link, useNavigate, useParams } from "react-router-dom";
import { makeRoomCode } from "@/lib/ids";
import { getProject } from "@/projects/registry";

export function ProjectPage() {
  const { projectId = "" } = useParams();
  const project = getProject(projectId);
  const navigate = useNavigate();

  if (!project) {
    return (
      <main style={{ padding: 40, textAlign: "center" }}>
        <p>Проект не найден</p>
        <Link to="/">Назад</Link>
      </main>
    );
  }

  const m = project.manifest;

  return (
    <main style={{ minHeight: "100dvh", position: "relative" }}>
      <img
        src={m.coverImage}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.35,
        }}
      />
      <div
        style={{
          position: "relative",
          maxWidth: 520,
          margin: "0 auto",
          padding: "48px 20px",
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        <Link to="/" className="faint" style={{ fontSize: 12 }}>
          ← Хаб
        </Link>
        <h1 className="font-display" style={{ fontSize: 40, color: "var(--paper)" }}>
          {m.title}
        </h1>
        <p className="muted">{m.description}</p>
        <p className="faint" style={{ fontSize: 13 }}>
          {m.playersMin}–{m.playersMax} игрока · ~{m.estimatedMinutes} мин
        </p>
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: 16, width: "100%" }}
          onClick={() => {
            const code = makeRoomCode();
            sessionStorage.setItem("story-tables.project", projectId);
            navigate(`/table/${code}`);
          }}
        >
          Открыть стол на этом ПК
        </button>
        <Link
          to={`/studio/${projectId}`}
          className="btn"
          style={{ marginTop: 10, width: "100%" }}
        >
          Мастерская (граф)
        </Link>
      </div>
    </main>
  );
}
