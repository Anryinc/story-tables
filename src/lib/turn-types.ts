import type { Clue } from "./graph/types";

export type ActionIntent =
  | { type: "wait" }
  | { type: "move"; toLocationId: string }
  | { type: "inspect"; targetId: string }
  | { type: "talk"; npcId: string; optionId: string }
  | { type: "share"; clueId: string };

export type ActionOption = {
  id: string;
  intent: ActionIntent;
  label: string;
  detail?: string;
};

export type Seat = {
  clientId: string;
  displayName: string;
  characterId: string | null;
};

export type SharePayload = {
  id: string;
  fromName: string;
  locationName: string;
  title: string;
  body: string;
  round: number;
};

export type JournalEntry = {
  id: string;
  round: number;
  title: string;
  body: string;
};

export type TurnSnapshot = {
  code: string;
  projectId: string;
  projectTitle: string;
  isHost: boolean;
  status: "lobby" | "playing";
  phase: "lobby" | "planning";
  round: number;
  seats: Seat[];
  myCharacterId: string | null;
  takenCharacterIds: string[];
  myLocationId: string | null;
  myLocationName: string | null;
  myLocationImage: string | null;
  hereNpcs: { id: string; name: string; intro?: string }[];
  hereWith: string[];
  availableActions: ActionOption[];
  myIntent: ActionIntent | null;
  intentsReady: number;
  intentsNeeded: number;
  myClues: Clue[];
  myJournal: JournalEntry[];
  shareBoard: SharePayload[];
  lastResult: string | null;
  lastPublicEvent: string | null;
};
