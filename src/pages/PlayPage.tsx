import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { DataConnection } from "peerjs";
import { PopupModal } from "@/components/PopupModal";
import { CharacterPickCard } from "@/components/CharacterPickCard";
import { PlayConsole } from "@/components/PlayConsole";
import { getClientId } from "@/lib/ids";
import { openGuestPeer, type GuestMsg } from "@/lib/p2p";
import { openGuestRelay } from "@/lib/relay";
import type { TurnSnapshot } from "@/lib/turn-types";

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
    setStatus("Подключение к столу…");

    const relay = openGuestRelay(
      hostPeerId,
      clientId,
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

    let peerDestroy: (() => void) | null = null;
    const hello = { t: "hello", clientId, displayName: "Игрок" } as const;

    relay.whenReady
      .then(() => {
        if (cancelled) return;
        connRef.current = {
          open: true,
          send: (msg: GuestMsg) => relay.send(msg),
        } as unknown as DataConnection;
        connectedRef.current = true;
        setStatus("Связь есть");
        relay.send(hello);
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("Релей недоступен, пробую PeerJS…");
        const { destroy, whenReady } = openGuestPeer(
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
        peerDestroy = destroy;
        whenReady
          .then((conn) => {
            if (cancelled) return;
            connRef.current = conn;
            connectedRef.current = true;
            setStatus("Связь есть");
            conn.send(hello);
          })
          .catch((e) => {
            if (!cancelled) setError(String(e?.type || e?.message || e));
          });
      });

    const hang = window.setTimeout(() => {
      if (!cancelled && !connectedRef.current) {
        setError(
          (prev) =>
            prev ??
            "Не удалось связаться с хостом. Стол открыт и статус «сигнал online»? Если да — обновите QR на компьютере и сканируйте снова.",
        );
      }
    }, 45000);

    return () => {
      cancelled = true;
      window.clearTimeout(hang);
      relay.close();
      peerDestroy?.();
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

  const roles = room.characterOptions ?? [];

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
        <main style={{ maxWidth: 440, margin: "0 auto", padding: 20 }}>
          <p className="brass" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            {room.projectTitle}
          </p>
          <h1 className="font-display" style={{ color: "var(--paper)" }}>
            Стол {room.code}
          </h1>
          <p className="muted">Выберите роль</p>
          {roles.length === 0 ? (
            <p className="danger">Нет персонажей в сценарии.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {roles.map((c) => (
                <CharacterPickCard
                  key={c.id}
                  character={c}
                  selected={room.myCharacterId === c.id}
                  taken={room.takenCharacterIds.includes(c.id)}
                  onClick={() =>
                    send({
                      t: "claim",
                      clientId,
                      characterId: room.myCharacterId === c.id ? null : c.id,
                    })
                  }
                />
              ))}
            </div>
          )}
          {room.myCharacterId ? (
            <p className="muted" style={{ marginTop: 16 }}>
              Ждём «Начать дело» на ПК.
            </p>
          ) : null}
          {actionError ? <p className="danger">{actionError}</p> : null}
        </main>
      ) : (
        <>
          {actionError ? (
            <p className="danger" style={{ maxWidth: 440, margin: "8px auto 0", padding: "0 16px" }}>
              {actionError}
            </p>
          ) : null}
          <PlayConsole
          dock
          room={room}
          onIntent={(intent) => send({ t: "intent", clientId, intent })}
          onInspect={(inspectId) =>
            send({ t: "intent", clientId, intent: { type: "inspect", targetId: inspectId } })
          }
          onTalk={(npcId, optionId) =>
            send({ t: "talk", clientId, npcId, optionId })
          }
          onShare={(memoryId, to) => send({ t: "shareMemory", clientId, memoryId, to })}
          onClear={() => send({ t: "clearIntent", clientId })}
        />
        </>
      )}
    </>
  );
}
