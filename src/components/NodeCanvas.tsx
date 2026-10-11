import {
  useCallback,
  useRef,
  useState,
  type PointerEvent as RE,
} from "react";
import {
  NODE_META,
  createNode,
  type NodeKind,
  type ScenarioDocument,
  type ScenarioEdge,
  type ScenarioNode,
} from "@/lib/scenario/types";

const NW = 200;
const NH = 96;

const PLAN_KINDS: NodeKind[] = [
  "start",
  "location",
  "event",
  "branch",
  "npc",
  "inspect",
];

type Drag =
  | { mode: "node"; id: string; ox: number; oy: number }
  | { mode: "pan"; ox: number; oy: number; vx: number; vy: number }
  | { mode: "link"; from: string; fromPort: string; x: number; y: number }
  | null;

export function NodeCanvas({
  doc,
  onChange,
  hideTimelineNodes = false,
}: {
  doc: ScenarioDocument;
  onChange: (d: ScenarioDocument) => void;
  hideTimelineNodes?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState({ x: 40, y: 40, scale: 1 });
  const drag = useRef<Drag>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const visibleNodes = hideTimelineNodes
    ? doc.nodes.filter((n) => n.kind !== "timeline")
    : doc.nodes;

  const selected = doc.nodes.find((n) => n.id === selectedId) ?? null;
  const locations = doc.nodes.filter((n) => n.kind === "location");

  const updateNode = useCallback(
    (id: string, patch: Partial<ScenarioNode> | { data: Partial<ScenarioNode["data"]> }) => {
      onChange({
        ...doc,
        nodes: doc.nodes.map((n) => {
          if (n.id !== id) return n;
          if ("data" in patch && patch.data) {
            return { ...n, data: { ...n.data, ...patch.data } };
          }
          return { ...n, ...patch } as ScenarioNode;
        }),
      });
    },
    [doc, onChange],
  );

  const add = (kind: NodeKind) => {
    const n = createNode(
      kind,
      (200 - view.x) / view.scale,
      (120 - view.y) / view.scale + doc.nodes.length * 10,
    );
    onChange({ ...doc, nodes: [...doc.nodes, n] });
    setSelectedId(n.id);
  };

  const removeSelected = () => {
    if (!selectedId) return;
    onChange({
      ...doc,
      nodes: doc.nodes.filter((n) => n.id !== selectedId),
      edges: doc.edges.filter((e) => e.from !== selectedId && e.to !== selectedId),
    });
    setSelectedId(null);
  };

  const onBoardDown = (e: RE) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    if ((e.target as HTMLElement).closest("[data-port]")) return;
    setSelectedId(null);
    drag.current = {
      mode: "pan",
      ox: e.clientX,
      oy: e.clientY,
      vx: view.x,
      vy: view.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onMove = (e: RE) => {
    const d = drag.current;
    if (!d) return;
    if (d.mode === "pan") {
      setView((v) => ({
        ...v,
        x: d.vx + (e.clientX - d.ox),
        y: d.vy + (e.clientY - d.oy),
      }));
    } else if (d.mode === "node") {
      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - view.x) / view.scale - d.ox;
      const y = (e.clientY - rect.top - view.y) / view.scale - d.oy;
      updateNode(d.id, { x, y });
    } else if (d.mode === "link") {
      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect) return;
      drag.current = {
        ...d,
        x: (e.clientX - rect.left - view.x) / view.scale,
        y: (e.clientY - rect.top - view.y) / view.scale,
      };
      setView((v) => ({ ...v }));
    }
  };

  const onUp = (e: RE) => {
    const d = drag.current;
    if (d?.mode === "link") {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const port = el?.closest("[data-port]") as HTMLElement | null;
      const nodeEl = el?.closest("[data-node]") as HTMLElement | null;
      const toId = nodeEl?.dataset.nodeId;
      const toPort = port?.dataset.portId;
      const dir = port?.dataset.portDir;
      if (toId && toPort && dir === "in" && toId !== d.from) {
        const edge: ScenarioEdge = {
          id: `e_${d.from}_${toId}_${Date.now()}`,
          from: d.from,
          fromPort: d.fromPort,
          to: toId,
          toPort,
        };
        onChange({ ...doc, edges: [...doc.edges, edge] });
      }
    }
    drag.current = null;
  };

  const startNodeDrag = (e: RE, n: ScenarioNode) => {
    e.stopPropagation();
    setSelectedId(n.id);
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ox = (e.clientX - rect.left - view.x) / view.scale - n.x;
    const oy = (e.clientY - rect.top - view.y) / view.scale - n.y;
    drag.current = { mode: "node", id: n.id, ox, oy };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const startLink = (e: RE, nodeId: string, portId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const n = doc.nodes.find((x) => x.id === nodeId);
    if (!n) return;
    drag.current = {
      mode: "link",
      from: nodeId,
      fromPort: portId,
      x: n.x + NW,
      y: n.y + NH / 2,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const linkPreview = drag.current?.mode === "link" ? drag.current : null;

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
      <div
        ref={boardRef}
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(circle at 1px 1px, #2a2622 1px, transparent 0) 0 0 / 24px 24px",
        }}
        onPointerDown={onBoardDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
      >
        <div
          style={{
            position: "absolute",
            left: 8,
            top: 8,
            zIndex: 5,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            maxWidth: "70%",
          }}
        >
          {PLAN_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              className="btn"
              style={{
                height: 32,
                fontSize: 12,
                borderColor: NODE_META[k].color,
                color: NODE_META[k].color,
              }}
              onClick={() => add(k)}
            >
              + {NODE_META[k].label}
            </button>
          ))}
        </div>

        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          <g transform={`translate(${view.x},${view.y}) scale(${view.scale})`}>
            {doc.edges.map((e) => {
              const a = visibleNodes.find((n) => n.id === e.from);
              const b = visibleNodes.find((n) => n.id === e.to);
              if (!a || !b) return null;
              const x1 = a.x + NW;
              const y1 = a.y + NH / 2;
              const x2 = b.x;
              const y2 = b.y + NH / 2;
              const mx = (x1 + x2) / 2;
              return (
                <path
                  key={e.id}
                  d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  stroke="#6e675c"
                  strokeWidth={2}
                  fill="none"
                />
              );
            })}
            {linkPreview ? (
              <line
                x1={(doc.nodes.find((n) => n.id === linkPreview.from)?.x ?? 0) + NW}
                y1={
                  (doc.nodes.find((n) => n.id === linkPreview.from)?.y ?? 0) + NH / 2
                }
                x2={linkPreview.x}
                y2={linkPreview.y}
                stroke="#c4a574"
                strokeWidth={2}
                strokeDasharray="6 4"
              />
            ) : null}
          </g>
        </svg>

        <div
          style={{
            position: "absolute",
            left: view.x,
            top: view.y,
            transform: `scale(${view.scale})`,
            transformOrigin: "0 0",
          }}
        >
          {visibleNodes.map((n) => {
            const meta = NODE_META[n.kind];
            const sel = n.id === selectedId;
            return (
              <div
                key={n.id}
                data-node
                data-node-id={n.id}
                onPointerDown={(e) => startNodeDrag(e, n)}
                style={{
                  position: "absolute",
                  left: n.x,
                  top: n.y,
                  width: NW,
                  minHeight: NH,
                  borderRadius: 12,
                  border: `1px solid ${sel ? meta.color : "#2a2622"}`,
                  background: "#141210",
                  boxShadow: sel ? `0 0 0 1px ${meta.color}` : undefined,
                  userSelect: "none",
                }}
              >
                <div
                  style={{
                    padding: "8px 10px 4px",
                    borderBottom: "1px solid #2a2622",
                    color: meta.color,
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {meta.label}
                </div>
                <div style={{ padding: "8px 10px", color: "var(--paper)", fontSize: 14 }}>
                  {n.data.title}
                  {n.kind === "event" ? (
                    <div className="faint" style={{ fontSize: 11 }}>
                      {n.data.scope ?? "actor"}
                    </div>
                  ) : null}
                </div>
                {n.ports
                  .filter((p) => p.dir === "in")
                  .map((p, i) => (
                    <span
                      key={p.id}
                      data-port
                      data-port-id={p.id}
                      data-port-dir="in"
                      title={p.label}
                      style={{
                        position: "absolute",
                        left: -6,
                        top: 28 + i * 18,
                        width: 12,
                        height: 12,
                        borderRadius: 99,
                        background: "#c4a574",
                        border: "2px solid #0c0b0a",
                      }}
                    />
                  ))}
                {n.ports
                  .filter((p) => p.dir === "out")
                  .map((p, i) => (
                    <span
                      key={p.id}
                      data-port
                      data-port-id={p.id}
                      data-port-dir="out"
                      title={p.label}
                      onPointerDown={(e) => startLink(e, n.id, p.id)}
                      style={{
                        position: "absolute",
                        right: -6,
                        top: 28 + i * 18,
                        width: 12,
                        height: 12,
                        borderRadius: 99,
                        background: meta.color,
                        border: "2px solid #0c0b0a",
                        cursor: "crosshair",
                      }}
                    />
                  ))}
              </div>
            );
          })}
        </div>
      </div>

      <aside
        style={{
          width: 300,
          borderLeft: "1px solid var(--line)",
          padding: 14,
          overflow: "auto",
          background: "#0f0e0c",
        }}
      >
        {!selected ? (
          <p className="muted" style={{ fontSize: 13 }}>
            План локаций и связей. События по ходам — на шкале сверху. Превью
            сцены — кнопка в шапке.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <p
              className="brass"
              style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" }}
            >
              {NODE_META[selected.kind].label}
            </p>
            <Field
              label="Заголовок"
              value={selected.data.title}
              onChange={(v) => updateNode(selected.id, { data: { title: v } })}
            />
            {selected.kind === "location" ? (
              <>
                <Field
                  label="locationId"
                  value={selected.data.locationId ?? ""}
                  onChange={(v) =>
                    updateNode(selected.id, { data: { locationId: v } })
                  }
                />
                <Field
                  label="Фон (URL)"
                  value={selected.data.background ?? ""}
                  onChange={(v) =>
                    updateNode(selected.id, { data: { background: v } })
                  }
                />
                <Field
                  label="Описание"
                  value={selected.data.description ?? ""}
                  multiline
                  onChange={(v) =>
                    updateNode(selected.id, { data: { description: v } })
                  }
                />
              </>
            ) : null}
            {selected.kind === "event" ? (
              <>
                <Field
                  label="Текст"
                  value={selected.data.body ?? ""}
                  multiline
                  onChange={(v) => updateNode(selected.id, { data: { body: v } })}
                />
                <label className="muted" style={{ fontSize: 12 }}>
                  Кому
                  <select
                    value={selected.data.scope ?? "actor"}
                    onChange={(e) =>
                      updateNode(selected.id, {
                        data: {
                          scope: e.target.value as
                            | "actor"
                            | "same_location"
                            | "all",
                        },
                      })
                    }
                    style={selectStyle}
                  >
                    <option value="actor">Автор действия</option>
                    <option value="same_location">Выбранная локация</option>
                    <option value="all">Все</option>
                  </select>
                </label>
                {selected.data.scope === "same_location" ? (
                  <label className="muted" style={{ fontSize: 12 }}>
                    Локация
                    <select
                      value={selected.data.scopeLocationId ?? ""}
                      onChange={(e) =>
                        updateNode(selected.id, {
                          data: {
                            scopeLocationId: e.target.value || undefined,
                          },
                        })
                      }
                      style={selectStyle}
                    >
                      <option value="">—</option>
                      {locations.map((l) => (
                        <option
                          key={l.id}
                          value={l.data.locationId || l.id}
                        >
                          {l.data.title}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </>
            ) : null}
            {selected.kind === "inspect" ? (
              <>
                <Field
                  label="Что осмотреть"
                  value={selected.data.inspectLabel ?? ""}
                  onChange={(v) =>
                    updateNode(selected.id, { data: { inspectLabel: v } })
                  }
                />
                <Field
                  label="Результат"
                  value={selected.data.inspectResult ?? ""}
                  multiline
                  onChange={(v) =>
                    updateNode(selected.id, { data: { inspectResult: v } })
                  }
                />
              </>
            ) : null}
            {selected.kind === "npc" ? (
              <>
                <Field
                  label="Имя"
                  value={selected.data.npcName ?? selected.data.title}
                  onChange={(v) =>
                    updateNode(selected.id, {
                      data: { npcName: v, title: v },
                    })
                  }
                />
                <Field
                  label="Интро"
                  value={selected.data.npcIntro ?? ""}
                  multiline
                  onChange={(v) =>
                    updateNode(selected.id, { data: { npcIntro: v } })
                  }
                />
              </>
            ) : null}
            <button type="button" className="btn" onClick={removeSelected}>
              Удалить ноду
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  background: "#0c0b0a",
  color: "var(--paper)",
  border: "1px solid var(--line)",
  borderRadius: 8,
  padding: 8,
};

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="muted" style={{ fontSize: 12, display: "block" }}>
      {label}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          style={{
            display: "block",
            width: "100%",
            marginTop: 4,
            background: "#0c0b0a",
            color: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: 8,
            padding: 8,
            font: "inherit",
          }}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            marginTop: 4,
            background: "#0c0b0a",
            color: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: 8,
            padding: 8,
            font: "inherit",
          }}
        />
      )}
    </label>
  );
}
