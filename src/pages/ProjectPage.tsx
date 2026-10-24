import { Link, useNavigate, useParams } from "react-router-dom";
import { makeRoomCode } from "@/lib/ids";
import { resolvePlayable } from "@/lib/scenario/resolve";
import { getStoredScenario } from "@/lib/scenario/store";

export function ProjectPage() {
  const { projectId = "" } = useParams();
  const pack = resolvePlayable(projectId);
  const stored = getStoredScenario(projectId);
  const navigate = useNavigate();

  if (!pack) {
    return (
      <main style={{ padding: 40, textAlign: "center" }}>
        <p>Проект не найден</p>
        <Link to="/">Назад</Link>
      </main>
    );
  }

  const locCount = Object.keys(pack.graph.locations).length;
  const meta = stored?.manifest ?? pack.manifest;
  const title = meta?.title || pack.title;
  const subtitle = meta?.subtitle;
  const blurb =
    meta?.blurb ||
    "Сценарий из мастерской. Пошаговые ходы, личные и общие события.";
  const cover =
    meta?.coverImage ||
    Object.values(pack.graph.locations).find((l) => l.image)?.image;

  return (
    <main style={{ minHeight: "100dvh", position: "relative" }}>
      {cover ? (
        <img
          src={cover}
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
      ) : null}
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
          ← Сценарии
        </Link>
        {subtitle ? (
          <p className="brass" style={{ fontSize: 11, letterSpacing: "0.14em" }}>
            {subtitle}
          </p>
        ) : null}
        <h1 className="font-display" style={{ fontSize: 40, color: "var(--paper)" }}>
          {title}
        </h1>
        <p className="muted">{blurb}</p>
        <p className="faint" style={{ fontSize: 13 }}>
          Локаций: {locCount} · timeline: {pack.timeline.length}
          {stored?.manifest.playersMin != null || pack.manifest
            ? ` · ${meta?.playersMin ?? "?"}–${meta?.playersMax ?? pack.playersMax} игр.`
            : ""}
        </p>
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: 16, width: "100%" }}
          onClick={() => {
            const code = makeRoomCode();
            sessionStorage.setItem("story-tables.project", projectId);
            navigate(`/table/${code}?project=${encodeURIComponent(projectId)}`);
          }}
        >
          Открыть стол на этом ПК
        </button>
      </div>
    </main>
  );
}
