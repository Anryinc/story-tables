export type FlagGate = {
  requiresFlag?: string;
  requiresAnyFlags?: string[];
  hideIfFlag?: string;
};

export type GraphExit = FlagGate & { to: string; label?: string };

export type Clue = {
  id: string;
  title: string;
  body: string;
  source: string;
};

export type GraphInspectable = FlagGate & {
  id: string;
  label: string;
  result: string;
  once?: boolean;
  /** each — каждый игрок сам; world — первый забирает у всех. */
  audience?: "each" | "world";
  setFlags?: string[];
  clue?: Clue;
  image?: string;
  item?: { id: string; title: string; body: string; imageUrl?: string };
  grantState?: { id: string; title: string; body: string; imageUrl?: string };
  requiresState?: string;
};

export type GraphTalkOption = FlagGate & {
  id: string;
  label: string;
  reply: string;
  once?: boolean;
  setFlags?: string[];
  clue?: Clue;
};

export type GraphNpc = FlagGate & {
  id: string;
  name: string;
  intro?: string;
  portraitUrl?: string;
  options: GraphTalkOption[];
};

export type GraphScenePin = {
  id: string;
  label?: string;
  url?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  linkNodeId?: string;
  interaction?: "none" | "inspect" | "talk";
};

export type GraphBackground = {
  url: string;
  requiresFlag?: string;
  atRound?: number;
};

export type GraphLocation = {
  id: string;
  name: string;
  image?: string;
  backgrounds?: GraphBackground[];
  description?: string;
  exits: GraphExit[];
  inspect: GraphInspectable[];
  npcs?: GraphNpc[];
  scene?: GraphScenePin[];
};

export type GraphDocument = {
  version: 1;
  startLocationId: string;
  locations: Record<string, GraphLocation>;
};

export function pickLocationImage(
  loc: GraphLocation | undefined,
  flags: Record<string, boolean>,
  round: number,
): string | null {
  if (!loc) return null;
  const list = loc.backgrounds ?? [];
  const match = list.slice(1).find((b) => {
    if (b.requiresFlag && !flags[b.requiresFlag]) return false;
    if (b.atRound != null && round < b.atRound) return false;
    return Boolean(b.requiresFlag || b.atRound != null);
  });
  return match?.url || list[0]?.url || loc.image || null;
}

export function gateOpen(gate: FlagGate, flags: Record<string, boolean>): boolean {
  if (gate.requiresFlag && !flags[gate.requiresFlag]) return false;
  if (gate.requiresAnyFlags?.length && !gate.requiresAnyFlags.some((f) => flags[f])) {
    return false;
  }
  if (gate.hideIfFlag && flags[gate.hideIfFlag]) return false;
  return true;
}
