/** Host↔guest over PeerJS data connections (no server DB). */

import Peer, { type DataConnection } from "peerjs";
import type { ActionIntent, TurnSnapshot } from "./turn-types";

export type GuestMsg =
  | { t: "hello"; clientId: string; displayName?: string }
  | { t: "claim"; clientId: string; characterId: string | null }
  | { t: "start"; clientId: string }
  | { t: "intent"; clientId: string; intent: ActionIntent }
  | { t: "clearIntent"; clientId: string };

export type HostMsg =
  | { t: "snapshot"; room: TurnSnapshot }
  | { t: "actionResult"; ok: boolean; error?: string };

export function hostPeerId(code: string) {
  return `storytables-host-${code.toUpperCase()}`;
}

export function openHostPeer(
  code: string,
  onGuest: (conn: DataConnection, msg: GuestMsg) => void,
): Peer {
  const peer = new Peer(hostPeerId(code), { debug: 1 });
  peer.on("connection", (conn) => {
    conn.on("data", (raw) => {
      const msg = raw as GuestMsg;
      if (msg && typeof msg === "object" && "t" in msg) onGuest(conn, msg);
    });
  });
  return peer;
}

export function openGuestPeer(
  code: string,
  onHost: (msg: HostMsg) => void,
): { peer: Peer; whenReady: Promise<DataConnection> } {
  const peer = new Peer({ debug: 1 });
  const whenReady = new Promise<DataConnection>((resolve, reject) => {
    peer.on("open", () => {
      const conn = peer.connect(hostPeerId(code), { reliable: true });
      conn.on("open", () => resolve(conn));
      conn.on("error", reject);
      conn.on("data", (raw) => {
        const msg = raw as HostMsg;
        if (msg && typeof msg === "object" && "t" in msg) onHost(msg);
      });
    });
    peer.on("error", reject);
  });
  return { peer, whenReady };
}
