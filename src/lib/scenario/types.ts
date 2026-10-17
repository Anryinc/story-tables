/** Canonical scenario document edited in Studio and played by TurnEngine. */

export type NodeKind =
  | "start"
  | "location"
  | "event"
  | "branch"
  | "timeline"
  | "npc"
  | "inspect";

export type EventScope = "actor" | "same_location" | "all";

export type ScenarioPort = {
  id: string;
  label: string;
  dir: "in" | "out";
  kind?: "move" | "flow" | "data";
};

export type SceneObject = {
  id: string;
  kind: "image" | "text" | "hotspot" | "npc" | "sound";
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  text?: string;
  assetId?: string;
  url?: string;
  linkNodeId?: string;
  interaction?: "none" | "inspect" | "talk";
};

export type TimelineMarker = {
  id: string;
  atRound: number;
  title: string;
  body: string;
  scope: EventScope;
  scopeLocationId?: string;
  setFlags?: string[];
  grantClue?: { id: string; title: string; body: string; source: string; imageUrl?: string };
  unlockLocationId?: string;
  requiresAbilityId?: string;
  requiresAbilityUsed?: string;
  requiresFlag?: string;
  requiresAnyFlags?: string[];
  hideIfFlag?: string;
};

export type ScenarioTalkOption = {
  id: string;
  label: string;
  reply: string;
  once?: boolean;
  setFlags?: string[];
  requiresFlag?: string;
  requiresAnyFlags?: string[];
  hideIfFlag?: string;
  grantClue?: { id: string; title: string; body: string; source: string; imageUrl?: string };
};

export type ScenarioNodeData = {
  title: string;
  locationId?: string;
  background?: string;
  backgroundAssetId?: string;
  description?: string;
  sceneObjects?: SceneObject[];
  body?: string;
  scope?: EventScope;
  scopeLocationId?: string;
  setFlags?: string[];
  grantClue?: { id: string; title: string; body: string; source: string; imageUrl?: string };
  unlockLocationId?: string;
  atRound?: number;
  flag?: string;
  inspectLabel?: string;
  inspectResult?: string;
  once?: boolean;
  npcName?: string;
  npcIntro?: string;
  /** Если задан, компилятор берёт эти реплики вместо одной «Поговорить». */
  talkOptions?: ScenarioTalkOption[];
  portraitUrl?: string;
  portraitAssetId?: string;
  soundUrl?: string;
  soundAssetId?: string;
  requiresAbilityId?: string;
  requiresAbilityUsed?: string;
  requiresFlag?: string;
  requiresAnyFlags?: string[];
  hideIfFlag?: string;
};

export type ScenarioNode = {
  id: string;
  kind: NodeKind;
  x: number;
  y: number;
  data: ScenarioNodeData;
  ports: ScenarioPort[];
};

export type ScenarioEdge = {
  id: string;
  from: string;
  fromPort: string;
  to: string;
  toPort: string;
  label?: string;
  requiresFlag?: string;
  requiresAnyFlags?: string[];
  hideIfFlag?: string;
};

export type ScenarioManifest = {
  id: string;
  title: string;
  subtitle?: string;
  blurb: string;
  coverImage?: string;
  playersMin: number;
  playersMax: number;
  status: "draft" | "playable";
  version: string;
  updatedAt: string;
};

/** Playable role defined in Studio → Characters tab. */
export type ScenarioCharacter = {
  id: string;
  name: string;
  blurb: string;
  portraitUrl?: string;
  portraitAssetId?: string;
  lore?: {
    baseId: string;
    pathwayId: string;
    sequenceRank: 9 | 8 | 7 | 6 | 5 | 4;
    enabledAbilityIds?: string[];
  };
};

export type ScenarioDocument = {
  version: 1;
  manifest: ScenarioManifest;
  nodes: ScenarioNode[];
  edges: ScenarioEdge[];
  initialFlags?: string[];
  assetIds?: string[];
  timeline?: TimelineMarker[];
  /** Active lore pack id (e.g. "lotm") */
  loreBaseId?: string;
  /** Roles available at the table */
  characters?: ScenarioCharacter[];
};

