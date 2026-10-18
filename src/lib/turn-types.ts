import type { Clue } from "./graph/types";

export type ActionIntent =
  | { type: "wait" }
  | { type: "move"; toLocationId: string }
  | { type: "inspect"; targetId: string }
  | { type: "talk"; npcId: string; optionId: string }
  | { type: "share"; clueId: string }
  | { type: "ability"; abilityId: string; targetId?: string; targetLabel?: string };

export type ActionOption = {
  id: string;
  intent: ActionIntent;
  label: string;
  detail?: string;
  needsTarget?: "person" | "spark" | "any";
};

export type Seat = {
  clientId: string;
  displayName: string;
  characterId: string | null;
};

export type SharePayload = {
  id: string;
  fromName: string;
  locationId: string;
  locationName: string;
  title: string;
  body: string;
  round: number;
};

export type PopupNotice = {
  id: string;
  title: string;
  body: string;
  round: number;
  imageUrl?: string;
};

export type Memory = {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  source?: string;
  round: number;
};

export type InventoryItem = {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
};

export type ActorState = {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
};

export type JournalEntry = {
  id: string;
  round: number;
  title: string;
  body: string;
};

export type CharacterAbilityLine = {
  name: string;
  description: string;
};

export type CharacterOption = {
  id: string;
  /** Название роли, которую берут в лобби. */
  name: string;
  /** Личное имя. Пустое на карточке рисуется прочерком. */
  givenName?: string;
  blurb: string;
  /** Путь и последовательность, если заданы. */
  pathway?: string;
  abilities: CharacterAbilityLine[];
  portraitUrl?: string;
  gender?: "male" | "female";
};

export type SceneHotspot = {
  id: string;
  label: string;
  image?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "inspect" | "npc";
  inspectId?: string;
  npcId?: string;
  talkOptions?: { id: string; label: string }[];
};

export type PartySeatView = {
  clientId: string;
  name: string;
  locationName: string | null;
  ready: boolean;
  playing: boolean;
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
  characterOptions: CharacterOption[];
  myCharacterId: string | null;
  takenCharacterIds: string[];
  myLocationId: string | null;
  myLocationName: string | null;
  myLocationDescription: string | null;
  myLocationImage: string | null;
  myScene: SceneHotspot[];
  hereNpcs: { id: string; name: string; intro?: string; portraitUrl?: string }[];
  hereWith: string[];
  company: { clientId: string; name: string }[];
  availableActions: ActionOption[];
  myIntent: ActionIntent | null;
  intentsReady: number;
  intentsNeeded: number;
  myClues: Clue[];
  myJournal: JournalEntry[];
  myMemories: Memory[];
  myItems: InventoryItem[];
  myStates: ActorState[];
  shareBoard: SharePayload[];
  myPopups: PopupNotice[];
  lastResult: string | null;
  lastPublicEvent: string | null;
  /** Только у хоста: кто в какой комнате. Гостям не отправляется. */
  party?: PartySeatView[];
};
