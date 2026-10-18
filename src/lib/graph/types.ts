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
  setFlags?: string[];
  clue?: Clue;
  image?: string;
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

export type GraphLocation = {
  id: string;
  name: string;
  image?: string;
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

export function gateOpen(gate: FlagGate, flags: Record<string, boolean>): boolean {
  if (gate.requiresFlag && !flags[gate.requiresFlag]) return false;
  if (gate.requiresAnyFlags?.length && !gate.requiresAnyFlags.some((f) => flags[f])) {
    return false;
  }
  if (gate.hideIfFlag && flags[gate.hideIfFlag]) return false;
  return true;
}
