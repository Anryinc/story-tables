export function newId(): string {
  return crypto.randomUUID().slice(0, 8);
}

export function makeRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  const buf = crypto.getRandomValues(new Uint8Array(4));
  for (const b of buf) s += alphabet[b % alphabet.length];
  return s;
}

export function getClientId(): string {
  const key = "story-tables.clientId";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}
