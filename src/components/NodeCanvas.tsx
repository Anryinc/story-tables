import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as RE,
} from "react";
import { addAssetFromFile, resolveAssetUrl } from "@/lib/assets/store";
import { ClueEditor, FlagListField, GateFields } from "@/components/author-fields";
import {
  NODE_META,
  createNode,
  type NodeKind,
  type ScenarioDocument,
  type ScenarioEdge,
  type ScenarioNode,
  type ScenarioTalkOption,
} from "@/lib/scenario/types";

/** Canvas shows only structural nodes; content lives inside location cards. */
const CANVAS_KINDS = new Set<NodeKind>(["start", "location", "event", "branch"]);

const LOC_W = 220;
const LOC_H = 200;
const SMALL_W = 160;
const SMALL_H = 72;

function nodeSize(kind: NodeKind) {
  if (kind === "location") return { w: LOC_W, h: LOC_H };
  return { w: SMALL_W, h: SMALL_H };
}

type Drag =
  | { mode: "node"; id: string; ox: number; oy: number }
  | { mode: "pan"; ox: number; oy: number; vx: number; vy: number }
  | { mode: "link"; from: string; fromPort: string; x: number; y: number }
  | null;

function childrenOf(
  doc: ScenarioDocument,
  locId: string,
): { npcs: ScenarioNode[]; inspects: ScenarioNode[] } {
  const childIds = new Set<
    string
  >();
  for (const e of doc.edges) {
    if (e.from === locId && (e.fromPort === "events" || e.fromPort === "out")) {
      childIds.add(e.to);
    }
    if (e.to === locId && e.toPort === "events") {
      childIds.add(e.from);
    }
  }
  const npcs: ScenarioNode[] = [];
  const inspects: ScenarioNode[] = [];
  for (const id of childIds) {
    const n = doc.nodes.find((x) => x.id === id);
    if (!n) continue;
    if (n.kind === "npc") npcs.push(n);
    if (n.kind === "inspect") inspects.push(n);
  }
  return { npcs, inspects };
}

