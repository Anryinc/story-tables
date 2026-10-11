/** Червуд как ScenarioDocument — для node-мастерской и compile(). */

import type {
  ScenarioCharacter,
  ScenarioDocument,
  ScenarioEdge,
  ScenarioNode,
  ScenarioPort,
} from "@/lib/scenario/types";
import { NODE_META } from "@/lib/scenario/types";

function ports(kind: ScenarioNode["kind"]): ScenarioPort[] {
  return NODE_META[kind].defaultPorts.map((p) => ({ ...p }));
}

function loc(
  id: string,
  title: string,
  x: number,
  y: number,
  locationId: string,
  description?: string,
): ScenarioNode {
  return {
    id,
    kind: "location",
    x,
    y,
    ports: ports("location"),
    data: { title, locationId, description },
  };
}

function inspect(
  id: string,
  title: string,
  x: number,
  y: number,
  label: string,
  result: string,
  extra?: Partial<ScenarioNode["data"]>,
): ScenarioNode {
  return {
    id,
    kind: "inspect",
    x,
    y,
    ports: ports("inspect"),
    data: {
      title,
      inspectLabel: label,
      inspectResult: result,
      once: true,
      ...extra,
    },
  };
}

function npc(
  id: string,
  name: string,
  x: number,
  y: number,
  intro: string,
  body: string,
  extra?: Partial<ScenarioNode["data"]>,
): ScenarioNode {
  return {
    id,
    kind: "npc",
    x,
    y,
    ports: ports("npc"),
    data: {
      title: name,
      npcName: name,
      npcIntro: intro,
      body,
      ...extra,
    },
  };
}

function edge(
  from: string,
  to: string,
  fromPort: string,
  toPort: string,
  label?: string,
): ScenarioEdge {
  return {
    id: `e_${from}_${to}_${fromPort}`,
    from,
    to,
    fromPort,
    toPort,
    label,
  };
}

const nodes: ScenarioNode[] = [
  {
    id: "start",
    kind: "start",
    x: 40,
    y: 280,
    ports: ports("start"),
    data: { title: "Старт" },
  },
  loc("loc_street", "Улица Железных ворот", 280, 260, "street", "Туман. Вывеска пансиона."),
  loc("loc_parlor", "Гостиная «Серебряной чайки»", 560, 260, "parlor", "Хэтти, реестр, камин."),
  loc("loc_hallway", "Коридор 2 этажа", 840, 260, "hallway", "Двери. Пелл."),
  loc("loc_room7", "Комната 7", 1120, 140, "room7", "Стол. Листовка."),
  loc("loc_basement", "Дверь в подвал", 840, 480, "basement", "Держат изнутри."),
  inspect("ins_fog_sign", "Вывеска", 200, 80, "Вывеска пансиона", "«Серебряная чайка» качается на цепи."),
  inspect("ins_wet_steps", "Следы", 200, 200, "Мокрые следы у крыльца", "Следы к двери обрываются. Обратных нет.", {
    grantClue: { id: "wet_steps", title: "Следы у крыльца", body: "Мокрые отпечатки к двери, обратных нет.", source: "Улица" },
  }),
  inspect("ins_window", "Окно", 200, 420, "Окно на углу", "Угловое окно второго этажа в копоти изнутри.", {
    setFlags: ["saw_facade"],
    grantClue: { id: "sleepless_window", title: "Окно, которое не гасло", body: "Копоть на стекле изнутри.", source: "Улица" },
  }),
  npc("npc_clara", "Клара Восс", 40, 420, "Женщина у фонаря смотрит на угловое окно.", "«Муж… Артур. Утром смотрел на меня, как на чужую.»", {
    setFlags: ["heard_widow"],
    grantClue: { id: "widow_story", title: "Муж, который забыл жену", body: "Артур Восс не узнал Клару.", source: "Клара Восс" },
  }),
  inspect("ins_register", "Реестр", 520, 80, "Реестр гостей", "Восс, Пелл, Миллс. Край страницы липкий.", {
    setFlags: ["register_hint"],
    grantClue: { id: "register_edge", title: "Край реестра", body: "След влаги в книге жильцов.", source: "Гостиная" },
  }),
  inspect("ins_hearth", "Камин", 700, 80, "Камин", "В золе обрывок: «пятница».", {
    grantClue: { id: "friday_ash", title: "Пятница в золе", body: "Обгоревшее расписание: пятница.", source: "Гостиная" },
  }),
  npc("npc_hattie", "Хэтти", 560, 420, "Хозяйка перебирает ключи.", "«Восс, Пелл, Миллс. Трезвость — в пятницу, внизу.»", {
    setFlags: ["heard_boarders", "heard_hattie_basement"],
  }),
  inspect("ins_door_marks", "Царапины", 840, 80, "Царапины у 7", "Косяк исчерчен изнутри.", {
    grantClue: { id: "door7_marks", title: "Царапины у комнаты 7", body: "Счёт на косяке изнутри.", source: "Коридор" },
  }),
  npc("npc_pell", "Гарольд Пелл", 1000, 360, "Здоровается слишком охотно.", "«Пелл. Комната… пятая? Да.»", {
    setFlags: ["met_pell"],
    grantClue: { id: "pell_empty", title: "Жилец без середины", body: "Пелл здоровается. Имя держится недолго.", source: "Коридор" },
  }),
  inspect("ins_desk", "Стол", 1120, 20, "Стол", "Пустой флакон: соль и сырая бумага.", {
    grantClue: { id: "ink_stain", title: "Чернила не для писем", body: "Пятно: металл, зола.", source: "Комната 7" },
  }),
  inspect("ins_leaflet", "Листовка", 1280, 140, "Листовка под кроватью", "«Пятница. Подвал. Тихий гость.»", {
    setFlags: ["has_temperance_leaflet"],
    grantClue: { id: "temperance", title: "Общество трезвости", body: "Листовка: пятница, подвал.", source: "Комната 7" },
  }),
  inspect("ins_lock", "Замок", 700, 520, "Замок", "Не заперт — держат с той стороны.", {
    setFlags: ["basement_door_seen"],
    grantClue: { id: "basement_held", title: "Дверь держат изнутри", body: "Замок свободен, полотно удерживают изнутри.", source: "Подвал" },
  }),
  inspect("ins_listen", "Слух", 980, 520, "Прислушаться", "Ритм шагов по кругу. Кто-то считает."),
];

