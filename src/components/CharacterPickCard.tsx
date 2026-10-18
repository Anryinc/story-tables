import { useState, type CSSProperties } from "react";
import type { CharacterOption } from "@/lib/turn-types";

const DEFAULT_PORTRAIT = {
  male: "/portraits/male.jpg",
  female: "/portraits/female.jpg",
} as const;

function dash(value?: string | null) {
  const text = value?.trim();
  return text ? text : "—";
}

export function CharacterPortrait({
  url,
  gender,
}: {
  url?: string;
  gender?: "male" | "female";
}) {
  const [broken, setBroken] = useState(false);
  const fallback = DEFAULT_PORTRAIT[gender === "female" ? "female" : "male"];
  const src = url && !broken ? url : fallback;
  return (
    <img
      src={src}
      alt=""
      onError={() => {
        if (src !== fallback) setBroken(true);
      }}
      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
    />
  );
}

function Line({ label, children }: { label: string; children: string }) {
  const empty = children === "—";
  return (
    <div>
      <p
        className="brass"
        style={{
          margin: 0,
          fontSize: 10,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: "2px 0 0",
          fontSize: 14,
          lineHeight: 1.4,
          color: empty ? "var(--faint)" : "var(--ink)",
          whiteSpace: "pre-wrap",
        }}
      >
        {children}
      </p>
    </div>
  );
}

export function CharacterPickCard({
  character,
  selected,
  taken,
  onClick,
}: {
  character: CharacterOption;
  selected: boolean;
  taken: boolean;
  onClick: () => void;
}) {
  const locked = taken && !selected;
  const abilities =
    character.abilities.length === 0
      ? "—"
      : character.abilities
          .map((a) => {
            const name = a.name.trim() || "—";
            const description = a.description.trim() || "—";
            return `${name} — ${description}`;
          })
          .join("\n");

  return (
    <button
      type="button"
      disabled={locked}
      onClick={onClick}
      aria-pressed={selected}
      style={{
        ...card,
        borderColor: selected ? "var(--paper)" : "var(--line)",
        opacity: locked ? 0.48 : 1,
        cursor: locked ? "not-allowed" : "pointer",
      }}
    >
      <div style={{ position: "relative", height: 188, background: "#14110e" }}>
        <CharacterPortrait url={character.portraitUrl} gender={character.gender} />
        {selected || locked ? (
          <span
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              padding: "4px 8px",
              borderRadius: 999,
              background: selected ? "var(--paper)" : "#1a1814",
              color: selected ? "#0c0b0a" : "var(--muted)",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {selected ? "Ваша роль" : "Занято"}
          </span>
        ) : null}
      </div>
      <div style={{ display: "grid", gap: 10, padding: "12px 14px 14px" }}>
        <Line label="Роль" children={dash(character.name)} />
        {character.pathway ? (
          <p className="faint" style={{ margin: "-6px 0 0", fontSize: 12 }}>
            {character.pathway}
          </p>
        ) : null}
        <Line label="Имя" children={dash(character.givenName)} />
        <Line label="Предыстория" children={dash(character.blurb)} />
        <Line label="Способности" children={abilities} />
      </div>
    </button>
  );
}

const card: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  padding: 0,
  overflow: "hidden",
  textAlign: "left",
  borderRadius: 18,
  border: "1px solid var(--line)",
  background: "#120f0c",
  color: "inherit",
  font: "inherit",
};
