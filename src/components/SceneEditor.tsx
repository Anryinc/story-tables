import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as RE, type ReactNode } from "react";
import { getLoreBase } from "@/lib/lore/registry";
import { abilitiesForSequence } from "@/lib/lore/types";
import { addAssetFromFile, resolveAssetUrl } from "@/lib/assets/store";
import {
  createNode,
  type ScenarioDocument,
  type ScenarioEdge,
  type ScenarioNode,
  type ScenarioTalkOption,
  type SceneBackground,
  type SceneObject,
} from "@/lib/scenario/types";

type Tool = "select" | "spark" | "item" | "npc";
type Mode = "edit" | "play";
type Sel =
  | { kind: "room" }
  | { kind: "spark"; id: string }
  | { kind: "npc"; id: string }
  | { kind: "exit"; id: string }
  | { kind: "presence"; id: string };

const field: CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  background: "#0c0b0a",
  color: "var(--paper)",
  border: "1px solid var(--line)",
  borderRadius: 8,
  padding: 8,
  font: "inherit",
  fontSize: 12,
};

function pickStudioBackground(
  list: SceneBackground[],
  fallback: string | undefined,
  flags: Record<string, boolean>,
  round: number,
): string | undefined {
  const items = list.length
    ? list
    : fallback
      ? [{ id: "legacy", name: "Основной", url: fallback }]
      : [];
  const match = items.slice(1).find((b) => {
    if (b.requiresFlag && !flags[b.requiresFlag]) return false;
    if (b.atRound != null && round < b.atRound) return false;
    return Boolean(b.requiresFlag || b.atRound != null);
  });
  return match?.url || items[0]?.url || fallback;
}

function nodeOpen(
  node: ScenarioNode | undefined,
  flags: Record<string, boolean>,
  openAbilities?: Set<string>,
): boolean {
  if (!node) return true;
  const d = node.data;
  if (d.requiresFlag && !flags[d.requiresFlag]) return false;
  if (d.requiresAnyFlags?.length && !d.requiresAnyFlags.some((f) => flags[f])) return false;
  if (d.hideIfFlag && flags[d.hideIfFlag]) return false;
  if (d.requiresAbilityId && !openAbilities?.has(d.requiresAbilityId)) return false;
  return true;
}

type PreviewPopup =
  | { kind: "inspect"; title: string; body: string; image?: string }
  | {
      kind: "talk";
      name: string;
      intro?: string;
      options: { id: string; label: string; reply: string }[];
      chosen?: string;
    };

function childrenOf(doc: ScenarioDocument, locId: string) {
  const ids = new Set<string>();
  for (const e of doc.edges) {
    if (e.from === locId && (e.fromPort === "events" || e.fromPort === "out")) ids.add(e.to);
    if (e.to === locId && e.toPort === "events") ids.add(e.from);
  }
  const inspects: ScenarioNode[] = [];
  const npcs: ScenarioNode[] = [];
  const presences: ScenarioNode[] = [];
  for (const id of ids) {
    const n = doc.nodes.find((x) => x.id === id);
    if (!n) continue;
    if (n.kind === "inspect") inspects.push(n);
    if (n.kind === "npc") npcs.push(n);
    if (n.kind === "presence") presences.push(n);
  }
  return { inspects, npcs, presences };
}

function exitsOf(doc: ScenarioDocument, locId: string) {
  return doc.edges.filter((e) => {
    if (e.from !== locId) return false;
    const to = doc.nodes.find((n) => n.id === e.to);
    return to?.kind === "location";
  });
}