const edges: ScenarioEdge[] = [
  edge("start", "loc_street", "out", "in", "начало"),
  edge("loc_street", "loc_parlor", "out", "in", "В пансион"),
  edge("loc_parlor", "loc_street", "out", "in", "На улицу"),
  edge("loc_parlor", "loc_hallway", "out", "in", "2 этаж"),
  edge("loc_hallway", "loc_parlor", "out", "in", "В гостиную"),
  edge("loc_hallway", "loc_room7", "out", "in", "Комната 7"),
  edge("loc_room7", "loc_hallway", "out", "in", "В коридор"),
  edge("loc_parlor", "loc_basement", "out", "in", "К подвалу"),
  edge("loc_basement", "loc_parlor", "out", "in", "Наверх"),
  edge("loc_street", "ins_fog_sign", "events", "in"),
  edge("loc_street", "ins_wet_steps", "events", "in"),
  edge("loc_street", "ins_window", "events", "in"),
  edge("loc_street", "npc_clara", "events", "in"),
  edge("loc_parlor", "ins_register", "events", "in"),
  edge("loc_parlor", "ins_hearth", "events", "in"),
  edge("loc_parlor", "npc_hattie", "events", "in"),
  edge("loc_hallway", "ins_door_marks", "events", "in"),
  edge("loc_hallway", "npc_pell", "events", "in"),
  edge("loc_room7", "ins_desk", "events", "in"),
  edge("loc_room7", "ins_leaflet", "events", "in"),
  edge("loc_basement", "ins_lock", "events", "in"),
  edge("loc_basement", "ins_listen", "events", "in"),
];

const characters: ScenarioCharacter[] = [
  {
    id: "char_investigator",
    name: "Следователь",
    blurb: "Видит связи, которые другие пропускают.",
  },
  {
    id: "char_medium",
    name: "Медиум",
    blurb: "Слышит то, чего нет в реестре.",
  },
  {
    id: "char_doctor",
    name: "Врач",
    blurb: "Читает следы на коже и в дыхании.",
  },
  {
    id: "char_thief",
    name: "Взломщик",
    blurb: "Открывает то, что закрыто для гостей.",
  },
];

export const cherwoodScenario: ScenarioDocument = {
  version: 1,
  manifest: {
    id: "cherwood",
    title: "Червудский свидетель",
    subtitle: "Акт I · Пансион «Серебряная чайка»",
    blurb:
      "Туман на улице Железных ворот. Клара ищет мужа, Хэтти хранит ключи, подвал не спит.",
    coverImage:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80",
    playersMin: 1,
    playersMax: 4,
    status: "playable",
    version: "0.3.0-chars",
    updatedAt: new Date().toISOString(),
  },
  nodes,
  edges,
  characters,
  timeline: [
    {
      id: "tm_5",
      atRound: 5,
      title: "За вами следят",
      body: "На улице и в коридорах — ощущение чужого взгляда.",
      scope: "all",
    },
    {
      id: "tm_10",
      atRound: 10,
      title: "Крик со двора",
      body: "Соседка уверяет: кто-то выпал из окна угловой комнаты.",
      scope: "all",
      unlockLocationId: "basement",
      grantClue: {
        id: "window_fall",
        title: "Падение из окна",
        body: "Двор — новое место для улик.",
        source: "Город",
      },
    },
  ],
};
