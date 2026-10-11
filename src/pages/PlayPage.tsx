import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { DataConnection } from "peerjs";
import { getClientId } from "@/lib/ids";
import { openGuestPeer, type GuestMsg } from "@/lib/p2p";
import type { ActionIntent, TurnSnapshot } from "@/lib/turn-types";
import { ROSTER } from "@/projects/roster";

export function PlayPage() {
  const { code = "" } = useParams();
  const clientId = useMemo(() => getClientId(), []);
  const connRef = useRef<DataConnection | null>(null);
  const [room, setRoom] = useState<TurnSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const send = (msg: GuestMsg) => {
    connRef.current?.send(msg);
  };

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    const { peer, whenReady } = openGuestPeer(code, (msg) => {
      if (msg.t === "snapshot") setRoom(msg.room);
      if (msg.t === "actionResult" && !msg.ok) setActionError(msg.error ?? "Ошибка");
      if (msg.t === "actionResult" && msg.ok) setActionError(null);
    });
    whenReady
      .then((conn) => {
        if (cancelled) return;
        connRef.current = conn;
        send({ t: "hello", clientId, displayName: "Игрок" });
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    const hang = setTimeout(() => {
      if (!cancelled && !room) {
        setError((e) => e ?? "Ждём хоста. Откройте стол на ПК с тем же кодом.");
      }
    }, 10000);
    return () => {
      cancelled = true;
      clearTimeout(hang);
      peer.destroy();
    };
  }, [code, clientId]);

  if (error && !room) {
    return (
      <main style={{ padding: 32, textAlign: "center" }}>
        <h1 className="font-display">Стол</h1>
        <p className="muted">{error}</p>
        <p className="faint">Код {code.toUpperCase()}</p>
        <Link to="/">Хаб</Link>
      </main>
    );
  }

  if (!room) {
    return (
      <main style={{ padding: 32, textAlign: "center" }} className="font-display">
        Садимся за стол…
      </main>
    );
  }

  if (room.status === "lobby" || !room.myCharacterId) {
    return (
      <main style={{ maxWidth: 420, margin: "0 auto", padding: 20 }}>
        <p className="brass" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" }}>
          {room.projectTitle}
        </p>
        <h1 className="font-display" style={{ color: "var(--paper)" }}>
          Стол {room.code}
        </h1>
        <p className="muted">Выберите роль</p>
        <div style={{ display: "grid", gap: 8 }}>
          {ROSTER.map((c) => (
            <button
              key={c.id}
              type="button"
              className="btn"
              disabled={room.takenCharacterIds.includes(c.id) && room.myCharacterId !== c.id}
              onClick={() =>
                send({
                  t: "claim",
                  clientId,
                  characterId: room.myCharacterId === c.id ? null : c.id,
                })
              }
              style={{
                textAlign: "left",
                height: "auto",
                padding: "12px 14px",
                borderColor:
                  room.myCharacterId === c.id ? "var(--paper)" : "var(--line)",
              }}
            >
              <div style={{ color: "var(--paper)" }}>{c.name}</div>
              <div className="faint" style={{ fontSize: 12 }}>
                {c.pathway} · {c.blurb}
              </div>
            </button>
          ))}
        </div>
        {room.myCharacterId ? (
          <p className="muted" style={{ marginTop: 16 }}>
            Ждём старта на хабе (ПК).
          </p>
        ) : null}
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: "12px 16px 32px" }}>
      <p className="brass" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase" }}>
        Раунд {room.round} · {room.intentsReady}/{room.intentsNeeded}
      </p>
      <h1 className="font-display" style={{ margin: "4px 0", color: "var(--paper)", fontSize: 28 }}>
        {room.myLocationName}
      </h1>
      <p className="faint" style={{ fontSize: 12 }}>
        {room.hereWith.length
          ? `Здесь же: ${room.hereWith.join(", ")}`
          : "Вы одни в локации"}
      </p>
      {room.hereNpcs.map((n) => (
        <p key={n.id} className="muted" style={{ fontSize: 13 }}>
          <span className="brass">{n.name}.</span> {n.intro}
        </p>
      ))}
      {room.lastResult ? (
        <div className="card" style={{ marginTop: 12, fontSize: 14 }}>
          {room.lastResult}
        </div>
      ) : null}
      {actionError ? <p className="danger">{actionError}</p> : null}

      <h2 style={{ fontSize: 13, color: "var(--brass)", marginTop: 20 }}>Ход</h2>
      {room.myIntent ? (
        <div className="card">
          <p className="brass" style={{ fontSize: 11 }}>
            Ход сдан
          </p>
          <button
            type="button"
            className="btn"
            style={{ marginTop: 8 }}
            onClick={() => send({ t: "clearIntent", clientId })}
          >
            Отменить
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {room.availableActions.map((a) => (
            <button
              key={a.id}
              type="button"
              className="btn"
              style={{ height: "auto", padding: "12px", textAlign: "left" }}
              onClick={() => {
                send({ t: "intent", clientId, intent: a.intent as ActionIntent });
              }}
            >
              <div style={{ color: "var(--paper)" }}>{a.label}</div>
              {a.detail ? (
                <div className="faint" style={{ fontSize: 11 }}>
                  {a.detail}
                </div>
              ) : null}
            </button>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: 13, color: "var(--brass)", marginTop: 24 }}>Улики</h2>
      {room.myClues.length === 0 ? (
        <p className="muted">Пока пусто</p>
      ) : (
        room.myClues.map((c) => (
          <div key={c.id} className="card" style={{ marginBottom: 8 }}>
            <div style={{ color: "var(--paper)" }}>{c.title}</div>
            <div className="muted" style={{ fontSize: 13 }}>
              {c.body}
            </div>
          </div>
        ))
      )}
    </main>
  );
}
