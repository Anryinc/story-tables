import { useState } from "react";
import { LocationScene } from "@/components/LocationScene";
import type { ActionIntent, SceneHotspot, TurnSnapshot } from "@/lib/turn-types";

type Tab = "scene" | "memory" | "power" | "bag" | "file";

const TABS: { id: Tab; label: string }[] = [
  { id: "scene", label: "Сцена" },
  { id: "memory", label: "Память" },
  { id: "power", label: "Силы" },
  { id: "bag", label: "Вещи" },
  { id: "file", label: "Дело" },
];

function intentLabel(intent: ActionIntent, actions: { intent: ActionIntent; label: string }[]) {
  const hit = actions.find((a) => JSON.stringify(a.intent) === JSON.stringify(intent));
  if (hit) return hit.label;
  if (intent.type === "inspect") return "осмотр";
  if (intent.type === "talk") return "разговор";
  if (intent.type === "move") return "переход";
  if (intent.type === "ability") return "способность";
  if (intent.type === "give") return "передача";
  if (intent.type === "wait") return "ожидание";
  return "ход";
}

export function PlayConsole({
  room,
  onIntent,
  onInspect,
  onTalk,
  onShare,
  onClear,
  dock = false,
}: {
  room: TurnSnapshot;
  onIntent: (intent: ActionIntent) => void;
  onInspect: (inspectId: string) => void;
  onTalk: (npcId: string, optionId: string) => void;
  onShare: (memoryId: string, to: string) => void;
  onClear: () => void;
  /** Phone page: tabs sit under the scrolling pane. Desktop table: tabs stay in the page flow. */
  dock?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("scene");
  const [npc, setNpc] = useState<SceneHotspot | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [aim, setAim] = useState<string | null>(null);
  const [giveId, setGiveId] = useState<string | null>(null);
  const [person, setPerson] = useState<(typeof room.company)[number] | null>(null);
  const me = room.characterOptions.find((c) => c.id === room.myCharacterId);
  const moves = room.availableActions.filter(
    (a) => a.intent.type === "move" || a.intent.type === "wait",
  );
  const powers = room.availableActions.filter((a) => a.intent.type === "ability");

  const travel = moves.filter((a) => a.intent.type === "move");
  const hold = moves.find((a) => a.intent.type === "wait");

  return (
    <div
      style={{
        maxWidth: dock ? 440 : "100%",
        margin: dock ? "0 auto" : undefined,
        display: "flex",
        flexDirection: "column",
        height: dock ? "100dvh" : undefined,
        minHeight: dock ? 0 : undefined,
      }}
    >
      <div
        style={{
          flex: dock ? "1 1 auto" : undefined,
          overflow: dock ? "auto" : "visible",
          padding: dock ? "12px 16px 16px" : "0 0 12px",
        }}
      >
      {tab === "scene" ? (
        <>
          <p className="brass" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase" }}>
            Раунд {room.round} · ходы {room.intentsReady}/{room.intentsNeeded}
          </p>
          <h1 className="font-display" style={{ margin: "4px 0", color: "var(--paper)", fontSize: 28 }}>
            {room.myLocationName}
          </h1>
          {room.company.length > 0 ? (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginBottom: 8 }}>
              {room.company.map((p) => (
                <button
                  key={p.clientId}
                  type="button"
                  title={p.name}
                  onClick={() => setPerson(p)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    padding: 0,
                    overflow: "hidden",
                    border: "1px solid var(--brass)",
                    background: "#1a1814",
                  }}
                >
                  {p.portraitUrl ? (
                    <img src={p.portraitUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--paper)" }}>{p.name.slice(0, 1)}</span>
                  )}
                </button>
              ))}
            </div>
          ) : null}
          <LocationScene
            image={room.myLocationImage}
            hotspots={room.myScene}
            onInspect={onInspect}
            onTalk={setNpc}
          />
          {room.myLocationDescription ? (
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.45 }}>
              {room.myLocationDescription}
            </p>
          ) : null}
          <p className="faint" style={{ fontSize: 12 }}>
            {room.hereWith.length ? `Здесь же: ${room.hereWith.join(", ")}` : "Вы одни в локации"}
          </p>
          <p className="faint" style={{ fontSize: 12 }}>
            Искра, разговор, переход и способность тратят ход. Раунд закрывается, когда ход сдали все.
          </p>
          <h2 style={{ fontSize: 13, color: "var(--brass)", marginTop: 16 }}>Куда идти</h2>
          {room.myIntent ? (
            <div style={{ display: "grid", gap: 8 }}>
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                Ход сдан: {intentLabel(room.myIntent, room.availableActions)}
              </p>
              <button type="button" className="btn" onClick={onClear}>
                Отменить ход
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {travel.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="btn"
                  style={{ height: "auto", padding: 12, textAlign: "left" }}
                  onClick={() => onIntent(a.intent)}
                >
                  {a.label}
                </button>
              ))}
              <hr
                style={{
                  border: "none",
                  borderTop: "1px solid var(--line)",
                  margin: "8px 0",
                }}
              />
              {hold ? (
                <button
                  type="button"
                  className="btn"
                  style={{ height: "auto", padding: 12, textAlign: "left" }}
                  onClick={() => onIntent(hold.intent)}
                >
                  {hold.label}
                </button>
              ) : null}
            </div>
          )}
        </>
      ) : null}

      {tab === "memory" ? (
        <>
          <h1 className="font-display" style={{ color: "var(--paper)" }}>
            Воспоминания
          </h1>
          {room.myMemories.length === 0 ? (
            <p className="muted">Пока пусто. Искра на сцене откроет окно, а текст останется здесь.</p>
          ) : (
            room.myMemories.map((m) => (
              <article key={m.id} className="card" style={{ marginBottom: 10 }}>
                <p className="faint" style={{ fontSize: 11, margin: 0 }}>
                  Ход {m.round}
                  {m.source ? ` · ${m.source}` : ""}
                </p>
                <h2 style={{ color: "var(--paper)", fontSize: 16, margin: "4px 0" }}>{m.title}</h2>
                {m.imageUrl ? (
                  <img
                    src={m.imageUrl}
                    alt=""
                    style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 10 }}
                  />
                ) : null}
                <p className="muted" style={{ fontSize: 14 }}>{m.body}</p>
                <button
                  type="button"
                  className="btn"
                  style={{ height: 32, fontSize: 12 }}
                  onClick={() => setShareId(shareId === m.id ? null : m.id)}
                >
                  Поделиться
                </button>
                {shareId === m.id ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ height: 32, fontSize: 12 }}
                      disabled={!room.company.length}
                      onClick={() => onShare(m.id, "location")}
                    >
                      Всем здесь
                    </button>
                    {room.company.map((p) => (
                      <button
                        key={p.clientId}
                        type="button"
                        className="btn"
                        style={{ height: 32, fontSize: 12 }}
                        onClick={() => onShare(m.id, p.clientId)}
                      >
                        {p.name}
                      </button>
                    ))}
                    {!room.company.length ? (
                      <span className="faint" style={{ fontSize: 12 }}>
                        Рядом никого.
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </article>
            ))
          )}
        </>
      ) : null}

      {tab === "power" ? (
        <>
          <h1 className="font-display" style={{ color: "var(--paper)" }}>
            Способности
          </h1>
          {(me?.abilities ?? []).some((a) => a.kind === "passive") ? (
            <p className="faint" style={{ fontSize: 12 }}>
              Пассивные работают сами: {me?.abilities.filter((a) => a.kind === "passive").map((a) => a.name).join(", ")}.
            </p>
          ) : null}
          {(me?.abilities ?? []).some((a) => a.kind === "reaction") ? (
            <p className="faint" style={{ fontSize: 12 }}>
              Реакции отзываются на чужое действие: {me?.abilities.filter((a) => a.kind === "reaction").map((a) => a.name).join(", ")}.
            </p>
          ) : null}
          {powers.length === 0 ? (
            <p className="muted">Нет доступных сил. Пустая роль или кулдаун.</p>
          ) : room.myIntent ? (
            <div style={{ display: "grid", gap: 8 }}>
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                Ход сдан: {intentLabel(room.myIntent, room.availableActions)}
              </p>
              <button type="button" className="btn" onClick={onClear}>
                Отменить ход
              </button>
            </div>
          ) : (
            powers.map((a) => {
              const aiming = aim === a.id;
              const people = a.needsTarget === "person" || a.needsTarget === "any" ? room.company : [];
              const sparks = a.needsTarget === "spark" || a.needsTarget === "any"
                ? room.myScene.filter((p) => p.kind !== "npc")
                : [];
              const places = a.needsTarget === "location" ? room.travelTo ?? [] : [];
              return (
                <div key={a.id} className="card" style={{ marginBottom: 8, padding: 10 }}>
                  <div style={{ color: "var(--paper)" }}>{a.label}</div>
                  {a.cooldownLeft ? (
                    <div className="brass" style={{ fontSize: 12 }}>Ещё {a.cooldownLeft} {a.cooldownLeft % 10 === 1 && a.cooldownLeft % 100 !== 11 ? "ход" : a.cooldownLeft % 10 >= 2 && a.cooldownLeft % 10 <= 4 && (a.cooldownLeft % 100 < 12 || a.cooldownLeft % 100 > 14) ? "хода" : "ходов"}</div>
                  ) : null}
                  {a.detail ? <div className="faint" style={{ fontSize: 12 }}>{a.detail}</div> : null}
                  {a.needsTarget && !a.cooldownLeft ? (
                    aiming ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                        {people.map((p) => (
                          <button
                            key={p.clientId}
                            type="button"
                            className="btn"
                            style={{ height: 30, fontSize: 12 }}
                            onClick={() => onIntent({ ...a.intent, targetId: p.clientId, targetLabel: p.name } as typeof a.intent)}
                          >
                            {p.name}
                          </button>
                        ))}
                        {sparks.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="btn"
                            style={{ height: 30, fontSize: 12 }}
                            onClick={() => onIntent({ ...a.intent, targetId: p.inspectId || p.id, targetLabel: p.label } as typeof a.intent)}
                          >
                            {p.label}
                          </button>
                        ))}
                        {places.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="btn"
                            style={{ height: 30, fontSize: 12 }}
                            onClick={() => onIntent({ ...a.intent, targetId: p.id, targetLabel: p.name } as typeof a.intent)}
                          >
                            {p.name}
                          </button>
                        ))}
                        {people.length + sparks.length + places.length === 0 ? (
                          <span className="faint" style={{ fontSize: 12 }}>Рядом не на что нацелиться.</span>
                        ) : null}
                        <button type="button" className="btn" style={{ height: 30, fontSize: 12 }} onClick={() => setAim(null)}>
                          Отмена
                        </button>
                      </div>
                    ) : (
                      <button type="button" className="btn" style={{ marginTop: 8, height: 32 }} onClick={() => setAim(a.id)}>
                        Выбрать цель
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      className="btn"
                      style={{ marginTop: 8, height: 32 }}
                      disabled={Boolean(a.cooldownLeft)}
                      onClick={() => onIntent(a.intent)}
                    >
                      {a.cooldownLeft ? "Остывает" : "Применить"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </>
      ) : null}

      {tab === "bag" ? (
        <>
          <h1 className="font-display" style={{ color: "var(--paper)" }}>
            Инвентарь
          </h1>
          {room.myItems.length === 0 ? (
            <p className="muted">Карманы пусты. Вещь, которую забирает один, пропадает у остальных.</p>
          ) : (
            room.myItems.map((item) => (
              <article key={item.id} className="card" style={{ marginBottom: 10 }}>
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt=""
                    style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 10 }}
                  />
                ) : null}
                <h2 style={{ color: "var(--paper)", fontSize: 16, margin: "6px 0" }}>{item.title}</h2>
                <p className="muted" style={{ fontSize: 14 }}>{item.body || "—"}</p>
                {item.abilityId ? <p className="brass" style={{ fontSize: 11 }}>Несёт способность</p> : null}
                {room.company.length > 0 && !room.myIntent ? (
                  giveId === item.id ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {room.company.map((p) => (
                        <button
                          key={p.clientId}
                          type="button"
                          className="btn"
                          style={{ height: 30, fontSize: 12 }}
                          onClick={() => onIntent({ type: "give", itemId: item.id, toClientId: p.clientId })}
                        >
                          {p.name}
                        </button>
                      ))}
                      <button type="button" className="btn" style={{ height: 30, fontSize: 12 }} onClick={() => setGiveId(null)}>
                        Отмена
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="btn" style={{ height: 32, marginTop: 6 }} onClick={() => setGiveId(item.id)}>
                      Отдать
                    </button>
                  )
                ) : null}
              </article>
            ))
          )}
        </>
      ) : null}

      {tab === "file" ? (
        <>
          <h1 className="font-display" style={{ color: "var(--paper)" }}>
            Личное дело
          </h1>
          <article className="card" style={{ display: "grid", gap: 8 }}>
            <p className="brass" style={{ fontSize: 10, margin: 0 }}>РОЛЬ</p>
            <p style={{ margin: 0 }}>{me?.name?.trim() || "—"}</p>
            {me?.pathway ? <p className="faint" style={{ margin: 0 }}>{me.pathway}</p> : null}
            <p className="brass" style={{ fontSize: 10, margin: 0 }}>ИМЯ</p>
            <p style={{ margin: 0, color: me?.givenName?.trim() ? "inherit" : "var(--faint)" }}>
              {me?.givenName?.trim() || "—"}
            </p>
            <p className="brass" style={{ fontSize: 10, margin: 0 }}>ПРЕДЫСТОРИЯ</p>
            <p className="muted" style={{ margin: 0 }}>{me?.blurb?.trim() || "—"}</p>
          </article>
          <h2 style={{ fontSize: 13, color: "var(--brass)" }}>Состояния</h2>
          {room.myStates.length === 0 ? (
            <p className="muted">Нет состояний.</p>
          ) : (
            room.myStates.map((s) => (
              <article key={s.id} className="card" style={{ marginBottom: 8 }}>
                <div style={{ color: "var(--paper)" }}>{s.title}</div>
                <p className="faint" style={{ fontSize: 11, margin: 0 }}>
                  {s.kind === "curse" ? "проклятие" : s.kind === "blessing" ? "благословение" : s.kind === "restraint" ? "оковы" : "пометка"}
                  {s.blocks?.length ? ` · мешает: ${s.blocks.join(", ")}` : ""}
                  {s.untilRound ? ` · до хода ${s.untilRound}` : ""}
                </p>
                <p className="muted" style={{ fontSize: 14 }}>{s.body || "—"}</p>
              </article>
            ))
          )}
        </>
      ) : null}

      {person ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(0,0,0,0.72)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onClick={() => setPerson(null)}
        >
          <div className="card" style={{ width: "min(440px, 100%)", borderRadius: "18px 18px 0 0" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", background: "#1a1814", flex: "0 0 auto" }}>
                {person.portraitUrl ? (
                  <img src={person.portraitUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : null}
              </div>
              <div>
                <p className="brass" style={{ fontSize: 11, margin: 0 }}>{person.givenName || person.name}</p>
                <p style={{ margin: 0, color: "var(--paper)" }}>{person.name}</p>
              </div>
            </div>
            <p className="muted" style={{ fontSize: 14 }}>{person.appearance?.trim() || "—"}</p>
            <button type="button" className="btn" style={{ width: "100%" }} onClick={() => setPerson(null)}>
              Закрыть
            </button>
          </div>
        </div>
      ) : null}

      {npc ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(0,0,0,0.72)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onClick={() => setNpc(null)}
        >
          <div
            className="card dlg-sheet"
            style={{ width: "min(520px, 100%)", borderRadius: "18px 18px 0 0", margin: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
              {npc.image ? (
                <img
                  src={npc.image}
                  alt=""
                  className="npc-idle"
                  style={{
                    width: 108,
                    height: 180,
                    objectFit: "contain",
                    objectPosition: "center bottom",
                    flex: "0 0 auto",
                    animationDuration: "3.4s",
                  }}
                />
              ) : null}
              <div style={{ minWidth: 0, flex: 1, paddingBottom: 8 }}>
                <p className="brass" style={{ fontSize: 11, margin: 0 }}>{npc.label}</p>
                {npc.pathway ? <p className="faint" style={{ fontSize: 12, margin: "2px 0 0" }}>{npc.pathway}</p> : null}
                <p className="dlg-line" style={{ color: "var(--paper)", margin: "8px 0 0", lineHeight: 1.4 }}>
                  {npc.intro || "Молчит и ждёт."}
                </p>
              </div>
            </div>
            {room.myIntent ? (
              <p className="muted" style={{ fontSize: 13 }}>Ход уже сдан. Реплику можно выбрать в следующем раунде.</p>
            ) : (npc.talkOptions ?? []).length === 0 ? (
              <p className="muted">Больше нечего сказать.</p>
            ) : (
              (npc.talkOptions ?? []).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className="btn"
                  style={{ width: "100%", marginTop: 8, height: "auto", padding: 12, textAlign: "left" }}
                  onClick={() => {
                    if (npc.npcId) onTalk(npc.npcId, o.id);
                    setNpc(null);
                  }}
                >
                  {o.label}
                  {o.veracity === "truth" ? <span className="brass"> · правда</span> : null}
                  {o.veracity === "lie" ? <span style={{ color: "var(--danger)" }}> · ложь</span> : null}
                </button>
              ))
            )}
            <button type="button" className="btn" style={{ width: "100%", marginTop: 8 }} onClick={() => setNpc(null)}>
              Отойти
            </button>
          </div>
        </div>
      ) : null}
      </div>

      <nav
        style={{
          display: "flex",
          justifyContent: "space-around",
          gap: 4,
          padding: "8px 8px calc(8px + env(safe-area-inset-bottom))",
          background: "#0c0b0a",
          borderTop: "1px solid var(--line)",
          flex: "0 0 auto",
        }}
      >
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            style={{
              flex: 1,
              height: 40,
              borderRadius: 10,
              border: "none",
              background: tab === item.id ? "var(--paper)" : "transparent",
              color: tab === item.id ? "#0c0b0a" : "var(--muted)",
              fontSize: 12,
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
