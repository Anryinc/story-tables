/** Host↔guest over PeerJS data connections (no server DB). */

import Peer, { type DataConnection } from "peerjs";
import type { ActionIntent, TurnSnapshot } from "./turn-types";

export type GuestMsg =
  | { t: "hello"; clientId: string; displayName?: string }
  | { t: "claim"; clientId: string; characterId: string | null }
  | { t: "start"; clientId: string }
  | { t: "intent"; clientId: string; intent: ActionIntent }
  | { t: "shareMemory"; clientId: string; memoryId: string; to: string }
  | { t: "clearIntent"; clientId: string }
  | { t: "dismissPopup"; clientId: string; popupId: string };

export type HostMsg =
  | { t: "snapshot"; room: TurnSnapshot }
  | { t: "actionResult"; ok: boolean; error?: string };

const PEER_OPTS = {
  debug: 1 as const,
  host: "0.peerjs.com",
  port: 443,
  path: "/",
  secure: true,
  config: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:global.stun.twilio.com:3478" },
    ],
  },
};

export function makeHostPeerId(code: string) {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `st-${code.toLowerCase()}-${suffix}`;
}

export function openHostPeer(
  peerId: string,
  onGuest: (conn: DataConnection, msg: GuestMsg) => void,
  onReady?: (id: string) => void,
  onError?: (err: string) => void,
): Peer {
  const peer = new Peer(peerId, PEER_OPTS);
  peer.on("open", (id) => onReady?.(id));
  peer.on("error", (err) => onError?.(String(err.type || err.message || err)));
  peer.on("connection", (conn) => {
    conn.on("data", (raw) => {
      const msg = raw as GuestMsg;
      if (msg && typeof msg === "object" && "t" in msg) onGuest(conn, msg);
    });
  });
  return peer;
}

export function openGuestPeer(
  hostPeerId: string,
  onHost: (msg: HostMsg) => void,
  onStatus?: (s: string) => void,
): { peer: Peer; whenReady: Promise<DataConnection> } {
  const peer = new Peer(PEER_OPTS);
  const whenReady = new Promise<DataConnection>((resolve, reject) => {
    let settled = false;
    const fail = (e: unknown) => {
      if (settled) return;
      settled = true;
      reject(e);
    };
    const tryConnect = () => {
      onStatus?.(`Подключаюсь к хосту…`);
      const conn = peer.connect(hostPeerId, { reliable: true });
      const t = window.setTimeout(() => {
        if (!settled) {
          onStatus?.("Таймаут канала, повтор…");
          try {
            conn.close();
          } catch {
            /* */
          }
          const conn2 = peer.connect(hostPeerId, { reliable: true });
          wire(conn2);
        }
      }, 8000);
      const wire = (c: DataConnection) => {
        c.on("open", () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(t);
          onStatus?.("Связь с хостом есть");
          resolve(c);
        });
        c.on("data", (raw) => {
          const msg = raw as HostMsg;
          if (msg && typeof msg === "object" && "t" in msg) onHost(msg);
        });
        c.on("error", (e) => onStatus?.(`Ошибка канала: ${String(e)}`));
      };
      wire(conn);
    };
    peer.on("open", () => {
      onStatus?.(`Peer id ${peer.id}`);
      tryConnect();
    });
    peer.on("error", (err) => {
      onStatus?.(`Peer error: ${err.type}`);
      if (err.type === "peer-unavailable") {
        onStatus?.("Хост ещё не в сети, повтор через 2с…");
        window.setTimeout(() => {
          if (!settled && peer.open) tryConnect();
        }, 2000);
        return;
      }
      fail(err);
    });
  });
  return { peer, whenReady };
}
