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
            powers.map((a) => (
              <button
                key={a.id}
                type="button"
                className="btn"
                style={{ height: "auto", padding: 12, textAlign: "left", width: "100%", marginBottom: 8 }}
                onClick={() => onIntent(a.intent)}
              >
                <div style={{ color: "var(--paper)" }}>{a.label}</div>
                {a.detail ? <div className="faint" style={{ fontSize: 12 }}>{a.detail}</div> : null}
              </button>
            ))
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
                <p className="muted" style={{ fontSize: 14 }}>{s.body || "—"}</p>
              </article>
            ))
          )}
        </>
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
        >
          <div className="card" style={{ width: "min(440px, 100%)", borderRadius: "18px 18px 0 0" }}>
            <p className="brass" style={{ fontSize: 11 }}>{npc.label}</p>
            {npc.image ? (
              <img
                src={npc.image}
                alt=""
                style={{
                  width: 140,
                  height: 220,
                  objectFit: "contain",
                  objectPosition: "center bottom",
                  display: "block",
                  background: "transparent",
                }}
              />
            ) : null}
            {(npc.talkOptions ?? []).length === 0 ? (
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
                </button>
              ))
            )}
            <button type="button" className="btn" style={{ width: "100%", marginTop: 8 }} onClick={() => setNpc(null)}>
              Закрыть
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
