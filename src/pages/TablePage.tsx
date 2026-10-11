import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { DataConnection } from "peerjs";
import { PopupModal } from "@/components/PopupModal";
import { getClientId } from "@/lib/ids";
import {
  makeHostPeerId,
  openHostPeer,
  type GuestMsg,
  type HostMsg,
} from "@/lib/p2p";
import { resolvePlayable } from "@/lib/scenario/resolve";
import { TurnEngine } from "@/lib/turn-engine";
import type { ActionIntent, TurnSnapshot } from "@/lib/turn-types";
import QRCode from "qrcode";

export function TablePage() {
  const { code = "" } = useParams();
  const clientId = useMemo(() => getClientId(), []);
  const projectId = sessionStorage.getItem("story-tables.project") ?? "cherwood";
  const pack = useMemo(() => resolvePlayable(projectId), [projectId]);
  const engineRef = useRef<TurnEngine | null>(null);
  const connsRef = useRef<Map<string, DataConnection>>(new Map());
  const [room, setRoom] = useState<TurnSnapshot | null>(null);
  const [hostPeerId, setHostPeerId] = useState<string | null>(null);
  const [peerReady, setPeerReady] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const [qr, setQr] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const pushAll = () => {
    const eng = engineRef.current;
    if (!eng) return;
    setRoom(eng.snapshotFor(clientId));
    for (const [guestId, conn] of connsRef.current) {
      if (!conn.open) continue;
      const msg: HostMsg = { t: "snapshot", room: eng.snapshotFor(guestId) };
      try {
        conn.send(msg);
      } catch {
        /* */
      }
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
      pack.characters,
      pack.loreBaseId,
      pack.playersMax,
    );
    engineRef.current = eng;
    setRoom(eng.snapshotFor(clientId));
    const unsub = eng.subscribe(() => pushAll());

    const peerId = makeHostPeerId(code);
    setHostPeerId(peerId);

    const peer = openHostPeer(
      peerId,
      (conn, msg) => handleGuest(conn, msg),
      (id) => {
        setPeerReady(true);
        setHostPeerId(id);
      },
      (e) => setErr(`PeerJS: ${e}`),
    );

    function handleGuest(conn: DataConnection, msg: GuestMsg) {
      const eng = engineRef.current;
      if (!eng) return;

      if (msg.t === "hello") {
        connsRef.current.set(msg.clientId, conn);
        setGuestCount(connsRef.current.size);
        eng.ensureSeat(msg.clientId, msg.displayName);
        try {
          conn.send({
            t: "snapshot",
            room: eng.snapshotFor(msg.clientId),
          } satisfies HostMsg);
        } catch {
          /* */
        }
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
      } else if (msg.t === "dismissPopup") {
        eng.dismissPopup(msg.clientId, msg.popupId);
      }
      try {
        conn.send(result);
      } catch {
        /* */
      }
      pushAll();
    }

    return () => {
      unsub();
      peer.destroy();
      engineRef.current = null;
      connsRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, clientId, pack]);

  useEffect(() => {
    if (!hostPeerId || !code) return;
    const playUrl = `${window.location.origin}/play/${code.toUpperCase()}?h=${encodeURIComponent(hostPeerId)}`;
    void QRCode.toDataURL(playUrl, {
      width: 220,
      margin: 1,
      color: { dark: "#e8e2d6", light: "#0c0b0a" },
    }).then(setQr);
  }, [hostPeerId, code]);

  if (!pack) {
    return (
      <main style={{ padding: 40 }}>
        <p>Нет проекта.</p>
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
  const topPopup = room.myPopups?.[0] ?? null;
  const roles = room.characterOptions ?? [];
  const playUrl =
    hostPeerId &&
    `${typeof window !== "undefined" ? window.location.origin : ""}/play/${code.toUpperCase()}?h=${hostPeerId}`;

  return (
    <>
      {topPopup ? (
        <PopupModal
          popup={topPopup}
          onDismiss={() => {
            engineRef.current?.dismissPopup(clientId, topPopup.id);
            pushAll();
          }}
        />
      ) : null}

      <main style={{ maxWidth: 920, margin: "0 auto", padding: 20 }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p className="brass" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Хаб · {peerReady ? "сигнал online" : "ждём PeerJS…"} · гостей:{" "}
              {guestCount}
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
            {err ? <p className="danger">{err}</p> : null}
            {playUrl ? (
              <p className="faint" style={{ fontSize: 11, wordBreak: "break-all", maxWidth: 420 }}>
                Ссылка: {playUrl}
              </p>
            ) : null}
          </div>
          {qr ? (
            <div className="card" style={{ textAlign: "center" }}>
              <img src={qr} alt="QR" width={180} height={180} />
            </div>
          ) : null}
        </header>

        {board ? (
          <section className="card" style={{ marginTop: 20 }}>
            <p className="brass" style={{ fontSize: 11 }}>Share · {board.fromName}</p>
            <h2 className="font-display" style={{ color: "var(--paper)" }}>
              {board.title}
            </h2>
            <p className="muted">{board.body}</p>
          </section>
        ) : null}

        {room.status === "lobby" ? (
          <section className="card" style={{ marginTop: 20 }}>
            <h3 style={{ color: "var(--paper)" }}>1. Роль</h3>
            {roles.length === 0 ? (
              <p className="danger">
                В сценарии нет персонажей. Откройте мастерскую → вкладка
                «Персонажи».
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {roles.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="btn"
                    disabled={
                      room.takenCharacterIds.includes(c.id) &&
                      room.myCharacterId !== c.id
                    }
                    onClick={() => {
                      engineRef.current?.claim(
                        clientId,
                        room.myCharacterId === c.id ? null : c.id,
                      );
                      pushAll();
                    }}
                    style={{
                      borderColor:
                        room.myCharacterId === c.id ? "var(--paper)" : undefined,
                      height: "auto",
                      padding: "10px 12px",
                      textAlign: "left",
                    }}
                  >
                    <div>{c.name}</div>
                    {c.pathway ? (
                      <div className="faint" style={{ fontSize: 11 }}>
                        {c.pathway}
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 16 }}
              disabled={!room.takenCharacterIds.length}
              onClick={() => {
                const r = engineRef.current?.start(clientId);
                if (r && !r.ok) setErr(r.error ?? "Ошибка");
                else setErr(null);
                pushAll();
              }}
            >
              Начать дело
            </button>
          </section>
        ) : (
          <section style={{ marginTop: 20, display: "grid", gap: 12 }}>
            {room.myCharacterId ? (
              <div className="card">
                <p className="brass" style={{ fontSize: 11 }}>
                  Ваш ход · {room.myLocationName}
                </p>
                {room.lastResult ? (
                  <p className="muted">{room.lastResult}</p>
                ) : null}
                {room.myIntent ? (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      engineRef.current?.clearIntent(clientId);
                      pushAll();
                    }}
                  >
                    Отменить ход
                  </button>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {room.availableActions.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        className="btn"
                        style={{ height: "auto", padding: 12, textAlign: "left" }}
                        onClick={() => {
                          engineRef.current?.submitIntent(
                            clientId,
                            a.intent as ActionIntent,
                          );
                          pushAll();
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
              </div>
            ) : null}
          </section>
        )}

        <p className="faint" style={{ marginTop: 24 }}>
          <Link to="/">← Сценарии</Link>
        </p>
      </main>
    </>
  );
}