export function NodeCanvas({
  doc,
  onChange,
  hideTimelineNodes = false,
  onOpenScene,
}: {
  doc: ScenarioDocument;
  onChange: (d: ScenarioDocument) => void;
  hideTimelineNodes?: boolean;
  onOpenScene?: (locationNodeId: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editChildId, setEditChildId] = useState<string | null>(null);
  const [view, setView] = useState({ x: 40, y: 40, scale: 1 });
  const [uploadingBg, setUploadingBg] = useState(false);
  const drag = useRef<Drag>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const visibleNodes = doc.nodes.filter((n) => {
    if (hideTimelineNodes && n.kind === "timeline") return false;
    return CANVAS_KINDS.has(n.kind);
  });

  const selected = doc.nodes.find((n) => n.id === selectedId) ?? null;
  const locations = doc.nodes.filter((n) => n.kind === "location");

  const updateNode = useCallback(
    (
      id: string,
      patch: Partial<ScenarioNode> | { data: Partial<ScenarioNode["data"]> },
    ) => {
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

  const updateEdge = useCallback(
    (id: string, patch: Partial<ScenarioEdge>) => {
      onChange({
        ...doc,
        edges: doc.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      });
    },
    [doc, onChange],
  );

  const removeEdge = useCallback(
    (id: string) => {
      onChange({ ...doc, edges: doc.edges.filter((e) => e.id !== id) });
    },
    [doc, onChange],
  );

  const addLocation = () => {
    const n = createNode(
      "location",
      (120 - view.x) / view.scale,
      (100 - view.y) / view.scale + locations.length * 40,
    );
    n.data.title = `Комната ${locations.length + 1}`;
    n.data.locationId = n.id;
    onChange({ ...doc, nodes: [...doc.nodes, n] });
    setSelectedId(n.id);
    setEditChildId(null);
  };

  const addStart = () => {
    if (doc.nodes.some((n) => n.kind === "start")) return;
    const n = createNode("start", (80 - view.x) / view.scale, (80 - view.y) / view.scale);
    onChange({ ...doc, nodes: [...doc.nodes, n] });
    setSelectedId(n.id);
  };

  const attachChild = (locId: string, kind: "npc" | "inspect") => {
    const child = createNode(kind, 0, 0);
    if (kind === "npc") {
      child.data.title = "Новый NPC";
      child.data.npcName = "Новый NPC";
      child.data.npcIntro = "Кто это?";
      child.data.body = "…";
    } else {
      child.data.title = "Осмотр";
      child.data.inspectLabel = "Осмотреть…";
      child.data.inspectResult = "Вы видите…";
      child.data.once = true;
    }
    const edge: ScenarioEdge = {
      id: `e_${locId}_${child.id}`,
      from: locId,
      fromPort: "events",
      to: child.id,
      toPort: "in",
    };
    onChange({
      ...doc,
      nodes: [...doc.nodes, child],
      edges: [...doc.edges, edge],
    });
    setSelectedId(locId);
    setEditChildId(child.id);
  };

  const removeNode = (id: string) => {
    onChange({
      ...doc,
      nodes: doc.nodes.filter((n) => n.id !== id),
      edges: doc.edges.filter((e) => e.from !== id && e.to !== id),
    });
    if (selectedId === id) setSelectedId(null);
    if (editChildId === id) setEditChildId(null);
  };

  const onBoardDown = (e: RE) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    if ((e.target as HTMLElement).closest("[data-port]")) return;
    setSelectedId(null);
    setEditChildId(null);
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
        const target = doc.nodes.find((n) => n.id === toId);
        const edge: ScenarioEdge = {
          id: `e_${d.from}_${toId}_${Date.now()}`,
          from: d.from,
          fromPort: d.fromPort,
          to: toId,
          toPort,
          label: target?.kind === "location" ? target.data.title || "путь" : "путь",
        };
        onChange({ ...doc, edges: [...doc.edges, edge] });
      }
    }
    drag.current = null;
  };

  const startNodeDrag = (e: RE, n: ScenarioNode) => {
    e.stopPropagation();
    setSelectedId(n.id);
    setEditChildId(null);
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
    const { w, h } = nodeSize(n.kind);
    drag.current = {
      mode: "link",
      from: nodeId,
      fromPort: portId,
      x: n.x + w,
      y: n.y + h / 2,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const linkPreview = drag.current?.mode === "link" ? drag.current : null;

  const onBgFile = async (locId: string, file: File | undefined) => {
    if (!file?.type.startsWith("image/")) return;
    setUploadingBg(true);
    try {
      const meta = await addAssetFromFile(file, { category: "background", name: `bg_${file.name}` });
      const url = await resolveAssetUrl(meta);
      if (url) {
        updateNode(locId, {
          data: { background: url, backgroundAssetId: meta.id },
        });
      }
    } finally {
      setUploadingBg(false);
    }
  };

  const editChild = editChildId
    ? doc.nodes.find((n) => n.id === editChildId)
    : null;

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
          }}
        >
          <button type="button" className="btn" style={toolBtn} onClick={addLocation}>
            + Комната
          </button>
          {!doc.nodes.some((n) => n.kind === "start") ? (
            <button type="button" className="btn" style={toolBtn} onClick={addStart}>
              + Старт
            </button>
          ) : null}
          <span className="faint" style={{ fontSize: 11, alignSelf: "center", marginLeft: 4 }}>
            Связи: тяните порт → порт. NPC и осмотры — внутри комнаты.
          </span>
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
              // only draw move links between visible structural nodes
              if (e.fromPort === "events") return null;
              const sa = nodeSize(a.kind);
              const sb = nodeSize(b.kind);
              const x1 = a.x + sa.w;
              const y1 = a.y + sa.h / 2;
              const x2 = b.x;
              const y2 = b.y + sb.h / 2;
              const mx = (x1 + x2) / 2;
              return (
                <path
                  key={e.id}
                  d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  stroke={e.requiresFlag || e.hideIfFlag ? "#c4a574" : "#6e675c"}
                  strokeWidth={2}
                  strokeDasharray={e.requiresFlag || e.hideIfFlag ? "6 4" : undefined}
                  fill="none"
                />
              );
            })}
            {linkPreview ? (
              (() => {
                const from = doc.nodes.find((n) => n.id === linkPreview.from);
                if (!from) return null;
                const s = nodeSize(from.kind);
                return (
                  <line
                    x1={from.x + s.w}
                    y1={from.y + s.h / 2}
                    x2={linkPreview.x}
                    y2={linkPreview.y}
                    stroke="#c4a574"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                  />
                );
              })()
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
            const { w, h } = nodeSize(n.kind);

            if (n.kind === "location") {
              const { npcs, inspects } = childrenOf(doc, n.id);
              return (
                <div
                  key={n.id}
                  data-node
                  data-node-id={n.id}
                  onPointerDown={(e) => startNodeDrag(e, n)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    onOpenScene?.(n.id);
                  }}
                  style={{
                    position: "absolute",
                    left: n.x,
                    top: n.y,
                    width: w,
                    minHeight: h,
                    borderRadius: 14,
                    border: `1px solid ${sel ? meta.color : meta.color + "55"}`,
                    background: meta.fill,
                    boxShadow: sel ? `0 0 0 2px ${meta.color}88` : "0 8px 24px rgba(0,0,0,0.35)",
                    overflow: "hidden",
                    userSelect: "none",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Scene preview — like player view */}
                  <div
                    style={{
                      height: 110,
                      background: "#0c0b0a",
                      position: "relative",
                      borderBottom: `1px solid ${meta.color}33`,
                    }}
                  >
                    {n.data.background ? (
                      <img
                        src={n.data.background}
                        alt=""
                        draggable={false}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "grid",
                          placeItems: "center",
                          color: "#5a564c",
                          fontSize: 11,
                        }}
                      >
                        нет фона
                      </div>
                    )}
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        padding: "16px 8px 6px",
                        background:
                          "linear-gradient(transparent, rgba(12,11,10,0.92))",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--paper)",
                          fontSize: 13,
                          fontFamily: '"Cormorant Garamond", serif',
                        }}
                      >
                        {n.data.title}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: "6px 8px 8px", flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, fontSize: 10, color: "var(--muted)" }}>
                      <span>{inspects.length} искр</span>
                      <span>{npcs.length} NPC</span>
                      {(n.data.backgrounds?.length ?? 0) > 1 ? (
                        <span>{n.data.backgrounds!.length} фона</span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="btn"
                      style={{ height: 26, fontSize: 11, marginTop: 6, width: "100%" }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => onOpenScene?.(n.id)}
                    >
                      Открыть сцену
                    </button>
                  </div>

                  {/* ports: in left, out right — only move ports on canvas */}
                  <span
                    data-port
                    data-port-id="in"
                    data-port-dir="in"
                    title="вход"
                    style={{ ...portStyle, left: -6, top: 56, background: "#c4a574" }}
                  />
                  <span
                    data-port
                    data-port-id="out"
                    data-port-dir="out"
                    title="выход → связать с другой комнатой"
                    onPointerDown={(e) => startLink(e, n.id, "out")}
                    style={{
                      ...portStyle,
                      right: -6,
                      top: 56,
                      background: meta.color,
                      cursor: "crosshair",
                    }}
                  />
                </div>
              );
            }

            // start / event / branch — compact
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
                  width: w,
                  minHeight: h,
                  borderRadius: 12,
                  border: `1px solid ${sel ? meta.color : meta.color + "66"}`,
                  background: meta.fill,
                  boxShadow: sel ? `0 0 0 1px ${meta.color}` : undefined,
                  userSelect: "none",
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    color: meta.color,
                    fontSize: 10,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {meta.label}
                </div>
                <div style={{ color: "var(--paper)", fontSize: 13, marginTop: 4 }}>
                  {n.data.title}
                </div>
                {n.ports
                  .filter((p) => p.dir === "in")
                  .map((p, i) => (
                    <span
                      key={p.id}
                      data-port
                      data-port-id={p.id}
                      data-port-dir="in"
                      style={{ ...portStyle, left: -6, top: 24 + i * 16, background: "#c4a574" }}
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
                      onPointerDown={(e) => startLink(e, n.id, p.id)}
                      style={{
                        ...portStyle,
                        right: -6,
                        top: 24 + i * 16,
                        background: meta.color,
                        cursor: "crosshair",
                      }}
                    />
                  ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Inspector — scene-centric */}
      <aside
        style={{
          width: selected?.kind === "location" ? 340 : 280,
          borderLeft: "1px solid var(--line)",
          padding: 14,
          overflow: "auto",
          background: "#0f0e0c",
          transition: "width 0.15s ease",
        }}
      >
        {!selected ? (
          <p className="muted" style={{ fontSize: 13 }}>
            Выберите комнату на плане. Фон, NPC и осмотры настраиваются внутри
            карточки — так ближе к тому, что увидят игроки.
          </p>
        ) : selected.kind === "location" ? (
          <LocationInspector
            loc={selected}
            doc={doc}
            editChild={editChild}
            uploadingBg={uploadingBg}
            onUpdate={updateNode}
            onBgFile={onBgFile}
            onAttach={(k) => attachChild(selected.id, k)}
            onEditChild={setEditChildId}
            onRemoveChild={removeNode}
            onRemoveLoc={() => removeNode(selected.id)}
            onOpenScene={onOpenScene}
            onUpdateEdge={updateEdge}
            onRemoveEdge={removeEdge}
          />
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <p className="brass" style={{ fontSize: 11, letterSpacing: "0.14em" }}>
              {NODE_META[selected.kind].label}
            </p>
            <Field
              label="Заголовок"
              value={selected.data.title}
              onChange={(v) => updateNode(selected.id, { data: { title: v } })}
            />
            {selected.kind === "event" ? (
              <Field
                label="Текст"
                value={selected.data.body ?? ""}
                multiline
                onChange={(v) => updateNode(selected.id, { data: { body: v } })}
              />
            ) : null}
            <button type="button" className="btn" onClick={() => removeNode(selected.id)}>
              Удалить
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

function LocationInspector({
  loc,
  doc,
  editChild,
  uploadingBg,
  onUpdate,
  onBgFile,
  onAttach,
  onEditChild,
  onRemoveChild,
  onRemoveLoc,
  onOpenScene,
  onUpdateEdge,
  onRemoveEdge,
}: {
  loc: ScenarioNode;
  doc: ScenarioDocument;
  editChild: ScenarioNode | null | undefined;
  uploadingBg: boolean;
  onUpdate: (
    id: string,
    patch: Partial<ScenarioNode> | { data: Partial<ScenarioNode["data"]> },
  ) => void;
  onBgFile: (locId: string, file: File | undefined) => void;
  onAttach: (k: "npc" | "inspect") => void;
  onEditChild: (id: string | null) => void;
  onRemoveChild: (id: string) => void;
  onRemoveLoc: () => void;
  onOpenScene?: (id: string) => void;
  onUpdateEdge: (id: string, patch: Partial<ScenarioEdge>) => void;
  onRemoveEdge: (id: string) => void;
}) {
  const { npcs, inspects } = childrenOf(doc, loc.id);
  const exits = doc.edges.filter((e) => {
    if (e.from !== loc.id || e.fromPort === "events") return false;
    const to = doc.nodes.find((n) => n.id === e.to);
    return to?.kind === "location";
  });

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <p className="brass" style={{ fontSize: 11, letterSpacing: "0.14em", margin: 0 }}>
        СЦЕНА / КОМНАТА
      </p>

      {/* Live preview strip */}
      <div
        style={{
          borderRadius: 10,
          overflow: "hidden",
          border: "1px solid var(--line)",
          background: "#0c0b0a",
          aspectRatio: "16 / 9",
          position: "relative",
        }}
      >
        {loc.data.background ? (
          <img
            src={loc.data.background}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              color: "#5a564c",
              fontSize: 12,
            }}
          >
            Фон сцены
          </div>
        )}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "20px 10px 8px",
            background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
            color: "var(--paper)",
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: 16,
          }}
        >
          {loc.data.title}
        </div>
      </div>

      <Field
        label="Название"
        value={loc.data.title}
        onChange={(v) => onUpdate(loc.id, { data: { title: v } })}
      />
      <Field
        label="locationId"
        value={loc.data.locationId ?? ""}
        onChange={(v) => onUpdate(loc.id, { data: { locationId: v } })}
      />
      <Field
        label="Текст локации (видят игроки)"
        value={loc.data.description ?? ""}
        multiline
        onChange={(v) => onUpdate(loc.id, { data: { description: v } })}
      />

      <section>
        <span className="brass" style={{ fontSize: 11 }}>
          Выходы
        </span>
        {exits.length === 0 ? (
          <p className="faint" style={{ fontSize: 11 }}>
            Тяните порт комнаты к другой комнате.
          </p>
        ) : (
          exits.map((e) => {
            const to = doc.nodes.find((n) => n.id === e.to);
            return (
              <div key={e.id} className="card" style={{ display: "grid", gap: 6, marginTop: 6 }}>
                <span className="muted" style={{ fontSize: 11 }}>
                  → {to?.data.title || e.to}
                </span>
                <Field
                  label="Подпись"
                  value={e.label ?? ""}
                  onChange={(v) => onUpdateEdge(e.id, { label: v })}
                />
                <Field
                  label="Нужен флаг"
                  value={e.requiresFlag ?? ""}
                  onChange={(v) => onUpdateEdge(e.id, { requiresFlag: v.trim() || undefined })}
                />
                <FlagListField
                  label="Или любой из"
                  value={e.requiresAnyFlags}
                  onChange={(requiresAnyFlags) => onUpdateEdge(e.id, { requiresAnyFlags })}
                />
                <button
                  type="button"
                  className="btn"
                  style={{ height: 28, fontSize: 11, color: "var(--danger)" }}
                  onClick={() => onRemoveEdge(e.id)}
                >
                  Убрать выход
                </button>
              </div>
            );
          })
        )}
      </section>

      <div style={{ display: "grid", gap: 6 }}>
        <span className="muted" style={{ fontSize: 11 }}>
          Фон
        </span>
        <Field
          label="URL"
          value={loc.data.background ?? ""}
          onChange={(v) => onUpdate(loc.id, { data: { background: v || undefined } })}
        />
        <label className="btn" style={{ textAlign: "center", cursor: "pointer", height: 32, fontSize: 12 }}>
          {uploadingBg ? "Загрузка…" : "Загрузить с диска"}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              onBgFile(loc.id, e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {/* NPCs */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span className="brass" style={{ fontSize: 11, flex: 1 }}>
            NPC
          </span>
          <button type="button" className="btn" style={{ height: 26, fontSize: 11 }} onClick={() => onAttach("npc")}>
            + NPC
          </button>
        </div>
        {npcs.length === 0 ? (
          <p className="faint" style={{ fontSize: 11 }}>Нет</p>
        ) : (
          npcs.map((c) => (
            <button
              key={c.id}
              type="button"
              className="btn"
              style={{
                width: "100%",
                marginBottom: 4,
                height: "auto",
                padding: 8,
                textAlign: "left",
                borderColor: editChild?.id === c.id ? "var(--brass)" : undefined,
              }}
              onClick={() => onEditChild(editChild?.id === c.id ? null : c.id)}
            >
              {c.data.npcName || c.data.title}
            </button>
          ))
        )}
      </section>

      {/* Inspects */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span className="brass" style={{ fontSize: 11, flex: 1 }}>
            Осмотры / улики
          </span>
          <button
            type="button"
            className="btn"
            style={{ height: 26, fontSize: 11 }}
            onClick={() => onAttach("inspect")}
          >
            + Осмотр
          </button>
        </div>
        {inspects.length === 0 ? (
          <p className="faint" style={{ fontSize: 11 }}>Нет</p>
        ) : (
          inspects.map((c) => (
            <button
              key={c.id}
              type="button"
              className="btn"
              style={{
                width: "100%",
                marginBottom: 4,
                height: "auto",
                padding: 8,
                textAlign: "left",
                borderColor: editChild?.id === c.id ? "#9a8bc4" : undefined,
              }}
              onClick={() => onEditChild(editChild?.id === c.id ? null : c.id)}
            >
              {c.data.inspectLabel || c.data.title}
            </button>
          ))
        )}
      </section>

      {/* Child editor */}
      {editChild?.kind === "npc" ? (
        <div className="card" style={{ display: "grid", gap: 8 }}>
          <p className="brass" style={{ fontSize: 10, margin: 0 }}>
            NPC · диалог
          </p>
          <Field
            label="Имя"
            value={editChild.data.npcName ?? ""}
            onChange={(v) =>
              onUpdate(editChild.id, { data: { npcName: v, title: v } })
            }
          />
          <Field
            label="Интро (видно в локации)"
            value={editChild.data.npcIntro ?? ""}
            multiline
            onChange={(v) => onUpdate(editChild.id, { data: { npcIntro: v } })}
          />
          <Field
            label="Портрет URL"
            value={editChild.data.portraitUrl ?? ""}
            onChange={(v) =>
              onUpdate(editChild.id, { data: { portraitUrl: v || undefined } })
            }
          />
          <GateFields
            value={editChild.data}
            onChange={(patch) => onUpdate(editChild.id, { data: patch })}
          />
          {editChild.data.talkOptions?.length ? (
            <TalkLines
              options={editChild.data.talkOptions}
              onChange={(talkOptions) => onUpdate(editChild.id, { data: { talkOptions } })}
            />
          ) : (
            <>
              <Field
                label="Реплика при разговоре"
                value={editChild.data.body ?? ""}
                multiline
                onChange={(v) => onUpdate(editChild.id, { data: { body: v } })}
              />
              <FlagListField
                label="Флаги после разговора"
                value={editChild.data.setFlags}
                onChange={(setFlags) => onUpdate(editChild.id, { data: { setFlags } })}
              />
              <ClueEditor
                value={editChild.data.grantClue}
                onChange={(grantClue) => onUpdate(editChild.id, { data: { grantClue } })}
              />
              <button
                type="button"
                className="btn"
                style={{ height: 30, fontSize: 11 }}
                onClick={() =>
                  onUpdate(editChild.id, {
                    data: {
                      talkOptions: [
                        {
                          id: "talk",
                          label: "Поговорить",
                          reply: editChild.data.body || editChild.data.npcIntro || "…",
                          once: false,
                          setFlags: editChild.data.setFlags,
                          grantClue: editChild.data.grantClue,
                        },
                      ],
                    },
                  })
                }
              >
                Несколько реплик
              </button>
            </>
          )}
          <button
            type="button"
            className="btn"
            style={{ color: "var(--danger)", fontSize: 11 }}
            onClick={() => {
              onRemoveChild(editChild.id);
              onEditChild(null);
            }}
          >
            Удалить NPC
          </button>
        </div>
      ) : null}

      {editChild?.kind === "inspect" ? (
        <div className="card" style={{ display: "grid", gap: 8 }}>
          <p className="brass" style={{ fontSize: 10, margin: 0 }}>
            Осмотр · интеракция
          </p>
          <Field
            label="Подпись действия"
            value={editChild.data.inspectLabel ?? ""}
            onChange={(v) =>
              onUpdate(editChild.id, {
                data: { inspectLabel: v, title: v },
              })
            }
          />
          <Field
            label="Результат"
            value={editChild.data.inspectResult ?? ""}
            multiline
            onChange={(v) =>
              onUpdate(editChild.id, { data: { inspectResult: v } })
            }
          />
          <label className="muted" style={{ fontSize: 12 }}>
            <input
              type="checkbox"
              checked={editChild.data.once !== false}
              onChange={(e) =>
                onUpdate(editChild.id, { data: { once: e.target.checked } })
              }
            />{" "}
            Один раз за игру
          </label>
          <label className="muted" style={{ fontSize: 11, display: "block" }}>
            Кто может
            <select
              value={editChild.data.audience === "world" ? "world" : "each"}
              onChange={(e) =>
                onUpdate(editChild.id, {
                  data: { audience: e.target.value === "world" ? "world" : "each" },
                })
              }
              style={{
                display: "block",
                width: "100%",
                marginTop: 4,
                background: "#0c0b0a",
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: 8,
                color: "var(--paper)",
              }}
            >
              <option value="each">Каждый сам (часы, разговор)</option>
              <option value="world">Один забирает у всех (вещь, проклятие)</option>
            </select>
          </label>
          <Field
            label="Предмет в инвентарь (пусто = не класть)"
            value={editChild.data.grantItem?.title ?? ""}
            onChange={(v) =>
              onUpdate(editChild.id, {
                data: {
                  grantItem: v.trim()
                    ? {
                        id: editChild.data.grantItem?.id || `item_${editChild.id}`,
                        title: v.trim(),
                        body: editChild.data.grantItem?.body || editChild.data.inspectResult || "",
                        imageUrl: editChild.data.imageUrl,
                      }
                    : undefined,
                },
              })
            }
          />
          <Field
            label="Состояние персонажа"
            value={editChild.data.grantState?.title ?? ""}
            onChange={(v) =>
              onUpdate(editChild.id, {
                data: {
                  grantState: v.trim()
                    ? {
                        id: editChild.data.grantState?.id || `state_${editChild.id}`,
                        title: v.trim(),
                        body: editChild.data.grantState?.body || editChild.data.inspectResult || "",
                      }
                    : undefined,
                },
              })
            }
          />
          <GateFields
            value={editChild.data}
            onChange={(patch) => onUpdate(editChild.id, { data: patch })}
          />
          <FlagListField
            label="Поставить флаги"
            value={editChild.data.setFlags}
            onChange={(setFlags) => onUpdate(editChild.id, { data: { setFlags } })}
          />
          <ClueEditor
            value={editChild.data.grantClue}
            onChange={(grantClue) => onUpdate(editChild.id, { data: { grantClue } })}
          />
          <button
            type="button"
            className="btn"
            style={{ color: "var(--danger)", fontSize: 11 }}
            onClick={() => {
              onRemoveChild(editChild.id);
              onEditChild(null);
            }}
          >
            Удалить осмотр
          </button>
        </div>
      ) : null}

      {onOpenScene ? (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onOpenScene(loc.id)}
        >
          Превью сцены (окно)
        </button>
      ) : null}

      <button type="button" className="btn" style={{ color: "var(--danger)" }} onClick={onRemoveLoc}>
        Удалить комнату
      </button>
    </div>
  );
}

const toolBtn: CSSProperties = {
  height: 32,
  fontSize: 12,
  borderColor: "#c4a574",
  color: "#c4a574",
  background: "#2a2218",
};

const portStyle: CSSProperties = {
  position: "absolute",
  width: 12,
  height: 12,
  borderRadius: 99,
  border: "2px solid #0c0b0a",
};

const chipNpc: CSSProperties = {
  fontSize: 9,
  padding: "2px 6px",
  borderRadius: 99,
  background: "#182a24",
  color: "#8bc4b0",
  border: "1px solid #8bc4b044",
};

const chipInspect: CSSProperties = {
  fontSize: 9,
  padding: "2px 6px",
  borderRadius: 99,
  background: "#22182a",
  color: "#9a8bc4",
  border: "1px solid #9a8bc444",
};

function TalkLines({
  options,
  onChange,
}: {
  options: ScenarioTalkOption[];
  onChange: (next: ScenarioTalkOption[]) => void;
}) {
  const patch = (id: string, p: Partial<ScenarioTalkOption>) => {
    onChange(options.map((o) => (o.id === id ? { ...o, ...p } : o)));
  };
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {options.map((o, i) => (
        <div key={o.id} className="card" style={{ display: "grid", gap: 6 }}>
          <span className="brass" style={{ fontSize: 10 }}>
            Реплика {i + 1}
          </span>
          <Field
            label="Кнопка"
            value={o.label}
            onChange={(v) => patch(o.id, { label: v })}
          />
          <Field
            label="Ответ"
            value={o.reply}
            multiline
            onChange={(v) => patch(o.id, { reply: v })}
          />
          <label className="muted" style={{ fontSize: 12 }}>
            <input
              type="checkbox"
              checked={o.once !== false}
              onChange={(e) => patch(o.id, { once: e.target.checked })}
            />{" "}
            Один раз
          </label>
          <GateFields value={o} onChange={(g) => patch(o.id, g)} />
          <FlagListField
            label="Поставить флаги"
            value={o.setFlags}
            onChange={(setFlags) => patch(o.id, { setFlags })}
          />
          <ClueEditor
            value={o.grantClue}
            onChange={(grantClue) => patch(o.id, { grantClue })}
          />
          <button
            type="button"
            className="btn"
            style={{ height: 28, fontSize: 11, color: "var(--danger)" }}
            onClick={() => onChange(options.filter((x) => x.id !== o.id))}
          >
            Удалить реплику
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn"
        style={{ height: 30, fontSize: 11 }}
        onClick={() =>
          onChange([
            ...options,
            {
              id: `line_${Math.random().toString(36).slice(2, 7)}`,
              label: "Спросить ещё",
              reply: "…",
              once: true,
            },
          ])
        }
      >
        + Реплика
      </button>
    </div>
  );
}

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
    <label className="muted" style={{ fontSize: 11, display: "block" }}>
      {label}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          style={fieldInput}
        />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} style={fieldInput} />
      )}
    </label>
  );
}

const fieldInput: CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  background: "#0c0b0a",
  color: "var(--paper)",
  border: "1px solid var(--line)",
  borderRadius: 8,
  padding: 8,
  font: "inherit",
  fontSize: 13,
};
