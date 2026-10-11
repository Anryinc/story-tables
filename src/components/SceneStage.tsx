import { useRef, useState, type PointerEvent as RE } from "react";
import type { SceneObject, ScenarioNode } from "@/lib/scenario/types";

export function SceneStage({
  location,
  onChange,
}: {
  location: ScenarioNode;
  onChange: (objects: SceneObject[], background?: string) => void;
}) {
  const objects = location.data.sceneObjects ?? [];
  const bg = location.data.background;
  const [selected, setSelected] = useState<string | null>(null);
  const drag = useRef<{ id: string; ox: number; oy: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const update = (next: SceneObject[]) => {
    onChange(next, bg);
  };

  const onDown = (e: RE, o: SceneObject) => {
    e.stopPropagation();
    setSelected(o.id);
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    drag.current = {
      id: o.id,
      ox: e.clientX - rect.left - o.x,
      oy: e.clientY - rect.top - o.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onMove = (e: RE) => {
    if (!drag.current || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = Math.max(0, e.clientX - rect.left - drag.current.ox);
    const y = Math.max(0, e.clientY - rect.top - drag.current.oy);
    update(
      objects.map((o) =>
        o.id === drag.current!.id ? { ...o, x, y } : o,
      ),
    );
  };

  const onUp = () => {
    drag.current = null;
  };

  const addHotspot = () => {
    const o: SceneObject = {
      id: `obj_${Math.random().toString(36).slice(2, 8)}`,
      kind: "hotspot",
      x: 80,
      y: 80,
      w: 100,
      h: 80,
      label: "Объект",
      interaction: "inspect",
    };
    update([...objects, o]);
    setSelected(o.id);
  };

  const addText = () => {
    const o: SceneObject = {
      id: `obj_${Math.random().toString(36).slice(2, 8)}`,
      kind: "text",
      x: 40,
      y: 40,
      w: 160,
      h: 40,
      text: "Подпись",
      interaction: "none",
    };
    update([...objects, o]);
  };

  const sel = objects.find((o) => o.id === selected);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn" onClick={addHotspot}>
          + Хотспот
        </button>
        <button type="button" className="btn" onClick={addText}>
          + Текст
        </button>
        <label className="btn" style={{ cursor: "pointer" }}>
          Фон URL
          <input
            hidden
            type="text"
            onBlur={(e) => {
              if (e.target.value) onChange(objects, e.target.value);
            }}
          />
        </label>
        <input
          placeholder="URL фона…"
          defaultValue={bg || ""}
          onBlur={(e) => onChange(objects, e.target.value || undefined)}
          style={{
            flex: 1,
            minWidth: 120,
            background: "#0c0b0a",
            border: "1px solid var(--line)",
            borderRadius: 8,
            padding: "6px 8px",
            color: "var(--paper)",
            fontSize: 12,
          }}
        />
      </div>
      <div
        ref={stageRef}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerDown={() => setSelected(null)}
        style={{
          flex: 1,
          minHeight: 280,
          position: "relative",
          borderRadius: 12,
          border: "1px solid var(--line)",
          overflow: "hidden",
          background: bg
            ? `center / cover no-repeat url(${bg})`
            : "#1a1714",
        }}
      >
        {objects.map((o) => (
          <div
            key={o.id}
            onPointerDown={(e) => onDown(e, o)}
            style={{
              position: "absolute",
              left: o.x,
              top: o.y,
              width: o.w,
              height: o.h,
              border:
                o.id === selected
                  ? "2px solid var(--brass)"
                  : "1px dashed rgba(196,165,116,0.5)",
              borderRadius: 8,
              background:
                o.kind === "text"
                  ? "transparent"
                  : "rgba(12,11,10,0.45)",
              color: "var(--paper)",
              fontSize: 12,
              padding: 6,
              cursor: "move",
              userSelect: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            {o.kind === "text" ? o.text : o.label || o.kind}
            {o.url ? (
              <img
                src={o.url}
                alt=""
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  pointerEvents: "none",
                }}
              />
            ) : null}
          </div>
        ))}
      </div>
      {sel ? (
        <div className="card" style={{ fontSize: 12 }}>
          <div style={{ color: "var(--paper)" }}>{sel.kind}</div>
          <input
            value={sel.label || sel.text || ""}
            onChange={(e) => {
              update(
                objects.map((o) =>
                  o.id === sel.id
                    ? {
                        ...o,
                        label: e.target.value,
                        text: o.kind === "text" ? e.target.value : o.text,
                      }
                    : o,
                ),
              );
            }}
            style={{
              width: "100%",
              marginTop: 6,
              background: "#0c0b0a",
              border: "1px solid var(--line)",
              borderRadius: 8,
              padding: 6,
              color: "var(--paper)",
            }}
          />
          <button
            type="button"
            className="btn"
            style={{ marginTop: 8 }}
            onClick={() => update(objects.filter((o) => o.id !== sel.id))}
          >
            Удалить объект
          </button>
        </div>
      ) : null}
    </div>
  );
}