export const NODE_META: Record<
  NodeKind,
  { label: string; color: string; fill: string; defaultPorts: ScenarioPort[] }
> = {
  start: {
    label: "Старт",
    color: "#8bc49a",
    fill: "#1a2e22",
    defaultPorts: [{ id: "out", label: "старт →", dir: "out", kind: "move" }],
  },
  location: {
    label: "Локация",
    color: "#c4a574",
    fill: "#2a2218",
    defaultPorts: [
      { id: "in", label: "вход", dir: "in", kind: "move" },
      { id: "out", label: "выход", dir: "out", kind: "move" },
      { id: "events", label: "события", dir: "out", kind: "flow" },
    ],
  },
  event: {
    label: "Событие",
    color: "#c77a9a",
    fill: "#2a1822",
    defaultPorts: [
      { id: "in", label: "вход", dir: "in", kind: "flow" },
      { id: "out", label: "далее", dir: "out", kind: "flow" },
    ],
  },
  branch: {
    label: "Ветка",
    color: "#d4a574",
    fill: "#2a2418",
    defaultPorts: [
      { id: "in", label: "вход", dir: "in", kind: "flow" },
      { id: "yes", label: "да", dir: "out", kind: "flow" },
      { id: "no", label: "нет", dir: "out", kind: "flow" },
    ],
  },
  timeline: {
    label: "Ход N",
    color: "#7aa2c7",
    fill: "#18222a",
    defaultPorts: [{ id: "out", label: "в раунде →", dir: "out", kind: "flow" }],
  },
  npc: {
    label: "NPC",
    color: "#8bc4b0",
    fill: "#182a24",
    defaultPorts: [
      { id: "in", label: "в локации", dir: "in", kind: "flow" },
      { id: "out", label: "реплика", dir: "out", kind: "flow" },
    ],
  },
  inspect: {
    label: "Осмотр",
    color: "#9a8bc4",
    fill: "#22182a",
    defaultPorts: [
      { id: "in", label: "в локации", dir: "in", kind: "flow" },
      { id: "out", label: "результат", dir: "out", kind: "flow" },
    ],
  },
};

export function createNode(kind: NodeKind, x: number, y: number): ScenarioNode {
  const meta = NODE_META[kind];
  const id = `${kind}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    kind,
    x,
    y,
    data: {
      title: meta.label,
      locationId: kind === "location" ? id : undefined,
      scope: kind === "event" ? "actor" : undefined,
      atRound: kind === "timeline" ? 1 : undefined,
      once: kind === "inspect" ? true : undefined,
      sceneObjects: kind === "location" ? [] : undefined,
    },
    ports: meta.defaultPorts.map((p) => ({ ...p })),
  };
}

export function createCharacter(name = "Новый персонаж"): ScenarioCharacter {
  return {
    id: `char_${Math.random().toString(36).slice(2, 9)}`,
    name,
    blurb: "",
  };
}

export function emptyScenario(title = "Новый сценарий"): ScenarioDocument {
  const id = `sc_${Math.random().toString(36).slice(2, 9)}`;
  const start = createNode("start", 80, 200);
  start.data.title = "Старт";
  const loc = createNode("location", 320, 180);
  loc.data.title = "Первая комната";
  loc.data.locationId = "room_1";
  loc.data.description = "Опишите место…";
  loc.data.sceneObjects = [];
  return {
    version: 1,
    manifest: {
      id,
      title,
      blurb: "Черновик из мастерской",
      playersMin: 1,
      playersMax: 4,
      status: "draft",
      version: "0.1.0",
      updatedAt: new Date().toISOString(),
    },
    nodes: [start, loc],
    edges: [
      {
        id: `e_${start.id}_${loc.id}`,
        from: start.id,
        fromPort: "out",
        to: loc.id,
        toPort: "in",
        label: "начало",
      },
    ],
    assetIds: [],
    loreBaseId: undefined,
    characters: [
      createCharacter("Следователь"),
      createCharacter("Напарник"),
    ],
    timeline: [
      {
        id: `tm_${Math.random().toString(36).slice(2, 8)}`,
        atRound: 5,
        title: "Пример на 5-й ход",
        body: "Замените текст или удалите маркер.",
        scope: "all",
      },
    ],
  };
}