export function SceneEditor({
  doc,
  locationId,
  onChange,
}: {
  doc: ScenarioDocument;
  locationId: string;
  onChange: (d: ScenarioDocument) => void;
}) {
  const loc = doc.nodes.find((n) => n.id === locationId && n.kind === "location");
  const [tool, setTool] = useState<Tool>("select");
  const [mode, setMode] = useState<Mode>("edit");
  const [sel, setSel] = useState<Sel>({ kind: "room" });
  const [uploading, setUploading] = useState(false);
  const [previewFlags, setPreviewFlags] = useState<string[]>([]);
  const [previewAbilities, setPreviewAbilities] = useState<string[]>([]);
  const [flagDraft, setFlagDraft] = useState("");
  const [previewRound, setPreviewRound] = useState(1);
  const [previewSeen, setPreviewSeen] = useState<string[]>([]);
  const [previewPopup, setPreviewPopup] = useState<PreviewPopup | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; ox: number; oy: number } | null>(null);
  const resize = useRef<{
    id: string;
    corner: "nw" | "ne" | "sw" | "se";
    ax: number;
    ay: number;
    startW: number;
    startH: number;
    aspect: number;
  } | null>(null);

  useEffect(() => {
    setSel({ kind: "room" });
  }, [locationId]);

  if (!loc) return <p className="muted">Нет комнаты</p>;

  const objects = loc.data.sceneObjects ?? [];
  const backgrounds = loc.data.backgrounds ?? [];
  const previewFlagMap = Object.fromEntries(previewFlags.map((f) => [f, true]));
  const previewAbilitySet = new Set(previewAbilities);
  const loreBase = getLoreBase(doc.loreBaseId);
  const loreAbilities = loreBase
    ? loreBase.pathways.flatMap((p) =>
        p.sequences.flatMap((s) => s.abilities.map((a) => ({ id: a.id, nameRu: `${p.nameRu} · ${a.nameRu}` }))),
      )
    : [];
  const stageBg = pickStudioBackground(backgrounds, loc.data.background, previewFlagMap, previewRound);
  const { inspects, npcs, presences } = childrenOf(doc, loc.id);
  const exits = exitsOf(doc, loc.id);
  const editing = mode === "edit";

  const commit = (next: ScenarioDocument) => onChange(next);

  const patchLoc = (data: Partial<ScenarioNode["data"]>) => {
    commit({
      ...doc,
      nodes: doc.nodes.map((n) =>
        n.id === loc.id ? { ...n, data: { ...n.data, ...data } } : n,
      ),
    });
  };

  const patchNode = (id: string, data: Partial<ScenarioNode["data"]>) => {
    commit({
      ...doc,
      nodes: doc.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n)),
    });
  };

  const patchObject = (id: string, patch: Partial<SceneObject>) => {
    patchLoc({
      sceneObjects: objects.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    });
  };

  const patchEdge = (id: string, patch: Partial<ScenarioEdge>) => {
    commit({
      ...doc,
      edges: doc.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  };

  const percentAt = (e: { clientX: number; clientY: number }) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100)),
    };
  };

  const addSpark = (x: number, y: number) => {
    const child = createNode("inspect", 0, 0);
    child.data.title = "Искра";
    child.data.inspectLabel = "Осмотреть";
    child.data.inspectResult = "Вы видите…";
    child.data.once = true;
    child.data.audience = "each";
    const pin: SceneObject = {
      id: `so_${child.id}`,
      kind: "hotspot",
      label: "Искра",
      x: Math.max(0, x - 4),
      y: Math.max(0, y - 6),
      w: 8,
      h: 12,
      linkNodeId: child.id,
      interaction: "inspect",
      percent: true,
    };
    const edge: ScenarioEdge = {
      id: `e_${loc.id}_${child.id}`,
      from: loc.id,
      fromPort: "events",
      to: child.id,
      toPort: "in",
    };
    commit({
      ...doc,
      nodes: [
        ...doc.nodes.map((n) =>
          n.id === loc.id
            ? { ...n, data: { ...n.data, sceneObjects: [...objects, pin] } }
            : n,
        ),
        child,
      ],
      edges: [...doc.edges, edge],
    });
    setSel({ kind: "spark", id: pin.id });
    setTool("select");
  };

  const addItem = (x: number, y: number) => {
    const child = createNode("item", 0, 0);
    child.data.title = "Предмет";
    child.data.inspectLabel = "Подобрать";
    child.data.inspectResult = "Вы забираете вещь.";
    child.data.grantItem = {
      id: `item_${child.id}`,
      title: "Предмет",
      body: "Лежал здесь.",
    };
    const pin: SceneObject = {
      id: `so_${child.id}`,
      kind: "hotspot",
      label: "Предмет",
      x: Math.max(0, x - 4),
      y: Math.max(0, y - 6),
      w: 8,
      h: 12,
      linkNodeId: child.id,
      interaction: "inspect",
      percent: true,
    };
    const edge: ScenarioEdge = {
      id: `e_${loc.id}_${child.id}`,
      from: loc.id,
      fromPort: "events",
      to: child.id,
      toPort: "in",
    };
    commit({
      ...doc,
      nodes: [
        ...doc.nodes.map((n) =>
          n.id === loc.id
            ? { ...n, data: { ...n.data, sceneObjects: [...objects, pin] } }
            : n,
        ),
        child,
      ],
      edges: [...doc.edges, edge],
    });
    setSel({ kind: "spark", id: pin.id });
    setTool("select");
  };

  const addNpc = (x: number, y: number) => {
    const child = createNode("npc", 0, 0);
    child.data.title = "Новый персонаж";
    child.data.npcName = "Новый персонаж";
    child.data.npcIntro = "Стоит здесь.";
    child.data.talkOptions = [
      { id: `line_${Math.random().toString(36).slice(2, 7)}`, label: "Поговорить", reply: "…", once: true },
    ];
    const pin: SceneObject = {
      id: `so_${child.id}`,
      kind: "npc",
      label: child.data.npcName,
      x: Math.max(0, x - 8),
      y: Math.max(0, y - 26),
      w: 16,
      h: 52,
      linkNodeId: child.id,
      interaction: "talk",
      percent: true,
      locked: true,
    };
    const edge: ScenarioEdge = {
      id: `e_${loc.id}_${child.id}`,
      from: loc.id,
      fromPort: "events",
      to: child.id,
      toPort: "in",
    };
    commit({
      ...doc,
      nodes: [
        ...doc.nodes.map((n) =>
          n.id === loc.id
            ? { ...n, data: { ...n.data, sceneObjects: [...objects, pin] } }
            : n,
        ),
        child,
      ],
      edges: [...doc.edges, edge],
    });
    setSel({ kind: "npc", id: pin.id });
    setTool("select");
  };

  const addPresence = () => {
    const child = createNode("presence", 0, 0);
    child.data.title = "Невидимый след";
    child.data.body = "Кто-то был здесь.";
    child.data.trigger = "enter";
    child.data.once = true;
    const edge: ScenarioEdge = {
      id: `e_${loc.id}_${child.id}`,
      from: loc.id,
      fromPort: "events",
      to: child.id,
      toPort: "in",
    };
    commit({ ...doc, nodes: [...doc.nodes, child], edges: [...doc.edges, edge] });
    setSel({ kind: "presence", id: child.id });
  };

  const placeExisting = (node: ScenarioNode) => {
    const pin: SceneObject = {
      id: `so_${node.id}`,
      kind: node.kind === "npc" ? "npc" : "hotspot",
      label: node.data.npcName || node.data.inspectLabel || node.data.title,
      url: node.data.portraitUrl || node.data.imageUrl,
      x: 40,
      y: 40,
      w: node.kind === "npc" ? 16 : 8,
      h: node.kind === "npc" ? 52 : 12,
      linkNodeId: node.id,
      interaction: node.kind === "npc" ? "talk" : "inspect",
      percent: true,
      locked: node.kind === "npc",
    };
    patchLoc({ sceneObjects: [...objects, pin] });
    setSel({ kind: node.kind === "npc" ? "npc" : "spark", id: pin.id });
  };

  const removeSelected = () => {
    if (sel.kind !== "spark" && sel.kind !== "npc") return;
    const pin = objects.find((o) => o.id === sel.id);
    if (!pin) return;
    const linked = pin.linkNodeId;
    commit({
      ...doc,
      nodes: doc.nodes
        .filter((n) => n.id !== linked)
        .map((n) =>
          n.id === loc.id
            ? { ...n, data: { ...n.data, sceneObjects: objects.filter((o) => o.id !== pin.id) } }
            : n,
        ),
      edges: doc.edges.filter((e) => e.from !== linked && e.to !== linked),
    });
    setSel({ kind: "room" });
  };

  const onStageDown = (e: RE) => {
    if (e.target !== stageRef.current) return;
    if (!editing) return;
    const p = percentAt(e);
    if (!p) return;
    if (tool === "spark") addSpark(p.x, p.y);
    else if (tool === "item") addItem(p.x, p.y);
    else if (tool === "npc") addNpc(p.x, p.y);
    else setSel({ kind: "room" });
  };

  const onPinDown = (e: RE, o: SceneObject) => {
    if (!editing) return;
    e.stopPropagation();
    setSel({ kind: o.kind === "npc" || o.interaction === "talk" ? "npc" : "spark", id: o.id });
    if (o.locked) return;
    const p = percentAt(e);
    if (!p) return;
    drag.current = { id: o.id, ox: p.x - o.x, oy: p.y - o.y };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onMove = (e: RE) => {
    const p = percentAt(e);
    if (!p) return;
    if (resize.current) {
      const r = resize.current;
      const rawW = Math.max(4, Math.abs(p.x - r.ax));
      const rawH = Math.max(4, Math.abs(p.y - r.ay));
      const scale = Math.max(rawW / r.startW, rawH / r.startH, 0.25);
      const w = Math.min(90, Math.max(6, r.startW * scale));
      const h = Math.min(90, Math.max(6, w / r.aspect));
      const x = r.corner.includes("e") ? r.ax : r.ax - w;
      const y = r.corner.includes("s") ? r.ay : r.ay - h;
      patchObject(r.id, {
        x: Math.max(0, Math.min(100 - w, x)),
        y: Math.max(0, Math.min(100 - h, y)),
        w,
        h,
      });
      return;
    }
    if (!drag.current) return;
    const d = drag.current;
    patchObject(d.id, {
      x: Math.min(96, Math.max(0, p.x - d.ox)),
      y: Math.min(96, Math.max(0, p.y - d.oy)),
    });
  };

  const onUp = () => {
    const moved = drag.current ?? resize.current;
    drag.current = null;
    resize.current = null;
    if (!moved) return;
    const pin = objects.find((o) => o.id === moved.id);
    if (pin && (pin.kind === "npc" || pin.interaction === "talk") && !pin.locked) {
      patchObject(pin.id, { locked: true });
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "v" || e.key === "V") setTool("select");
      if (e.key === "s" || e.key === "S") setTool("spark");
      if (e.key === "n" || e.key === "N") setTool("npc");
      if (e.key === "Escape") setSel({ kind: "room" });
      if (e.key === "Delete" || e.key === "Backspace") removeSelected();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const uploadTo = async (
    file: File | undefined,
    apply: (url: string, assetId: string) => void,
    category: "background" | "npc" | "item" = "item",
  ) => {
    if (!file?.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const meta = await addAssetFromFile(file, { category });
      const url = await resolveAssetUrl(meta);
      if (url) apply(url, meta.id);
    } finally {
      setUploading(false);
    }
  };

  const selectedPin =
    sel.kind === "spark" || sel.kind === "npc" ? objects.find((o) => o.id === sel.id) : undefined;
  const selectedNode = selectedPin?.linkNodeId
    ? doc.nodes.find((n) => n.id === selectedPin.linkNodeId)
    : undefined;
  const selectedExit = sel.kind === "exit" ? doc.edges.find((e) => e.id === sel.id) : undefined;

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0, gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <ToolButton active={tool === "select"} onClick={() => setTool("select")}>Выделение</ToolButton>
          <ToolButton active={tool === "spark"} onClick={() => setTool("spark")}>Искра</ToolButton>
          <ToolButton active={tool === "item"} onClick={() => setTool("item")}>Предмет</ToolButton>
          <ToolButton active={tool === "npc"} onClick={() => setTool("npc")}>NPC</ToolButton>
          <button type="button" className="btn" style={{ height: 32, fontSize: 12 }} onClick={addPresence}>
            Присутствие
          </button>
          <label className="btn" style={{ height: 32, fontSize: 12, cursor: "pointer" }}>
            {uploading ? "…" : "Фон"}
            <input
              hidden
              type="file"
              accept="image/*"
              onChange={(e) => {
                void uploadTo(
                  e.target.files?.[0],
                  (url) => {
                    const next = [
                      ...(loc.data.backgrounds ?? []),
                      {
                        id: `bg_${Math.random().toString(36).slice(2, 7)}`,
                        name: loc.data.backgrounds?.length ? `Фон ${loc.data.backgrounds.length + 1}` : "Основной",
                        url,
                      },
                    ];
                    patchLoc({ backgrounds: next, background: next[0].url });
                  },
                  "background",
                );
                e.target.value = "";
              }}
            />
          </label>
          <span style={{ flex: 1 }} />
          <ToolButton active={mode === "edit"} onClick={() => { setMode("edit"); setPreviewPopup(null); }}>Правка</ToolButton>
          <ToolButton active={mode === "play"} onClick={() => setMode("play")}>Превью</ToolButton>
        </div>

        <div
          ref={stageRef}
          onPointerDown={onStageDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 9",
            maxHeight: "100%",
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid var(--line)",
            background: stageBg
              ? `#14110e center / cover no-repeat url(${stageBg})`
              : "#14110e",
            cursor: tool === "spark" || tool === "item" || tool === "npc" ? "crosshair" : "default",
          }}
        >
          {stageBg ? (
            <img
              src={stageBg}
              alt=""
              draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
              <span className="muted">Загрузите фон</span>
            </div>
          )}
          {objects.map((o) => {
            const linked = selectedNodeOf(doc, o);
            const open = nodeOpen(linked, previewFlagMap, previewAbilitySet);
            const spent = linked ? previewSeen.includes(linked.id) && linked.data.once !== false : false;
            if (!editing && (!open || spent)) return null;
            const isNpc = o.kind === "npc" || o.interaction === "talk";
            const active = selectedPin?.id === o.id;
            const onPlayClick = (e: RE) => {
              if (editing) return;
              e.stopPropagation();
              if (!linked) return;
              if (linked.kind === "inspect") {
                setPreviewPopup({
                  kind: "inspect",
                  title: linked.data.inspectLabel || linked.data.title,
                  body: linked.data.inspectResult || "…",
                  image: linked.data.imageUrl,
                });
                if (linked.data.once !== false) {
                  setPreviewSeen((s) => (s.includes(linked.id) ? s : [...s, linked.id]));
                }
              } else {
                const options = (linked.data.talkOptions ?? [])
                  .filter((line) => {
                    if (line.requiresFlag && !previewFlagMap[line.requiresFlag]) return false;
                    if (line.hideIfFlag && previewFlagMap[line.hideIfFlag]) return false;
                    return true;
                  })
                  .map((line) => ({ id: line.id, label: line.label, reply: line.reply }));
                setPreviewPopup({
                  kind: "talk",
                  name: linked.data.npcName || linked.data.title,
                  intro: linked.data.npcIntro,
                  options,
                });
              }
            };
            if (isNpc) {
              return (
                <button
                  key={o.id}
                  type="button"
                  onPointerDown={(e) => (editing ? onPinDown(e, o) : onPlayClick(e))}
                  style={{
                    position: "absolute",
                    left: `${o.x}%`,
                    top: `${o.y}%`,
                    width: `${o.w}%`,
                    height: `${o.h}%`,
                    padding: 0,
                    border: editing && active ? "1px dashed var(--brass)" : "none",
                    background: "transparent",
                    cursor: editing ? "move" : "pointer",
                  }}
                >
                  {o.url || selectedNodeOf(doc, o)?.data.portraitUrl ? (
                    <img
                      src={o.url || selectedNodeOf(doc, o)?.data.portraitUrl}
                      alt=""
                      draggable={false}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        objectPosition: "center bottom",
                        pointerEvents: "none",
                        filter: "drop-shadow(0 10px 8px rgba(0,0,0,0.55)) drop-shadow(0 2px 2px rgba(0,0,0,0.4))",
                      }}
                    />
                  ) : (
                    <span className="spark spark-npc" style={{ pointerEvents: "none" }} />
                  )}
                  {editing ? (
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        fontSize: 10,
                        color: "var(--paper)",
                        background: "rgba(12,11,10,0.7)",
                        pointerEvents: "none",
                      }}
                    >
                      {o.label}
                    </span>
                  ) : null}
                  {editing && active ? (
                    <>
                      {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                        <span
                          key={corner}
                          onPointerDown={(e) => {
                            if (o.locked) return;
                            e.stopPropagation();
                            const p = percentAt(e);
                            if (!p) return;
                            const ax = corner.includes("w") ? o.x + o.w : o.x;
                            const ay = corner.includes("n") ? o.y + o.h : o.y;
                            resize.current = {
                              id: o.id,
                              corner,
                              ax,
                              ay,
                              startW: Math.max(o.w, 1),
                              startH: Math.max(o.h, 1),
                              aspect: Math.max(o.w, 1) / Math.max(o.h, 1),
                            };
                            (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
                          }}
                          style={{
                            position: "absolute",
                            width: 12,
                            height: 12,
                            borderRadius: 2,
                            background: "var(--brass)",
                            cursor: corner === "nw" || corner === "se" ? "nwse-resize" : "nesw-resize",
                            ...(corner.includes("n") ? { top: -4 } : { bottom: -4 }),
                            ...(corner.includes("w") ? { left: -4 } : { right: -4 }),
                          }}
                        />
                      ))}
                    </>
                  ) : null}
                </button>
              );
            }
            const cx = o.x + o.w / 2;
            const cy = o.y + o.h / 2;
            return (
              <button
                key={o.id}
                type="button"
                aria-label={o.label}
                onPointerDown={(e) => (editing ? onPinDown(e, o) : onPlayClick(e))}
                style={{
                  position: "absolute",
                  left: `${cx}%`,
                  top: `${cy}%`,
                  width: 56,
                  height: 56,
                  transform: "translate(-50%, -50%)",
                  padding: 0,
                  border: "none",
                  background: "transparent",
                  display: "grid",
                  placeItems: "center",
                  cursor: editing ? "move" : "pointer",
                }}
              >
                <span className="spark" />
                {editing ? (
                  <span
                    style={{
                      position: "absolute",
                      top: "100%",
                      fontSize: 10,
                      color: "var(--paper)",
                      whiteSpace: "nowrap",
                      background: "rgba(12,11,10,0.75)",
                      borderRadius: 4,
                      padding: "1px 4px",
                      pointerEvents: "none",
                    }}
                  >
                    {o.label}
                  </span>
                ) : null}
                {editing && active ? (
                  <span
                    style={{
                      position: "absolute",
                      inset: 8,
                      border: "1px dashed var(--brass)",
                      borderRadius: 99,
                      pointerEvents: "none",
                    }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        {!editing ? (
          <div className="card" style={{ display: "grid", gap: 8, padding: 10 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span className="brass" style={{ fontSize: 11 }}>Флаги</span>
              {previewFlags.map((f) => (
                <button
                  key={f}
                  type="button"
                  className="btn"
                  style={{ height: 26, fontSize: 11 }}
                  onClick={() => setPreviewFlags((list) => list.filter((x) => x !== f))}
                >
                  {f} ×
                </button>
              ))}
              <input
                value={flagDraft}
                placeholder="флаг и Enter"
                onChange={(e) => setFlagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  const v = flagDraft.trim();
                  if (!v) return;
                  setPreviewFlags((list) => (list.includes(v) ? list : [...list, v]));
                  setFlagDraft("");
                }}
                style={{ ...field, width: 140, marginTop: 0 }}
              />
              <label className="muted" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                Ход
                <input
                  type="number"
                  min={1}
                  value={previewRound}
                  onChange={(e) => setPreviewRound(Math.max(1, Number(e.target.value) || 1))}
                  style={{ ...field, width: 64, marginTop: 0 }}
                />
              </label>
              <button
                type="button"
                className="btn"
                style={{ height: 28, fontSize: 11 }}
                onClick={() => {
                  setPreviewFlags([]);
                  setPreviewAbilities([]);
                  setPreviewSeen([]);
                  setPreviewPopup(null);
                  setPreviewRound(1);
                }}
              >
                Сбросить
              </button>
            </div>
            {loreAbilities.length > 0 ? (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <span className="brass" style={{ fontSize: 11 }}>Способности</span>
                {loreAbilities.map((a) => {
                  const on = previewAbilities.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      className="btn"
                      style={{ height: 26, fontSize: 11, borderColor: on ? "var(--brass)" : undefined }}
                      onClick={() =>
                        setPreviewAbilities((list) =>
                          on ? list.filter((x) => x !== a.id) : [...list, a.id],
                        )
                      }
                    >
                      {on ? "✓ " : ""}{a.nameRu}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <p className="faint" style={{ fontSize: 11, margin: 0 }}>
              Клик по искре открывает окно игрока. В партию ничего не пишется.
              {objects.some((o) => {
                const n = selectedNodeOf(doc, o);
                return n && !nodeOpen(n, previewFlagMap, previewAbilitySet);
              })
                ? ` Скрыто: ${objects
                    .filter((o) => {
                      const n = selectedNodeOf(doc, o);
                      return n && !nodeOpen(n, previewFlagMap, previewAbilitySet);
                    })
                    .map((o) => o.label)
                    .join(", ")}.`
                : ""}
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {exits
                .filter((e) => {
                  if (e.requiresFlag && !previewFlagMap[e.requiresFlag]) return false;
                  if (e.hideIfFlag && previewFlagMap[e.hideIfFlag]) return false;
                  return true;
                })
                .map((e) => {
                  const to = doc.nodes.find((n) => n.id === e.to);
                  return (
                    <span key={e.id} className="btn" style={{ height: 26, fontSize: 11 }}>
                      {e.label || to?.data.title || "Выход"}
                    </span>
                  );
                })}
            </div>
          </div>
        ) : null}

        {previewPopup ? (
          <div className="card" style={{ display: "grid", gap: 8, padding: 12 }}>
            {previewPopup.kind === "inspect" ? (
              <>
                <strong style={{ color: "var(--paper)" }}>{previewPopup.title}</strong>
                {previewPopup.image ? (
                  <img src={previewPopup.image} alt="" style={{ maxWidth: 240, borderRadius: 8 }} />
                ) : null}
                <p style={{ margin: 0, color: "var(--paper)", fontSize: 14 }}>{previewPopup.body}</p>
              </>
            ) : (
              <>
                <strong style={{ color: "var(--paper)" }}>{previewPopup.name}</strong>
                {previewPopup.intro ? <p className="muted" style={{ margin: 0 }}>{previewPopup.intro}</p> : null}
                {previewPopup.chosen ? (
                  <p style={{ margin: 0, color: "var(--paper)" }}>{previewPopup.chosen}</p>
                ) : (
                  previewPopup.options.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className="btn"
                      onClick={() => setPreviewPopup({ ...previewPopup, chosen: o.reply })}
                    >
                      {o.label}
                    </button>
                  ))
                )}
              </>
            )}
            <button type="button" className="btn" style={{ height: 28, fontSize: 11 }} onClick={() => setPreviewPopup(null)}>
              Закрыть
            </button>
          </div>
        ) : null}

        <p className="faint" style={{ fontSize: 11, margin: 0 }}>
          {tool === "spark"
            ? "Клик по фону ставит искру."
            : tool === "npc"
              ? "Клик по фону ставит персонажа."
              : "Тяните искру или персонажа. V выбор, S искра, N персонаж, Del удалить."}
        </p>
      </div>

      <aside
        style={{
          width: 320,
          flex: "0 0 320px",
          overflow: "auto",
          borderLeft: "1px solid var(--line)",
          padding: "4px 12px 24px",
        }}
      >
        <p className="brass" style={{ fontSize: 11, letterSpacing: "0.14em" }}>АКТИВНОСТИ</p>
        <Group label="Комната">
          <Row active={sel.kind === "room"} onClick={() => setSel({ kind: "room" })}>
            {loc.data.title || "Комната"}
          </Row>
        </Group>
        <Group label="Фоны">
          {(backgrounds.length ? backgrounds : loc.data.background ? [{ id: "legacy", name: "Основной", url: loc.data.background }] : []).map((b, i) => (
            <Row key={b.id} active={false} onClick={() => setSel({ kind: "room" })}>
              {b.name || `Фон ${i + 1}`}{i === 0 || b.id === "legacy" ? " · основной" : b.requiresFlag ? ` · ${b.requiresFlag}` : ""}
            </Row>
          ))}
        </Group>
        <Group label="Искры">
          {objects
            .filter((o) => o.interaction !== "talk" && o.kind !== "npc")
            .map((o) => (
              <Row key={o.id} active={sel.kind === "spark" && sel.id === o.id} onClick={() => setSel({ kind: "spark", id: o.id })}>
                {o.label || "Искра"}
              </Row>
            ))}
          {inspects
            .filter((n) => !objects.some((o) => o.linkNodeId === n.id))
            .map((n) => (
              <Row key={n.id} onClick={() => placeExisting(n)}>
                {n.data.inspectLabel || n.data.title} · поставить
              </Row>
            ))}
        </Group>
        <Group label="NPC">
          {objects
            .filter((o) => o.kind === "npc" || o.interaction === "talk")
            .map((o) => (
              <Row key={o.id} active={sel.kind === "npc" && sel.id === o.id} onClick={() => setSel({ kind: "npc", id: o.id })}>
                {o.label || "NPC"}
              </Row>
            ))}
          {npcs
            .filter((n) => !objects.some((o) => o.linkNodeId === n.id))
            .map((n) => (
              <Row key={n.id} onClick={() => placeExisting(n)}>
                {n.data.npcName || n.data.title} · поставить
              </Row>
            ))}
        </Group>
        <Group label="Присутствия">
          {presences.map((n) => (
            <Row key={n.id} active={sel.kind === "presence" && sel.id === n.id} onClick={() => setSel({ kind: "presence", id: n.id })}>
              {n.data.title || "След"} · {n.data.trigger === "round" ? "ход" : "вход"}
            </Row>
          ))}
          {presences.length === 0 ? <p className="faint" style={{ fontSize: 12 }}>Нет. Кнопка «Присутствие».</p> : null}
        </Group>
        <Group label="Выходы">
          {exits.map((e) => {
            const to = doc.nodes.find((n) => n.id === e.to);
            return (
              <Row key={e.id} active={sel.kind === "exit" && sel.id === e.id} onClick={() => setSel({ kind: "exit", id: e.id })}>
                {e.label || to?.data.title || "Выход"}
              </Row>
            );
          })}
          {exits.length === 0 ? <p className="faint" style={{ fontSize: 12 }}>Нет. Связь комнат — на доске.</p> : null}
        </Group>

        <div style={{ marginTop: 16 }}>
          {sel.kind === "room" ? (
            <RoomInspector
              loc={loc}
              onPatch={patchLoc}
              uploading={uploading}
              uploadTo={uploadTo}
            />
          ) : null}
          {selectedNode && selectedPin && (selectedNode.kind === "inspect" || selectedNode.kind === "item") ? (
            <SparkInspector
              node={selectedNode}
              pin={selectedPin}
              abilities={loreAbilities}
              onNode={(d) => patchNode(selectedNode.id, d)}
              onPin={(d) => patchObject(selectedPin.id, d)}
              onDelete={removeSelected}
              uploadTo={uploadTo}
            />
          ) : null}
          {selectedNode?.kind === "npc" && selectedPin ? (
            <NpcInspector
              node={selectedNode}
              pin={selectedPin}
              abilities={loreAbilities}
              base={loreBase}
              onNode={(d) => patchNode(selectedNode.id, d)}
              onPin={(d) => patchObject(selectedPin.id, d)}
              onDelete={removeSelected}
              uploadTo={uploadTo}
            />
          ) : null}
          {selectedExit ? (
            <ExitInspector
              edge={selectedExit}
              rooms={doc.nodes.filter((n) => n.kind === "location" && n.id !== loc.id)}
              onPatch={(d) => patchEdge(selectedExit.id, d)}
            />
          ) : null}
          {sel.kind === "presence" ? (
            <PresenceInspector
              node={doc.nodes.find((n) => n.id === sel.id)}
              abilities={loreAbilities}
              base={loreBase}
              onNode={(d) => patchNode(sel.id, d)}
              onDelete={() => {
                commit({
                  ...doc,
                  nodes: doc.nodes.filter((n) => n.id !== sel.id),
                  edges: doc.edges.filter((e) => e.from !== sel.id && e.to !== sel.id),
                });
                setSel({ kind: "room" });
              }}
            />
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function selectedNodeOf(doc: ScenarioDocument, o: SceneObject) {
  return o.linkNodeId ? doc.nodes.find((n) => n.id === o.linkNodeId) : undefined;
}

function ToolButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      className="btn"
      onClick={onClick}
      style={{
        height: 32,
        fontSize: 12,
        borderColor: active ? "var(--brass)" : undefined,
        color: active ? "var(--brass)" : undefined,
      }}
    >
      {children}
    </button>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginTop: 10 }}>
      <p className="faint" style={{ fontSize: 10, letterSpacing: "0.12em", margin: "0 0 4px" }}>{label.toUpperCase()}</p>
      {children}
    </div>
  );
}

function Row({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        marginTop: 4,
        padding: "6px 8px",
        borderRadius: 8,
        border: `1px solid ${active ? "var(--brass)" : "var(--line)"}`,
        background: active ? "#2a2218" : "transparent",
        color: "var(--paper)",
        fontSize: 13,
      }}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginTop: 12 }}>
      <p className="brass" style={{ fontSize: 11, margin: "0 0 6px" }}>{title}</p>
      {children}
    </div>
  );
}

function RoomInspector({
  loc,
  onPatch,
  uploading,
  uploadTo,
}: {
  loc: ScenarioNode;
  onPatch: (d: Partial<ScenarioNode["data"]>) => void;
  uploading: boolean;
  uploadTo: (file: File | undefined, apply: (url: string, assetId: string) => void, category?: "background" | "npc" | "item") => Promise<void>;
}) {
  const list = loc.data.backgrounds ?? [];
  const setList = (backgrounds: SceneBackground[], background?: string) => {
    onPatch({
      backgrounds,
      background: background ?? backgrounds[0]?.url ?? loc.data.background,
    });
  };
  const addBg = (url: string) => {
    const next: SceneBackground = {
      id: `bg_${Math.random().toString(36).slice(2, 7)}`,
      name: list.length ? `Фон ${list.length + 1}` : "Основной",
      url,
    };
    const backgrounds = list.length ? [...list, next] : [{ ...next, name: "Основной" }];
    if (!list.length && loc.data.background && loc.data.background !== url) {
      backgrounds.unshift({ id: "bg_legacy", name: "Основной", url: loc.data.background });
      backgrounds[1].name = "Новый";
    }
    setList(backgrounds);
  };
  return (
    <div>
      <h3 style={{ color: "var(--paper)", margin: "8px 0" }}>Комната</h3>
      <label className="muted" style={{ fontSize: 11 }}>
        Название
        <input value={loc.data.title} onChange={(e) => onPatch({ title: e.target.value })} style={field} />
      </label>
      <label className="muted" style={{ fontSize: 11, display: "block", marginTop: 8 }}>
        Описание для игрока
        <textarea
          value={loc.data.description ?? ""}
          rows={3}
          onChange={(e) => onPatch({ description: e.target.value })}
          style={{ ...field, resize: "vertical" }}
        />
      </label>
      <Section title="Фоны">
        <p className="faint" style={{ fontSize: 11, margin: "0 0 6px" }}>
          Первый — основной. Следующие сменяют его, когда флаг уже есть.
        </p>
        {list.map((b, i) => (
          <div key={b.id} className="card" style={{ display: "grid", gap: 6, marginTop: 6 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <img src={b.url} alt="" style={{ width: 72, height: 40, objectFit: "cover", borderRadius: 6 }} />
              <input
                value={b.name}
                onChange={(e) =>
                  setList(list.map((x) => (x.id === b.id ? { ...x, name: e.target.value } : x)))
                }
                style={{ ...field, marginTop: 0 }}
              />
            </div>
            {i > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 6 }}>
                <input
                  value={b.requiresFlag ?? ""}
                  placeholder="Флаг"
                  onChange={(e) =>
                    setList(
                      list.map((x) =>
                        x.id === b.id ? { ...x, requiresFlag: e.target.value.trim() || undefined } : x,
                      ),
                    )
                  }
                  style={{ ...field, marginTop: 0 }}
                />
                <input
                  type="number"
                  value={b.atRound ?? ""}
                  placeholder="Ход"
                  onChange={(e) =>
                    setList(
                      list.map((x) =>
                        x.id === b.id
                          ? { ...x, atRound: e.target.value ? Number(e.target.value) : undefined }
                          : x,
                      ),
                    )
                  }
                  style={{ ...field, marginTop: 0 }}
                />
              </div>
            ) : (
              <span className="faint" style={{ fontSize: 11 }}>основной, без условия</span>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              {i > 0 ? (
                <button
                  type="button"
                  className="btn"
                  style={{ height: 28, fontSize: 11 }}
                  onClick={() => {
                    const next = [b, ...list.filter((x) => x.id !== b.id)].map((x, idx) =>
                      idx === 0 ? { ...x, requiresFlag: undefined, atRound: undefined } : x,
                    );
                    setList(next, b.url);
                  }}
                >
                  Сделать основным
                </button>
              ) : null}
              <button
                type="button"
                className="btn"
                style={{ height: 28, fontSize: 11, color: "var(--danger)" }}
                onClick={() => setList(list.filter((x) => x.id !== b.id))}
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
        <label className="btn" style={{ height: 32, fontSize: 12, cursor: "pointer", marginTop: 8 }}>
          {uploading ? "Загрузка…" : "Загрузить фон"}
          <input
            hidden
            type="file"
            accept="image/*"
            onChange={(e) => {
              void uploadTo(e.target.files?.[0], addBg, "background");
              e.target.value = "";
            }}
          />
        </label>
      </Section>
    </div>
  );
}

function SparkInspector({
  node,
  pin,
  abilities,
  onNode,
  onPin,
  onDelete,
  uploadTo,
}: {
  node: ScenarioNode;
  pin: SceneObject;
  abilities: { id: string; nameRu: string }[];
  onNode: (d: Partial<ScenarioNode["data"]>) => void;
  onPin: (d: Partial<SceneObject>) => void;
  onDelete: () => void;
  uploadTo: (file: File | undefined, apply: (url: string, assetId: string) => void, category?: "background" | "npc" | "item") => Promise<void>;
}) {
  const d = node.data;
  return (
    <div>
      <h3 style={{ color: "var(--paper)", margin: "8px 0" }}>Искра · {pin.label}</h3>
      <Section title="Что видит игрок">
        <input
          value={d.inspectLabel ?? ""}
          placeholder="Имя"
          onChange={(e) => {
            onNode({ inspectLabel: e.target.value, title: e.target.value });
            onPin({ label: e.target.value });
          }}
          style={field}
        />
        <textarea
          value={d.inspectResult ?? ""}
          rows={3}
          placeholder="Текст окна"
          onChange={(e) => onNode({ inspectResult: e.target.value })}
          style={{ ...field, resize: "vertical" }}
        />
        <label className="btn" style={{ height: 32, fontSize: 12, marginTop: 8, cursor: "pointer" }}>
          Картинка окна
          <input
            hidden
            type="file"
            accept="image/*"
            onChange={(e) => {
              void uploadTo(e.target.files?.[0], (url) => onNode({ imageUrl: url }), "item");
              e.target.value = "";
            }}
          />
        </label>
      </Section>
      <Section title="Кто может">
        <select
          value={d.audience === "world" ? "world" : "each"}
          onChange={(e) => onNode({ audience: e.target.value === "world" ? "world" : "each" })}
          style={field}
        >
          <option value="each">Каждый сам</option>
          <option value="world">Один забирает у всех</option>
        </select>
        <label className="muted" style={{ fontSize: 12, display: "block", marginTop: 6 }}>
          <input
            type="checkbox"
            checked={d.once !== false}
            onChange={(e) => onNode({ once: e.target.checked })}
          />{" "}
          Один раз
        </label>
      </Section>
      <Section title="Что даёт">
        <input
          value={d.grantItem?.title ?? ""}
          placeholder="Предмет в инвентарь (пусто = нет)"
          onChange={(e) =>
            onNode({
              grantItem: e.target.value.trim()
                ? {
                    id: d.grantItem?.id || `item_${node.id}`,
                    title: e.target.value.trim(),
                    body: d.inspectResult || "",
                    imageUrl: d.imageUrl,
                    abilityId: d.grantItem?.abilityId,
                  }
                : undefined,
              audience: e.target.value.trim() ? "world" : d.audience,
            })
          }
          style={field}
        />
        {d.grantItem && abilities.length > 0 ? (
          <select
            value={d.grantItem.abilityId ?? ""}
            onChange={(e) =>
              onNode({
                grantItem: { ...d.grantItem!, abilityId: e.target.value || undefined },
              })
            }
            style={field}
          >
            <option value="">Предмет без способности</option>
            {abilities.map((a) => (
              <option key={a.id} value={a.id}>{a.nameRu}</option>
            ))}
          </select>
        ) : null}
        <input
          value={d.grantState?.title ?? ""}
          placeholder="Статус на персонажа (пусто = нет)"
          onChange={(e) =>
            onNode({
              grantState: e.target.value.trim()
                ? {
                    id: d.grantState?.id || `state_${node.id}`,
                    title: e.target.value.trim(),
                    body: d.grantState?.body || d.inspectResult || "",
                    kind: d.grantState?.kind,
                    blocks: d.grantState?.blocks,
                  }
                : undefined,
            })
          }
          style={field}
        />
        {d.grantState ? (
          <>
            <select
              value={d.grantState.kind ?? "mark"}
              onChange={(e) =>
                onNode({
                  grantState: {
                    ...d.grantState!,
                    kind: e.target.value as "mark" | "blessing" | "curse" | "restraint",
                  },
                })
              }
              style={field}
            >
              <option value="mark">Пометка</option>
              <option value="blessing">Благословение</option>
              <option value="curse">Проклятие</option>
              <option value="restraint">Оковы</option>
            </select>
            <input
              value={(d.grantState.blocks ?? []).join(", ")}
              placeholder="Закрывает: move, talk, inspect, ability"
              onChange={(e) =>
                onNode({
                  grantState: {
                    ...d.grantState!,
                    blocks: e.target.value
                      .split(/[,;]/)
                      .map((s) => s.trim())
                      .filter((s): s is "move" | "talk" | "inspect" | "ability" =>
                        s === "move" || s === "talk" || s === "inspect" || s === "ability",
                      ),
                  },
                })
              }
              style={field}
            />
          </>
        ) : null}
      </Section>
      <Section title="Когда видно / что ставит">
        {abilities.length > 0 ? (
          <label className="muted" style={{ fontSize: 11, display: "block" }}>
            Нужна способность
            <select
              value={d.requiresAbilityId ?? ""}
              onChange={(e) => onNode({ requiresAbilityId: e.target.value || undefined })}
              style={field}
            >
              <option value="">— не нужна —</option>
              {abilities.map((a) => (
                <option key={a.id} value={a.id}>{a.nameRu}</option>
              ))}
            </select>
          </label>
        ) : null}
        <input
          value={d.requiresFlag ?? ""}
          placeholder="Нужен флаг"
          onChange={(e) => onNode({ requiresFlag: e.target.value.trim() || undefined })}
          style={field}
        />
        <input
          value={(d.setFlags ?? []).join(", ")}
          placeholder="Поставить флаги через запятую"
          onChange={(e) =>
            onNode({
              setFlags: e.target.value.split(/[,;]/).map((s) => s.trim()).filter(Boolean),
            })
          }
          style={field}
        />
      </Section>
      <button type="button" className="btn" style={{ marginTop: 12, color: "var(--danger)" }} onClick={onDelete}>
        Удалить искру
      </button>
    </div>
  );
}

function NpcInspector({
  node,
  pin,
  abilities,
  base,
  onNode,
  onPin,
  onDelete,
  uploadTo,
}: {
  node: ScenarioNode;
  pin: SceneObject;
  abilities: { id: string; nameRu: string }[];
  base: ReturnType<typeof getLoreBase>;
  onNode: (d: Partial<ScenarioNode["data"]>) => void;
  onPin: (d: Partial<SceneObject>) => void;
  onDelete: () => void;
  uploadTo: (file: File | undefined, apply: (url: string, assetId: string) => void, category?: "background" | "npc" | "item") => Promise<void>;
}) {
  const d = node.data;
  const lines = d.talkOptions ?? [];
  const patchLine = (id: string, p: Partial<ScenarioTalkOption>) => {
    onNode({ talkOptions: lines.map((l) => (l.id === id ? { ...l, ...p } : l)) });
  };
  return (
    <div>
      <h3 style={{ color: "var(--paper)", margin: "8px 0" }}>NPC · {d.npcName || pin.label}</h3>
      <Section title="Кто это">
        <input
          value={d.npcName ?? ""}
          placeholder="Имя"
          onChange={(e) => {
            onNode({ npcName: e.target.value, title: e.target.value });
            onPin({ label: e.target.value });
          }}
          style={field}
        />
        <textarea
          value={d.npcIntro ?? ""}
          rows={2}
          placeholder="Представление"
          onChange={(e) => onNode({ npcIntro: e.target.value })}
          style={{ ...field, resize: "vertical" }}
        />
        <label className="btn" style={{ height: 32, fontSize: 12, marginTop: 8, cursor: "pointer" }}>
          Портрет
          <input
            hidden
            type="file"
            accept="image/*"
            onChange={(e) => {
              void uploadTo(
                e.target.files?.[0],
                (url) => {
                  onNode({ portraitUrl: url });
                  onPin({ url });
                },
                "npc",
              );
              e.target.value = "";
            }}
          />
        </label>
      </Section>
      <Section title="Постановка">
        <label className="muted" style={{ fontSize: 12, display: "block" }}>
          <input
            type="checkbox"
            checked={Boolean(pin.locked)}
            onChange={(e) => onPin({ locked: e.target.checked })}
          />{" "}
          Зафиксировать размер и место
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
          {(["x", "y", "w", "h"] as const).map((key) => (
            <label key={key} className="muted" style={{ fontSize: 11 }}>
              {key.toUpperCase()}
              <input
                type="number"
                value={Math.round(pin[key] * 10) / 10}
                disabled={Boolean(pin.locked)}
                onChange={(e) => onPin({ [key]: Number(e.target.value) })}
                style={field}
              />
            </label>
          ))}
        </div>
      </Section>
      {base ? (
        <Section title="Путь и зелье">
          <select
            value={d.lore?.pathwayId ?? ""}
            onChange={(e) => {
              const pathwayId = e.target.value;
              if (!pathwayId) {
                onNode({ lore: undefined });
                return;
              }
              onNode({
                lore: {
                  baseId: base.id,
                  pathwayId,
                  sequenceRank: 9,
                  enabledAbilityIds: abilitiesForSequence(base, pathwayId, 9).map((a) => a.id),
                },
              });
            }}
            style={field}
          >
            <option value="">— без пути —</option>
            {base.pathways.map((p) => (
              <option key={p.id} value={p.id}>{p.nameRu}</option>
            ))}
          </select>
          {d.lore?.pathwayId ? (
            <select
              value={d.lore.sequenceRank}
              onChange={(e) => {
                const rank = Number(e.target.value) as 9 | 8 | 7 | 6 | 5 | 4;
                onNode({
                  lore: {
                    ...d.lore!,
                    sequenceRank: rank,
                    enabledAbilityIds: abilitiesForSequence(base, d.lore!.pathwayId, rank).map((a) => a.id),
                  },
                });
              }}
              style={field}
            >
              {[9, 8, 7, 6, 5, 4].map((r) => (
                <option key={r} value={r}>C{r}</option>
              ))}
            </select>
          ) : null}
          <label className="muted" style={{ fontSize: 12, display: "block", marginTop: 6 }}>
            <input
              type="checkbox"
              checked={Boolean(d.showPathway)}
              onChange={(e) => onNode({ showPathway: e.target.checked })}
            />{" "}
            Показывать путь игрокам
          </label>
        </Section>
      ) : null}
      <Section title="Реплики">
        {lines.map((line) => (
          <div key={line.id} className="card" style={{ marginTop: 8, display: "grid", gap: 6 }}>
            <input
              value={line.label}
              placeholder="Кнопка"
              onChange={(e) => patchLine(line.id, { label: e.target.value })}
              style={field}
            />
            <textarea
              value={line.reply}
              rows={2}
              placeholder="Ответ"
              onChange={(e) => patchLine(line.id, { reply: e.target.value })}
              style={{ ...field, resize: "vertical" }}
            />
            <select
              value={line.veracity ?? ""}
              onChange={(e) =>
                patchLine(line.id, {
                  veracity: e.target.value === "truth" || e.target.value === "lie" ? e.target.value : undefined,
                })
              }
              style={field}
            >
              <option value="">Без метки</option>
              <option value="truth">Правда</option>
              <option value="lie">Ложь</option>
            </select>
            <input
              value={line.requiresFlag ?? ""}
              placeholder="Нужен флаг"
              onChange={(e) => patchLine(line.id, { requiresFlag: e.target.value.trim() || undefined })}
              style={field}
            />
            {abilities.length > 0 ? (
              <select
                value={line.usesAbilityId ?? ""}
                onChange={(e) => patchLine(line.id, { usesAbilityId: e.target.value || undefined })}
                style={field}
              >
                <option value="">Реплика не применяет способность</option>
                {abilities.map((a) => (
                  <option key={a.id} value={a.id}>{a.nameRu}</option>
                ))}
              </select>
            ) : null}
            <button
              type="button"
              className="btn"
              style={{ height: 28, fontSize: 11, color: "var(--danger)" }}
              onClick={() => onNode({ talkOptions: lines.filter((l) => l.id !== line.id) })}
            >
              Удалить реплику
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn"
          style={{ marginTop: 8, height: 32, fontSize: 12 }}
          onClick={() =>
            onNode({
              talkOptions: [
                ...lines,
                { id: `line_${Math.random().toString(36).slice(2, 7)}`, label: "Спросить", reply: "…", once: true },
              ],
            })
          }
        >
          + Реплика
        </button>
      </Section>
      <button type="button" className="btn" style={{ marginTop: 12, color: "var(--danger)" }} onClick={onDelete}>
        Удалить NPC
      </button>
    </div>
  );
}

function PresenceInspector({
  node,
  abilities,
  base,
  onNode,
  onDelete,
}: {
  node: ScenarioNode | undefined;
  abilities: { id: string; nameRu: string }[];
  base: ReturnType<typeof getLoreBase>;
  onNode: (d: Partial<ScenarioNode["data"]>) => void;
  onDelete: () => void;
}) {
  if (!node) return null;
  const d = node.data;
  return (
    <div>
      <h3 style={{ color: "var(--paper)", margin: "8px 0" }}>Присутствие</h3>
      <p className="faint" style={{ fontSize: 12 }}>На сцене не видно. Срабатывает само.</p>
      <input value={d.title} onChange={(e) => onNode({ title: e.target.value })} style={field} />
      <textarea
        value={d.body ?? ""}
        rows={3}
        placeholder="Что чувствует игрок"
        onChange={(e) => onNode({ body: e.target.value })}
        style={{ ...field, resize: "vertical" }}
      />
      <select
        value={d.trigger === "round" ? "round" : "enter"}
        onChange={(e) => onNode({ trigger: e.target.value === "round" ? "round" : "enter" })}
        style={field}
      >
        <option value="enter">При входе</option>
        <option value="round">В начале хода</option>
      </select>
      {abilities.length > 0 ? (
        <select
          value={d.requiresAbilityId ?? ""}
          onChange={(e) => onNode({ requiresAbilityId: e.target.value || undefined })}
          style={field}
        >
          <option value="">Видят все</option>
          {abilities.map((a) => (
            <option key={a.id} value={a.id}>{a.nameRu}</option>
          ))}
        </select>
      ) : null}
      <button type="button" className="btn" style={{ marginTop: 12, color: "var(--danger)" }} onClick={onDelete}>
        Удалить присутствие
      </button>
      {base ? null : <p className="faint" style={{ fontSize: 11 }}>Включите LoTM, чтобы выбрать способность.</p>}
    </div>
  );
}

function ExitInspector({
  edge,
  rooms,
  onPatch,
}: {
  edge: ScenarioEdge;
  rooms: ScenarioNode[];
  onPatch: (d: Partial<ScenarioEdge>) => void;
}) {
  return (
    <div>
      <h3 style={{ color: "var(--paper)", margin: "8px 0" }}>Выход</h3>
      <label className="muted" style={{ fontSize: 11 }}>
        Куда
        <select value={edge.to} onChange={(e) => onPatch({ to: e.target.value })} style={field}>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.data.title}</option>
          ))}
        </select>
      </label>
      <label className="muted" style={{ fontSize: 11, display: "block", marginTop: 8 }}>
        Подпись
        <input value={edge.label ?? ""} onChange={(e) => onPatch({ label: e.target.value })} style={field} />
      </label>
      <label className="muted" style={{ fontSize: 11, display: "block", marginTop: 8 }}>
        Нужен флаг
        <input
          value={edge.requiresFlag ?? ""}
          onChange={(e) => onPatch({ requiresFlag: e.target.value.trim() || undefined })}
          style={field}
        />
      </label>
    </div>
  );
}
