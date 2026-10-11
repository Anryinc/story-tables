import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { DataConnection } from "peerjs";
import { getClientId } from "@/lib/ids";
import { openHostPeer, type GuestMsg, type HostMsg } from "@/lib/p2p";
import { resolvePlayable } from "@/lib/scenario/resolve";
import { TurnEngine } from "@/lib/turn-engine";
import type { TurnSnapshot } from "@/lib/turn-types";
import { ROSTER } from "@/projects/roster";
import QRCode from "qrcode";

export function TablePage() {
  const { code = "" } = useParams();
  const clientId = useMemo(() => getClientId(), []);
  const projectId = sessionStorage.getItem("story-tables.project") ?? "cherwood";
  const pack = useMemo(() => resolvePlayable(projectId), [projectId]);
  const engineRef = useRef<TurnEngine | null>(null);
  const connsRef = useRef<Map<string, DataConnection>>(new Map());
  const [room, setRoom] = useState<TurnSnapshot | null>(null);
  const [peerReady, setPeerReady] = useState(false);
  const [qr, setQr] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const pushAll = () => {
    const eng = engineRef.current;
    if (!eng) return;
    setRoom(eng.snapshotFor(clientId));
    for (const [guestId, conn] of connsRef.current) {
      const msg: HostMsg = { t: "snapshot", room: eng.snapshotFor(guestId) };
      if (conn.open) conn.send(msg);
    }
  };

  useEffect(() => {
    if (!pack || !code) return;
    const eng = new TurnEngine(
      code,
      clientId,
      pack.projectId,
      pack.title,
      pack.graph,
      pack.timeline,
    );
    engineRef.current = eng;
    setRoom(eng.snapshotFor(clientId));
    const unsub = eng.subscribe(pushAll);

    const peer = openHostPeer(code, (conn, msg) => handleGuest(conn, msg));
    peer.on("open", () => setPeerReady(true));
    peer.on("error", (e) => setErr(String(e)));

    const playUrl = `${window.location.origin}/play/${code.toUpperCase()}`;
    void QRCode.toDataURL(playUrl, { width: 200, margin: 1 }).then(setQr);

    function handleGuest(conn: DataConnection, msg: GuestMsg) {
      const eng = engineRef.current;
      if (!eng) return;
      if (msg.t === "hello") {
        connsRef.current.set(msg.clientId, conn);
        eng.ensureSeat(msg.clientId, msg.displayName);
        conn.send({ t: "snapshot", room: eng.snapshotFor(msg.clientId) } satisfies HostMsg);
        pushAll();
        return;
      }
      let result: HostMsg = { t: "actionResult", ok: true };
      if (msg.t === "claim") {
        const r = eng.claim(msg.clientId, msg.characterId);
        result = { t: "actionResult", ok: r.ok, error: r.error };
      } else if (msg.t === "start") {
        const r = eng.start(msg.clientId);
        result = { t: "actionResult", ok: r.ok, error: r.error };
      } else if (msg.t === "intent") {
        const r = eng.submitIntent(msg.clientId, msg.intent);
        result = { t: "actionResult", ok: r.ok, error: r.error };
      } else if (msg.t === "clearIntent") {
        eng.clearIntent(msg.clientId);
      }
      conn.send(result);
      pushAll();
    }

    return () => {
      unsub();
      peer.destroy();
      engineRef.current = null;
    };
  }, [code, clientId, pack]);

  if (!pack) {
    return (
      <main style={{ padding: 40 }}>
        <p>Нет проекта. Создайте сценарий в мастерской.</p>
        <Link to="/">Сценарии</Link>
      </main>
    );
  }

  if (!room) {
    return (
      <main style={{ padding: 40 }} className="font-display">
        Зажигаем лампы…
      </main>
    );
  }

  const board = room.shareBoard[0];

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <p className="brass" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Хаб стола · {peerReady ? "PeerJS online" : "подключение…"}
          </p>
          <h1 className="font-display" style={{ margin: "4px 0", color: "var(--paper)" }}>
            {room.projectTitle}
          </h1>
          <p className="muted">
            Код <strong style={{ color: "var(--paper)" }}>{room.code}</strong>
            {room.status === "playing"
              ? ` · раунд ${room.round} · ходы ${room.intentsReady}/${room.intentsNeeded}`
              : " · лобби"}
          </p>
          {room.lastPublicEvent ? (
            <p className="faint" style={{ fontSize: 12 }}>
              {room.lastPublicEvent}
            </p>
          ) : null}
          {err ? <p className="danger">{err}</p> : null}
        </div>
        {qr ? (
          <div className="card" style={{ textAlign: "center" }}>
            <img src={qr} alt="QR" width={160} height={160} />
            <p className="faint" style={{ fontSize: 11 }}>
              Телефоны → /play/{room.code}
            </p>
          </div>
        ) : null}
      </header>

      {board ? (
        <section className="card" style={{ marginTop: 20 }}>
          <p className="brass" style={{ fontSize: 11, textTransform: "uppercase" }}>
            На экране · {board.locationName} · {board.fromName}
          </p>
          <h2 className="font-display" style={{ color: "var(--paper)", margin: "8px 0" }}>
            {board.title}
          </h2>
          <p className="muted">{board.body}</p>
        </section>
      ) : null}

      {room.status === "lobby" ? (
        <section className="card" style={{ marginTop: 20 }}>
          <h3 style={{ color: "var(--paper)" }}>Роль на этом ПК (опционально)</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ROSTER.map((c) => (
              <button
                key={c.id}
                type="button"
                className="btn"
                disabled={room.takenCharacterIds.includes(c.id) && room.myCharacterId !== c.id}
                onClick={() => {
                  engineRef.current?.claim(
                    clientId,
                    room.myCharacterId === c.id ? null : c.id,
                  );
                  pushAll();
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: 16, width: "100%" }}
            onClick={() => {
              const r = engineRef.current?.start(clientId);
              if (r && !r.ok) setErr(r.error ?? "Ошибка");
              pushAll();
            }}
          >
            Начать дело
          </button>
        </section>
      ) : (
        <section style={{ marginTop: 20, display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <div className="card">
            <p className="brass" style={{ fontSize: 11, textTransform: "uppercase" }}>
              За столом
            </p>
            <ul style={{ margin: "8px 0", paddingLeft: 18 }}>
              {room.seats
                .filter((s) => s.characterId)
                .map((s) => (
                  <li key={s.clientId}>{s.displayName}</li>
                ))}
            </ul>
          </div>
          <div className="card">
            <p className="brass" style={{ fontSize: 11, textTransform: "uppercase" }}>
              Доска share
            </p>
            {room.shareBoard.length === 0 ? (
              <p className="muted">Пока пусто</p>
            ) : (
              room.shareBoard.map((s) => (
                <div key={s.id} style={{ marginTop: 8 }}>
                  <div style={{ color: "var(--paper)" }}>{s.title}</div>
                  <div className="faint" style={{ fontSize: 11 }}>
                    {s.fromName} · {s.locationName}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      <p className="faint" style={{ marginTop: 24, fontSize: 12 }}>
        <Link to="/">← Сценарии</Link>
      </p>
    </main>
  );
}
