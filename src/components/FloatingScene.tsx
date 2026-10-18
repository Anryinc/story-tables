import { useEffect, useRef, useState, type PointerEvent as RE } from "react";
import { SceneEditor } from "./SceneEditor";
import type { ScenarioDocument } from "@/lib/scenario/types";

export function FloatingScene({
  doc,
  onChange,
  onClose,
  initialLocId,
}: {
  doc: ScenarioDocument;
  onChange: (d: ScenarioDocument) => void;
  onClose: () => void;
  initialLocId?: string;
}) {
  const locations = doc.nodes.filter((n) => n.kind === "location");
  const [locId, setLocId] = useState(
    initialLocId || locations[0]?.id || "",
  );

  useEffect(() => {
    if (initialLocId) setLocId(initialLocId);
  }, [initialLocId]);

  const loc =
    locations.find((n) => n.id === locId) ?? locations[0] ?? null;

  const [pos, setPos] = useState({ x: 80, y: 100 });
  const drag = useRef<{ ox: number; oy: number; px: number; py: number } | null>(
    null,
  );

  const onHeaderDown = (e: RE) => {
    drag.current = {
      ox: e.clientX,
      oy: e.clientY,
      px: pos.x,
      py: pos.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onHeaderMove = (e: RE) => {
    if (!drag.current) return;
    setPos({
      x: drag.current.px + (e.clientX - drag.current.ox),
      y: drag.current.py + (e.clientY - drag.current.oy),
    });
  };
  const onHeaderUp = () => {
    drag.current = null;
  };

  if (!loc) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: 920,
        maxWidth: "92vw",
        height: "70vh",
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
        border: "1px solid var(--brass)",
        borderRadius: 14,
        background: "#12100e",
        boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
        overflow: "hidden",
      }}
    >
      <div
        onPointerDown={onHeaderDown}
        onPointerMove={onHeaderMove}
        onPointerUp={onHeaderUp}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          borderBottom: "1px solid var(--line)",
          cursor: "move",
          userSelect: "none",
        }}
      >
        <span className="brass" style={{ fontSize: 11, flex: 1 }}>
          Сцена · {loc.data.title}
        </span>
        <select
          value={loc.id}
          onChange={(e) => setLocId(e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            background: "#0c0b0a",
            color: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: 6,
            fontSize: 11,
            padding: "2px 4px",
          }}
        >
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.data.title}
            </option>
          ))}
        </select>
        <button type="button" className="btn" style={{ height: 26, fontSize: 11 }} onClick={onClose}>
          ✕
        </button>
      </div>
      <div style={{ padding: 8, overflow: "hidden", flex: 1, minHeight: 0 }}>
        <SceneEditor doc={doc} locationId={loc.id} onChange={onChange} />
      </div>
    </div>
  );
}
