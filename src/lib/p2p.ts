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

/** Pure PeerJS defaults. Custom ICE was dropping the broker socket. */
const PEER_OPTS = {
  debug: 1 as const,
  host: "0.peerjs.com",
  port: 443,
  path: "/",
  secure: true,
};

const CONNECT_OPTS = { serialization: "json" as const };

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
  peer.on("disconnected", () => {
    if (peer.destroyed) return;
    try {
      peer.reconnect();
    } catch {
      /* */
    }
  });
  peer.on("connection", (conn) => {
    const handle = (raw: unknown) => {
      const msg = raw as GuestMsg;
      if (msg && typeof msg === "object" && "t" in msg) onGuest(conn, msg);
    };
    conn.on("data", handle);
    conn.on("open", () => {
      /* channel ready */
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
    let attempt = 0;
    const fail = (e: unknown) => {
      if (settled) return;
      settled = true;
      reject(e);
    };
    const tryConnect = () => {
      if (settled || !peer.open) return;
      attempt += 1;
      onStatus?.(`Подключаюсь к хосту… (${attempt})`);
      const conn = peer.connect(hostPeerId, CONNECT_OPTS);
      let timed = false;
      const t = window.setTimeout(() => {
        if (settled || timed) return;
        timed = true;
        onStatus?.("Таймаут канала, повтор…");
        try {
          conn.close();
        } catch {
          /* */
        }
        if (attempt < 4) window.setTimeout(tryConnect, 1500);
      }, 12000);
      conn.on("open", () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(t);
        onStatus?.("Связь с хостом есть");
        resolve(conn);
      });
      conn.on("data", (raw) => {
        const msg = raw as HostMsg;
        if (msg && typeof msg === "object" && "t" in msg) onHost(msg);
      });
      conn.on("error", (e) => {
        onStatus?.(`Ошибка канала: ${String(e)}`);
        if (!settled && attempt < 4) {
          window.clearTimeout(t);
          window.setTimeout(tryConnect, 1500);
        }
      });
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
      if (
        err.type === "network" ||
        err.type === "server-error" ||
        err.type === "socket-error"
      ) {
        onStatus?.("Брокер не отвечает, повтор…");
        window.setTimeout(() => {
          if (!settled && peer.open) tryConnect();
        }, 2500);
        return;
      }
      fail(err);
    });
  });
  return { peer, whenReady };
}
