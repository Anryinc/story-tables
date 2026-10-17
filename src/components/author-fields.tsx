import type { CSSProperties } from "react";
import type { ScenarioNodeData } from "@/lib/scenario/types";

export type ClueDraft = NonNullable<ScenarioNodeData["grantClue"]>;

export type GateDraft = {
  requiresFlag?: string;
  requiresAnyFlags?: string[];
  hideIfFlag?: string;
};

export function parseFlagList(raw: string): string[] | undefined {
  const list = raw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : undefined;
}

export function formatFlagList(list?: string[]): string {
  return (list ?? []).join(", ");
}

export function FlagListField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value?: string[];
  onChange: (next?: string[]) => void;
  placeholder?: string;
}) {
  return (
    <label className="muted" style={{ fontSize: 11, display: "block" }}>
      {label}
      <input
        value={formatFlagList(value)}
        placeholder={placeholder ?? "flag_a, flag_b"}
        onChange={(e) => onChange(parseFlagList(e.target.value))}
        style={field}
      />
    </label>
  );
}

export function GateFields({
  value,
  onChange,
}: {
  value: GateDraft;
  onChange: (patch: GateDraft) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label className="muted" style={{ fontSize: 11, display: "block" }}>
        Нужен флаг
        <input
          value={value.requiresFlag ?? ""}
          placeholder="пусто = всегда доступно"
          onChange={(e) => onChange({ requiresFlag: e.target.value.trim() || undefined })}
          style={field}
        />
      </label>
      <FlagListField
        label="Нужен любой из флагов"
        value={value.requiresAnyFlags}
        onChange={(requiresAnyFlags) => onChange({ requiresAnyFlags })}
      />
      <label className="muted" style={{ fontSize: 11, display: "block" }}>
        Скрыть, если флаг
        <input
          value={value.hideIfFlag ?? ""}
          onChange={(e) => onChange({ hideIfFlag: e.target.value.trim() || undefined })}
          style={field}
        />
      </label>
    </div>
  );
}

export function ClueEditor({
  value,
  onChange,
}: {
  value?: ClueDraft;
  onChange: (next?: ClueDraft) => void;
}) {
  const clue = value;
  const patch = (p: Partial<ClueDraft>) => {
    const next = { id: clue?.id ?? "", title: clue?.title ?? "", body: clue?.body ?? "", source: clue?.source ?? "", ...p };
    if (!next.title.trim() && !next.body.trim()) {
      onChange(undefined);
      return;
    }
    if (!next.id) next.id = `clue_${Math.random().toString(36).slice(2, 8)}`;
    onChange(next);
  };
  return (
    <div className="card" style={{ display: "grid", gap: 6, padding: 8 }}>
      <span className="brass" style={{ fontSize: 10 }}>
        Улика (пустое название и текст = нет улики)
      </span>
      <input
        value={clue?.title ?? ""}
        placeholder="Название улики"
        onChange={(e) => patch({ title: e.target.value })}
        style={field}
      />
      <textarea
        value={clue?.body ?? ""}
        placeholder="Текст улики"
        rows={2}
        onChange={(e) => patch({ body: e.target.value })}
        style={{ ...field, resize: "vertical" }}
      />
      <input
        value={clue?.source ?? ""}
        placeholder="Источник"
        onChange={(e) => patch({ source: e.target.value })}
        style={field}
      />
    </div>
  );
}

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
