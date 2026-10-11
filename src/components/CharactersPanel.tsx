import { abilityIdsForSequence } from "@/lib/lore/types";
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

  const setChars = (next: ScenarioCharacter[]) => {
    onChange({ ...doc, characters: next });
  };

  const update = (id: string, patch: Partial<ScenarioCharacter>) => {
    setChars(chars.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  return (
    <div style={{ padding: 16, overflow: "auto", height: "100%" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <h2 className="font-display" style={{ margin: 0, color: "var(--paper)", flex: 1 }}>
          Персонажи
        </h2>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setChars([...chars, createCharacter(`Герой ${chars.length + 1}`)])}
        >
          + Персонаж
        </button>
      </div>

      <label className="muted" style={{ fontSize: 12, display: "block", marginBottom: 16 }}>
        База лора сценария
        <select
          value={doc.loreBaseId ?? ""}
          onChange={(e) =>
            onChange({
              ...doc,
              loreBaseId: e.target.value || undefined,
            })
          }
          style={field}
        >
          <option value="">— нет —</option>
          {bases.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title} v{b.version}
            </option>
          ))}
        </select>
      </label>

      {chars.length === 0 ? (
        <p className="muted">Нет ролей. Добавьте персонажа — он появится в лобби стола.</p>
      ) : (
        <div style={{ display: "grid", gap: 16, maxWidth: 560 }}>
          {chars.map((c) => (
            <div key={c.id} className="card" style={{ display: "grid", gap: 8 }}>
              <input
                value={c.name}
                onChange={(e) => update(c.id, { name: e.target.value })}
                style={{ ...field, fontSize: 16, color: "var(--paper)" }}
                placeholder="Имя"
              />
              <textarea
                value={c.blurb}
                onChange={(e) => update(c.id, { blurb: e.target.value })}
                rows={2}
                placeholder="Бэк / описание"
                style={field}
              />
              <input
                value={c.portraitUrl ?? ""}
                onChange={(e) => update(c.id, { portraitUrl: e.target.value || undefined })}
                placeholder="Портрет URL"
                style={field}
              />
              {c.portraitUrl ? (
                <img
                  src={c.portraitUrl}
                  alt=""
                  style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8 }}
                />
              ) : null}

              {base ? (
                <>
                  <label className="muted" style={{ fontSize: 12 }}>
                    Путь (LoTM)
                    <select
                      value={c.lore?.pathwayId ?? ""}
                      onChange={(e) => {
                        const pathwayId = e.target.value;
                        if (!pathwayId) {
                          update(c.id, { lore: undefined });
                          return;
                        }
                        const rank = (c.lore?.sequenceRank ?? 9) as 9 | 8 | 7 | 6 | 5 | 4;
                        update(c.id, {
                          lore: {
                            baseId: base.id,
                            pathwayId,
                            sequenceRank: rank,
                            enabledAbilityIds: abilityIdsForSequence(base, pathwayId, rank),
                          },
                        });
                      }}
                      style={field}
                    >
                      <option value="">— без пути —</option>
                      {base.pathways.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nameRu} ({p.nameEn})
                        </option>
                      ))}
                    </select>
                  </label>
                  {c.lore?.pathwayId ? (
                    <>
                      <label className="muted" style={{ fontSize: 12 }}>
                        Последовательность
                        <select
                          value={c.lore.sequenceRank}
                          onChange={(e) => {
                            const rank = Number(e.target.value) as 9 | 8 | 7 | 6 | 5 | 4;
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
                            const seq = base.pathways
                              .find((p) => p.id === c.lore?.pathwayId)
                              ?.sequences.find((s) => s.rank === r);
                            return (
                              <option key={r} value={r}>
                                C{r} · {seq?.nameRu ?? r}
                              </option>
                            );
                          })}
                        </select>
                      </label>
                      <p className="faint" style={{ fontSize: 11, margin: 0 }}>
                        Способностей: {c.lore.enabledAbilityIds?.length ?? 0} (C
                        {c.lore.sequenceRank} и ниже)
                      </p>
                    </>
                  ) : null}
                </>
              ) : (
                <p className="faint" style={{ fontSize: 12 }}>
                  Включите базу LoTM выше, чтобы назначить путь и зелье.
                </p>
              )}

              <button
                type="button"
                className="btn"
                style={{ color: "var(--danger)" }}
                onClick={() => setChars(chars.filter((x) => x.id !== c.id))}
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}
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
  fontSize: 13,
};
