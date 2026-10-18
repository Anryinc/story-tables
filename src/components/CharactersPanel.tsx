import { useState, type CSSProperties } from "react";
import { addAssetFromFile, resolveAssetUrl } from "@/lib/assets/store";
import { CharacterPortrait } from "@/components/CharacterPickCard";
import { abilityIdsForSequence, abilitiesForSequence, findSequence } from "@/lib/lore/types";
import { getLoreBase, listLoreBases } from "@/lib/lore/registry";
import {
  createCharacter,
  type ScenarioCharacter,
  type ScenarioDocument,
} from "@/lib/scenario/types";

export function CharactersPanel({
  doc,
  onChange,
}: {
  doc: ScenarioDocument;
  onChange: (d: ScenarioDocument) => void;
}) {
  const chars = doc.characters ?? [];
  const base = getLoreBase(doc.loreBaseId);
  const bases = listLoreBases();
  const [uploading, setUploading] = useState<string | null>(null);

  const setChars = (next: ScenarioCharacter[]) => {
    onChange({ ...doc, characters: next });
  };

  const update = (id: string, patch: Partial<ScenarioCharacter>) => {
    setChars(chars.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const onPortraitFile = async (charId: string, file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(charId);
    try {
      const meta = await addAssetFromFile(file, { category: "npc", name: `npc_${file.name}` });
      const url = await resolveAssetUrl(meta);
      if (url) {
        update(charId, { portraitUrl: url, portraitAssetId: meta.id });
      }
    } finally {
      setUploading(null);
    }
  };

  return (
    <div style={{ padding: 16, overflow: "auto", height: "100%" }}>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <h2 className="font-display" style={{ margin: 0, color: "var(--paper)", flex: 1 }}>
          Персонажи
        </h2>
        <label className="muted" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
          База лора
          <select
            value={doc.loreBaseId ?? ""}
            onChange={(e) =>
              onChange({
                ...doc,
                loreBaseId: e.target.value || undefined,
              })
            }
            style={{ ...field, width: "auto", marginTop: 0, minWidth: 120 }}
          >
            <option value="">— нет —</option>
            {bases.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setChars([...chars, createCharacter(`Герой ${chars.length + 1}`)])}
        >
          + Персонаж
        </button>
      </div>

      {chars.length === 0 ? (
        <p className="muted">Нет ролей. Добавьте персонажа — он появится в лобби стола.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            alignItems: "start",
          }}
        >
          {chars.map((c) => {
            const seq =
              base && c.lore
                ? findSequence(base, c.lore.pathwayId, c.lore.sequenceRank)
                : null;
            const pathMeta = base?.pathways.find((p) => p.id === c.lore?.pathwayId);

            return (
              <article
                key={c.id}
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  padding: 0,
                  overflow: "hidden",
                  borderColor: "var(--line)",
                }}
              >
                {/* Portrait */}
                <div
                  style={{
                    position: "relative",
                    aspectRatio: "3 / 4",
                    background: "#1a1814",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <div style={{ position: "absolute", inset: 0 }}>
                    <CharacterPortrait url={c.portraitUrl} gender={c.gender} />
                  </div>
                  <label
                    style={{
                      position: "absolute",
                      left: 8,
                      right: 8,
                      bottom: 8,
                      textAlign: "center",
                      cursor: "pointer",
                    }}
                  >
                    <span className="btn" style={{ height: 28, fontSize: 11, display: "inline-block" }}>
                      {uploading === c.id ? "…" : "Загрузить портрет"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        void onPortraitFile(c.id, e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>

                <div style={{ padding: "0 12px 12px", display: "grid", gap: 8 }}>
                  {/* Name */}
                  <label className="muted" style={{ fontSize: 11 }}>
                    Роль
                    <input
                      value={c.name}
                      onChange={(e) => update(c.id, { name: e.target.value })}
                      style={{
                        ...field,
                        marginTop: 4,
                        fontFamily: '"Cormorant Garamond", serif',
                        fontSize: 20,
                      }}
                      placeholder="Следователь"
                    />
                  </label>
                  <label className="muted" style={{ fontSize: 11 }}>
                    Имя
                    <input
                      value={c.givenName ?? ""}
                      onChange={(e) =>
                        update(c.id, { givenName: e.target.value || undefined })
                      }
                      style={field}
                      placeholder="Если пусто — на карточке прочерк"
                    />
                  </label>
                  <label className="muted" style={{ fontSize: 11 }}>
                    Силуэт, если нет портрета
                    <select
                      value={c.gender ?? "male"}
                      onChange={(e) =>
                        update(c.id, {
                          gender: e.target.value === "female" ? "female" : "male",
                        })
                      }
                      style={field}
                    >
                      <option value="male">Мужской</option>
                      <option value="female">Женский</option>
                    </select>
                  </label>

                  {/* Backstory */}
                  <label className="muted" style={{ fontSize: 11 }}>
                    Предыстория
                    <textarea
                      value={c.blurb}
                      onChange={(e) => update(c.id, { blurb: e.target.value })}
                      rows={3}
                      placeholder="Кто этот человек до дела…"
                      style={{ ...field, fontSize: 12, lineHeight: 1.45 }}
                    />
                  </label>

                  {/* Pathway / sequence */}
                  {base ? (
                    <div style={{ display: "grid", gap: 6 }}>
                      <label className="muted" style={{ fontSize: 11 }}>
                        Путь
                        <select
                          value={c.lore?.pathwayId ?? ""}
                          onChange={(e) => {
                            const pathwayId = e.target.value;
                            if (!pathwayId) {
                              update(c.id, { lore: undefined });
                              return;
                            }
                            const rank = (c.lore?.sequenceRank ?? 9) as
                              | 9
                              | 8
                              | 7
                              | 6
                              | 5
                              | 4;
                            update(c.id, {
                              lore: {
                                baseId: base.id,
                                pathwayId,
                                sequenceRank: rank,
                                enabledAbilityIds: abilityIdsForSequence(
                                  base,
                                  pathwayId,
                                  rank,
                                ),
                              },
                            });
                          }}
                          style={field}
                        >
                          <option value="">— без пути —</option>
                          {base.pathways.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nameRu}
                            </option>
                          ))}
                        </select>
                      </label>

                      {c.lore?.pathwayId ? (
                        <label className="muted" style={{ fontSize: 11 }}>
                          Зелье / последовательность
                          <select
                            value={c.lore.sequenceRank}
                            onChange={(e) => {
                              const rank = Number(e.target.value) as
                                | 9
                                | 8
                                | 7
                                | 6
                                | 5
                                | 4;
                              const pathwayId = c.lore!.pathwayId;
                              update(c.id, {
                                lore: {
                                  ...c.lore!,
                                  sequenceRank: rank,
                                  enabledAbilityIds: abilityIdsForSequence(
                                    base,
                                    pathwayId,
                                    rank,
                                  ),
                                },
                              });
                            }}
                            style={field}
                          >
                            {[9, 8, 7, 6, 5, 4].map((r) => {
                              const s = base.pathways
                                .find((p) => p.id === c.lore?.pathwayId)
                                ?.sequences.find((x) => x.rank === r);
                              return (
                                <option key={r} value={r}>
                                  C{r} · {s?.nameRu ?? r}
                                </option>
                              );
                            })}
                          </select>
                        </label>
                      ) : null}
                    </div>
                  ) : (
                    <p className="faint" style={{ fontSize: 11, margin: 0 }}>
                      Включите LoTM, чтобы выбрать путь и зелье.
                    </p>
                  )}

                  {/* Sequence profile — pulled from lore */}
                  {seq ? (
                    <div
                      style={{
                        marginTop: 4,
                        padding: 10,
                        borderRadius: 10,
                        background: "#141210",
                        border: "1px solid #2a2622",
                      }}
                    >
                      <p
                        className="brass"
                        style={{
                          fontSize: 10,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          margin: "0 0 6px",
                        }}
                      >
                        {pathMeta?.nameRu} · C{seq.rank} · {seq.nameRu}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          lineHeight: 1.5,
                          color: "var(--muted)",
                        }}
                      >
                        {seq.profileRu}
                      </p>
                      {seq.abilities.length > 0 ? (
                        <ul
                          style={{
                            margin: "8px 0 0",
                            paddingLeft: 16,
                            fontSize: 11,
                            color: "var(--faint)",
                          }}
                        >
                          {abilitiesForSequence(base!, c.lore!.pathwayId, c.lore!.sequenceRank).map((a) => (
                            <li key={a.id} style={{ marginBottom: 2 }}>
                              <span style={{ color: "var(--brass)" }}>{a.nameRu}</span>
                              {" · "}
                              <span>из C{a.rank}</span>
                              {" · "}
                              {a.kind === "passive" ? "пассивная" : "активная"}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className="btn"
                    style={{ color: "var(--danger)", fontSize: 11, height: 30 }}
                    onClick={() => setChars(chars.filter((x) => x.id !== c.id))}
                  >
                    Удалить
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

const field: CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  background: "#0c0b0a",
  border: "1px solid var(--line)",
  borderRadius: 8,
  padding: 8,
  color: "var(--paper)",
  font: "inherit",
  fontSize: 13,
};
