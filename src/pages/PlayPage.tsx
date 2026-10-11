import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { DataConnection } from "peerjs";
import { PopupModal } from "@/components/PopupModal";
import { getClientId } from "@/lib/ids";
import { openGuestPeer, type GuestMsg } from "@/lib/p2p";
import type { ActionIntent, TurnSnapshot } from "@/lib/turn-types";
import { ROSTER } from "@/projects/roster";

export function PlayPage() {
  const { code = "" } = useParams();
  const [params] = useSearchParams();
  const hostPeerId = params.get("h") || params.get("host") || "";
  const clientId = useMemo(() => getClientId(), []);
  const connRef = useRef<DataConnection | null>(null);
  const connectedRef = useRef(false);
  const [room, setRoom] = useState<TurnSnapshot | null>(null);
  const [status, setStatus] = useState("Инициализация…");
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const send = (msg: GuestMsg) => {
    const c = connRef.current;
    if (!c || !c.open) {
      setActionError("Нет связи с хостом");
      return;
    }
    try {
      c.send(msg);
    } catch (e) {
      setActionError(String(e));
    }
  };

  useEffect(() => {
    if (!code) return;
    if (!hostPeerId) {
      setError(
        "В ссылке нет id хоста. Откройте свежий QR со стола (URL с ?h=…).",
      );
      return;
    }

    let cancelled = false;
    connectedRef.current = false;
    setError(null);
    setStatus("Подключение к PeerJS…");

    const { peer, whenReady } = openGuestPeer(
      hostPeerId,
      (msg) => {
        if (msg.t === "snapshot") setRoom(msg.room);
        if (msg.t === "actionResult" && !msg.ok)
          setActionError(msg.error ?? "Ошибка");
        if (msg.t === "actionResult" && msg.ok) setActionError(null);
      },
      (s) => {
        if (!cancelled) setStatus(s);
      },
    );

    whenReady
      .then((conn) => {
        if (cancelled) return;
        connRef.current = conn;
        connectedRef.current = true;
        setStatus("Связь есть");
        conn.send({
          t: "hello",
          clientId,
          displayName: "Игрок",
        } satisfies GuestMsg);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e?.type || e?.message || e));
      });

    const hang = window.setTimeout(() => {
      if (!cancelled && !connectedRef.current) {
        setError(
          (prev) =>
            prev ??
            "Не удалось связаться с хостом. Стол открыт? Статус «сигнал online»? QR свежий?",
        );
      }
    }, 20000);

    return () => {
      cancelled = true;
      window.clearTimeout(hang);
      peer.destroy();
      connRef.current = null;
    };
  }, [code, clientId, hostPeerId, retryKey]);

  const topPopup = room?.myPopups?.[0] ?? null;

  if (!hostPeerId || (error && !room)) {
    return (
      <main style={{ padding: 32, textAlign: "center" }}>
        <h1 className="font-display">Стол</h1>
        <p className="muted">{error || "Нет id хоста"}</p>
        <p className="faint">Код {code.toUpperCase()}</p>
        <p className="faint" style={{ fontSize: 12 }}>
          {status}
        </p>
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: 16 }}
          onClick={() => {
            setError(null);
            setRetryKey((k) => k + 1);
          }}
        >
          Повторить
        </button>
        <div style={{ marginTop: 12 }}>
          <Link to="/">Хаб</Link>
        </div>
      </main>
    );
  }

  if (!room) {
    return (
      <main style={{ padding: 32, textAlign: "center" }}>
        <p className="font-display" style={{ fontSize: 28 }}>
          Садимся за стол…
        </p>
        <p className="muted" style={{ fontSize: 13 }}>
          {status}
        </p>
      </main>
    );
  }

  return (
    <>
      {topPopup ? (
        <PopupModal
          popup={topPopup}
          onDismiss={() =>
            send({ t: "dismissPopup", clientId, popupId: topPopup.id })
          }
        />
      ) : null}

      {room.status === "lobby" || !room.myCharacterId ? (
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
                disabled={
                  room.takenCharacterIds.includes(c.id) && room.myCharacterId !== c.id
                }
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
              Ждём «Начать дело» на ПК.
            </p>
          ) : null}
          {actionError ? <p className="danger">{actionError}</p> : null}
        </main>
      ) : (
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
                  onClick={() =>
                    send({
                      t: "intent",
                      clientId,
                      intent: a.intent as ActionIntent,
                    })
                  }
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
      )}
    </>
  );
}
