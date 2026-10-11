import { useState } from "react";
import type { ScenarioDocument, TimelineMarker } from "@/lib/scenario/types";

const MAX_ROUNDS = 24;

export function TimelineStrip({
  doc,
  onChange,
}: {
  doc: ScenarioDocument;
  onChange: (d: ScenarioDocument) => void;
}) {
  const markers = doc.timeline ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = markers.find((m) => m.id === selectedId) ?? null;

  const locations = doc.nodes
    .filter((n) => n.kind === "location")
    .map((n) => ({
      id: n.data.locationId || n.id,
      title: n.data.title,
    }));

  const setMarkers = (next: TimelineMarker[]) => {
    onChange({ ...doc, timeline: next });
  };

  const addAt = (round: number) => {
    const m: TimelineMarker = {
      id: `tm_${Math.random().toString(36).slice(2, 8)}`,
      atRound: round,
      title: `Ход ${round}`,
      body: "",
      scope: "all",
    };
    setMarkers([...markers, m]);
    setSelectedId(m.id);
  };

  const update = (id: string, patch: Partial<TimelineMarker>) => {
    setMarkers(markers.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const remove = (id: string) => {
    setMarkers(markers.filter((m) => m.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div
      style={{
        borderBottom: "1px solid var(--line)",
        background: "#0f0e0c",
        padding: "8px 12px 10px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <p
          className="brass"
          style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", margin: 0 }}
        >
          Шкала ходов
        </p>
        <button
          type="button"
          className="btn"
          style={{ height: 28, fontSize: 11 }}
          onClick={() => addAt(Math.min(MAX_ROUNDS, (markers.at(-1)?.atRound ?? 0) + 1 || 1))}
        >
          + Событие
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 0,
          overflowX: "auto",
          paddingBottom: 4,
          position: "relative",
        }}
      >
        {Array.from({ length: MAX_ROUNDS }, (_, i) => i + 1).map((round) => {
          const here = markers.filter((m) => m.atRound === round);
          return (
            <div
              key={round}
              style={{
                minWidth: 44,
                flex: "0 0 44px",
                textAlign: "center",
                position: "relative",
              }}
            >
              <button
                type="button"
                title={`Добавить на ход ${round}`}
                onClick={() => addAt(round)}
                style={{
                  width: "100%",
                  height: 28,
                  border: "none",
                  borderBottom: "2px solid #2a2622",
                  background: "transparent",
                  color: "var(--faint)",
                  fontSize: 10,
                  cursor: "pointer",
                }}
              >
                {round}
              </button>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  alignItems: "center",
                  minHeight: 28,
                  paddingTop: 4,
                }}
              >
                {here.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(m.id);
                    }}
                    style={{
                      width: 36,
                      height: 22,
                      borderRadius: 6,
                      border:
                        m.id === selectedId
                          ? "1px solid #7aa2c7"
                          : "1px solid #3a4a5a",
                      background: "#1a2836",
                      color: "#9ec0e0",
                      fontSize: 9,
                      cursor: "pointer",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      padding: "0 2px",
                    }}
                    title={m.title}
                  >
                    {m.title.slice(0, 4)}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selected ? (
        <div
          className="card"
          style={{
            marginTop: 8,
            display: "grid",
            gap: 8,
            gridTemplateColumns: "1fr 1fr",
            fontSize: 12,
          }}
        >
          <label className="muted">
            Раунд
            <input
              type="number"
              min={1}
              max={99}
              value={selected.atRound}
              onChange={(e) =>
                update(selected.id, { atRound: Number(e.target.value) || 1 })
              }
              style={field}
            />
          </label>
          <label className="muted">
            Кому
            <select
              value={selected.scope}
              onChange={(e) =>
                update(selected.id, {
                  scope: e.target.value as TimelineMarker["scope"],
                })
              }
              style={field}
            >
              <option value="all">Все игроки</option>
              <option value="same_location">В выбранной локации</option>
              <option value="actor">(legacy) actor</option>
            </select>
          </label>
          {selected.scope === "same_location" ? (
            <label className="muted" style={{ gridColumn: "1 / -1" }}>
              Локация оповещения
              <select
                value={selected.scopeLocationId ?? ""}
                onChange={(e) =>
                  update(selected.id, {
                    scopeLocationId: e.target.value || undefined,
                  })
                }
                style={field}
              >
                <option value="">— выберите —</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="muted" style={{ gridColumn: "1 / -1" }}>
            Заголовок
            <input
              value={selected.title}
              onChange={(e) => update(selected.id, { title: e.target.value })}
              style={field}
            />
          </label>
          <label className="muted" style={{ gridColumn: "1 / -1" }}>
            Текст
            <textarea
              value={selected.body}
              onChange={(e) => update(selected.id, { body: e.target.value })}
              rows={2}
              style={{ ...field, resize: "vertical" }}
            />
          </label>
          <button
            type="button"
            className="btn"
            style={{ gridColumn: "1 / -1", color: "var(--danger)" }}
            onClick={() => remove(selected.id)}
          >
            Удалить с шкалы
          </button>
        </div>
      ) : null}
    </div>
  );
}

const field: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  background: "#0c0b0a",
  border: "1px solid var(--line)",
  borderRadius: 8,
  padding: 8,
  color: "var(--paper)",
  font: "inherit",
  fontSize: 12,
};
