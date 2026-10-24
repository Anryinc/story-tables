/** Multi-guest relay over a public MQTT broker. PeerJS only seats one phone. */

import mqtt, { type MqttClient } from "mqtt";
import type { GuestMsg, HostMsg } from "./p2p";

const BROKER = "wss://broker.hivemq.com:8884/mqtt";

export type RelayConn = {
  open: boolean;
  send: (msg: HostMsg | GuestMsg) => void;
  close: () => void;
  on: (ev: "close", fn: () => void) => void;
};

function topic(room: string, tail: string) {
  return `story-tables/${room}/${tail}`;
}

export function openHostRelay(
  roomKey: string,
  onGuest: (conn: RelayConn, msg: GuestMsg) => void,
  onReady?: () => void,
  onError?: (err: string) => void,
): { close: () => void } {
  const client = mqtt.connect(BROKER, {
    clientId: `sth-${roomKey}-${Math.random().toString(36).slice(2, 8)}`,
    clean: true,
    reconnectPeriod: 2000,
    connectTimeout: 10000,
    protocolVersion: 4,
  });
  const guests = new Map<string, RelayConn>();

  const sendTo = (clientId: string, msg: HostMsg) => {
    client.publish(topic(roomKey, `g/${clientId}`), JSON.stringify(msg), { qos: 0 });
  };

  client.on("connect", () => {
    client.subscribe(topic(roomKey, "in"), { qos: 0 }, (err) => {
      if (err) onError?.(String(err));
      else onReady?.();
    });
  });
  client.on("error", (err) => onError?.(String(err.message || err)));
  client.on("message", (_t, payload) => {
    let msg: GuestMsg;
    try {
      msg = JSON.parse(payload.toString()) as GuestMsg;
    } catch {
      return;
    }
    if (!msg || typeof msg !== "object" || !("t" in msg) || !msg.clientId) return;
    let conn = guests.get(msg.clientId);
    if (!conn) {
      const listeners: Array<() => void> = [];
      conn = {
        open: true,
        send: (out) => sendTo(msg.clientId, out as HostMsg),
        close: () => {
          conn!.open = false;
          guests.delete(msg.clientId);
          listeners.forEach((fn) => fn());
        },
        on: (_ev, fn) => {
          listeners.push(fn);
        },
      };
      guests.set(msg.clientId, conn);
    }
    onGuest(conn, msg);
  });

  return {
    close: () => {
      try {
        client.end(true);
      } catch {
        /* */
      }
    },
  };
}

export function openGuestRelay(
  roomKey: string,
  clientId: string,
  onHost: (msg: HostMsg) => void,
  onStatus?: (s: string) => void,
): { send: (msg: GuestMsg) => void; whenReady: Promise<void>; close: () => void } {
  const client: MqttClient = mqtt.connect(BROKER, {
    clientId: `stg-${clientId.slice(0, 8)}-${Math.random().toString(36).slice(2, 6)}`,
    clean: true,
    reconnectPeriod: 2000,
    connectTimeout: 10000,
    protocolVersion: 4,
  });
  let ready = false;
  const whenReady = new Promise<void>((resolve, reject) => {
    const t = window.setTimeout(() => {
      if (!ready) reject(new Error("relay-timeout"));
    }, 12000);
    client.on("connect", () => {
      onStatus?.("Релей открыт, жду стол…");
      client.subscribe(topic(roomKey, `g/${clientId}`), { qos: 0 }, (err) => {
        if (err) {
          reject(err);
          return;
        }
        ready = true;
        window.clearTimeout(t);
        onStatus?.("Связь со столом есть");
        resolve();
      });
    });
    client.on("error", (err) => {
      onStatus?.(`Релей: ${err.message || err}`);
      if (!ready) reject(err);
    });
  });
  client.on("message", (_t, payload) => {
    try {
      const msg = JSON.parse(payload.toString()) as HostMsg;
      if (msg && typeof msg === "object" && "t" in msg) onHost(msg);
    } catch {
      /* */
    }
  });
  return {
    whenReady,
    send: (msg) => {
      client.publish(topic(roomKey, "in"), JSON.stringify(msg), { qos: 0 });
    },
    close: () => {
      try {
        client.end(true);
      } catch {
        /* */
      }
    },
  };
}
