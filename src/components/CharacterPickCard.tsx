import { useState, type CSSProperties } from "react";
import type { CharacterOption } from "@/lib/turn-types";

function dash(value?: string | null) {
  const text = value?.trim();
  return text ? text : "—";
}

function Silhouette({ gender }: { gender?: "male" | "female" }) {
  const female = gender === "female";
  return (
    <svg viewBox="0 0 200 260" width="100%" height="100%" aria-hidden>
      <rect width="200" height="260" fill="#14110e" />
      <rect x="0" y="188" width="200" height="72" fill="#1c1814" />
      <path
        d={
          female
            ? "M38 260c8-52 22-78 62-86 40 8 54 34 62 86H38z"
            : "M28 260c6-46 20-70 72-78 52 8 66 32 72 78H28z"
        }
        fill="#2a241c"
      />
      <path
        d={
          female
            ? "M78 176c-6 16-4 36 22 40 26-4 28-24 22-40-8 6-36 6-44 0z"
            : "M74 178c-4 14-2 30 26 34 28-4 30-20 26-34-10 6-42 6-52 0z"
        }
        fill="#3a3228"
      />
      <circle cx="100" cy="108" r={female ? 34 : 32} fill="#c4b5a0" />
      {female ? (
        <path
          d="M62 108c2-46 18-62 38-62s36 16 38 62c-6 8-14 28-38 34-24-6-32-26-38-34z"
          fill="#1a1612"
        />
      ) : (
        <path
          d="M68 104c4-36 16-50 32-50s28 14 32 50c-2 6-10 14-32 16-22-2-30-10-32-16z"
          fill="#1a1612"
        />
      )}
      <path
        d={female ? "M70 118c8 18 52 18 60 0" : "M76 116c6 14 42 14 48 0"}
        fill="none"
        stroke="#8d7d68"
        strokeWidth="1.5"
      />
      <circle cx="88" cy="108" r="2" fill="#2a241c" />
      <circle cx="112" cy="108" r="2" fill="#2a241c" />
      <path
        d="M24 18h152"
        fill="none"
        stroke="#c4a574"
        strokeOpacity="0.35"
      />
    </svg>
  );
}

export function CharacterPortrait({
  url,
  gender,
}: {
  url?: string;
  gender?: "male" | "female";
}) {
  const [broken, setBroken] = useState(false);
  if (url && !broken) {
    return (
      <img
        src={url}
        alt=""
        onError={() => setBroken(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    );
  }
  return <Silhouette gender={gender} />;
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
