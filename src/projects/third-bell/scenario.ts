/** Короткий текстовый сценарий, чтобы прогнать флаги, улики, замок и LoTM. */

import type {
  ScenarioCharacter,
  ScenarioDocument,
  ScenarioEdge,
  ScenarioNode,
  ScenarioPort,
  ScenarioTalkOption,
  SceneObject,
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
  description: string,
  background?: string,
  sceneObjects?: SceneObject[],
): ScenarioNode {
  return {
    id,
    kind: "location",
    x,
    y,
    ports: ports("location"),
    data: { title, locationId, description, background, sceneObjects },
  };
}

function pin(
  id: string,
  label: string,
  url: string,
  x: number,
  y: number,
  w: number,
  h: number,
  linkNodeId: string,
  interaction: "inspect" | "talk",
  kind: SceneObject["kind"] = "hotspot",
): SceneObject {
  return {
    id,
    kind,
    label,
    url,
    x,
    y,
    w,
    h,
    linkNodeId,
    interaction,
    percent: true,
  };
}

function inspect(
  id: string,
  title: string,
  label: string,
  result: string,
  extra?: Partial<ScenarioNode["data"]>,
): ScenarioNode {
  return {
    id,
    kind: "inspect",
    x: 0,
    y: 0,
    ports: ports("inspect"),
    data: { title, inspectLabel: label, inspectResult: result, once: true, ...extra },
  };
}

function edge(
  from: string,
  to: string,
  fromPort: string,
  toPort: string,
  label?: string,
  extra?: Partial<ScenarioEdge>,
): ScenarioEdge {
  return {
    id: `e_${from}_${to}_${fromPort}`,
    from,
    to,
    fromPort,
    toPort,
    label,
    ...extra,
  };
}

const askTrain: ScenarioTalkOption = {
  id: "ask_train",
  label: "Где поезд?",
  reply:
    "«Снят с табло до третьего звонка. Билетов я не продавала. Дежурный ушёл к лампе и не вернулся.»",
  once: true,
  setFlags: ["spoke_ida"],
  grantClue: {
    id: "ida_train",
    title: "Ида не продавала билетов",
    body: "Поезд сняли до третьего звонка. Дежурный ушёл к лампе.",
    source: "Ида",
  },
};

const askDuty: ScenarioTalkOption = {
  id: "ask_duty",
  label: "Где дежурный?",
  reply:
    "«Ключ от служебного коридора лежит в ящике кассы. Я его не брала. Дверь в его комнату сама не откроется — ждите звонка.»",
  once: true,
  requiresFlag: "spoke_ida",
  setFlags: ["mentioned_key"],
};

const nodes: ScenarioNode[] = [
  {
    id: "start",
    kind: "start",
    x: 40,
    y: 220,
    ports: ports("start"),
    data: { title: "Старт" },
  },
  loc(
    "loc_platform",
    "Платформа",
    280,
    180,
    "platform",
    "Дождь. Фонарь горит, рельсы пустые.",
    "/third-bell/platform.jpg",
    [
      pin("so_puddle", "Лужи", "/third-bell/puddle.jpg", 8, 68, 36, 28, "ins_puddle", "inspect"),
      pin("so_board", "Табло", "/third-bell/board.jpg", 66, 26, 26, 34, "ins_board", "inspect"),
      pin("so_clock", "Часы", "/third-bell/clock.jpg", 72, 1, 14, 20, "ins_clock", "inspect"),
    ],
  ),
  loc(
    "loc_hall",
    "Зал ожидания",
    560,
    180,
    "hall",
    "Скамейки, остывший самовар, стекло в разводах.",
    "/third-bell/hall.jpg",
    [
      pin("so_ida", "Ида", "/third-bell/ida.png", 15, 32, 16, 52, "npc_ida", "talk", "npc"),
      pin("so_glass", "Стекло", "/third-bell/glass.jpg", 44, 0, 26, 56, "ins_glass", "inspect"),
    ],
  ),
  loc(
    "loc_office",
    "Касса",
    560,
    420,
    "office",
    "Решётка опущена наполовину. Журнал открыт на сегодня.",
    "/third-bell/office.jpg",
    [
      pin("so_log", "Журнал", "/third-bell/ledger.jpg", 33, 57, 34, 20, "ins_log", "inspect"),
      pin("so_drawer", "Ящик", "/third-bell/drawer.jpg", 66, 76, 24, 20, "ins_drawer", "inspect"),
    ],
  ),
  loc(
    "loc_corridor",
    "Служебный коридор",
    860,
    180,
    "corridor",
    "Узко. Пахнет мокрой шинелью. В конце — дверь дежурного.",
  ),
  loc(
    "loc_duty",
    "Комната дежурного",
    1140,
    180,
    "duty",
    "Лампа на столе ещё тёплая. Стул отодвинут, будто встали на полуслове.",
  ),
  inspect("ins_puddle", "Лужи", "Лужи у кромки платформы", "В воде дрожит фонарь. Следов нет — дождь их уже съел.", {
    requiresFlag: "rain",
    imageUrl: "/third-bell/puddle.jpg",
  }),
  inspect("ins_board", "Табло", "Табло отправлений", "Мел стёрт. Осталась одна строка: «до третьего звонка».", {
    setFlags: ["saw_board"],
    imageUrl: "/third-bell/board.jpg",
    grantClue: {
      id: "board_erased",
      title: "Поезд снят с табло",
      body: "Расписание стёрто. Осталась пометка «до третьего звонка».",
      source: "Платформа",
    },
  }),
  inspect(
    "ins_clock",
    "Часы",
    "Станционные часы",
    "Минутная стрелка стоит так, будто уже был удар, которого никто не слышал.",
    { requiresFlag: "saw_board", imageUrl: "/third-bell/clock.jpg" },
  ),
  {
    id: "npc_ida",
    kind: "npc",
    x: 0,
    y: 0,
    ports: ports("npc"),
    data: {
      title: "Кассир Ида",
      npcName: "Кассир Ида",
      npcIntro: "Стоит у двери в кассу и не смотрит на рельсы.",
      portraitUrl: "/third-bell/ida.png",
      talkOptions: [askTrain, askDuty],
    },
  },
  inspect("ins_log", "Журнал", "Журнал кассы", "Сегодняшняя страница пустая. Вчерашняя оборвана.", {
    imageUrl: "/third-bell/ledger.jpg",
    grantClue: {
      id: "blank_log",
      title: "Пустая строка",
      body: "В журнале нет ни одного билета за сегодня. Вчерашний лист вырван.",
      source: "Касса",
    },
  }),
  inspect("ins_drawer", "Ящик", "Ящик кассы", "Под копиркой — холодный ключ с биркой «коридор».", {
    imageUrl: "/third-bell/drawer.jpg",
    audience: "world",
    grantItem: {
      id: "corridor_key",
      title: "Ключ от коридора",
      body: "Холодный ключ с пустой биркой. Второй такой Ида не прятала.",
      imageUrl: "/third-bell/drawer.jpg",
    },
    requiresFlag: "mentioned_key",
    setFlags: ["staff_key"],
    grantClue: {
      id: "staff_key_clue",
      title: "Ключ от коридора",
      body: "Ида сказала, где он. В ящике и правда ключ с биркой «коридор».",
      source: "Касса",
    },
  }),
  inspect(
    "ins_glass",
    "Стекло",
    "Разводы на стекле",
    "После духовного зрения разводы складываются в ладонь, прижатую с той стороны.",
    {
      requiresFlag: "spirit_vision",
      imageUrl: "/third-bell/glass.jpg",
      grantState: {
        id: "glass_hand",
        title: "Чужая ладонь",
        body: "Вы видели ладонь с той стороны стекла. Дождь её не смыл.",
      },
      grantClue: {
        id: "glass_hand",
        title: "Ладонь на стекле",
        body: "Аура на стекле зала — чужая и совсем свежая. Кто-то стоял здесь после дождя.",
        source: "Зал",
      },
    },
  ),
  inspect("ins_coat", "Шинель", "Шинель на крюке", "Мокрая снаружи и сухая у ворота. Её сняли уже в коридоре.", {
    grantClue: {
      id: "coat",
      title: "Шинель дежурного",
      body: "Верх мокрый, ворот сухой: в коридор зашли под дождём и остались.",
      source: "Коридор",
    },
  }),
  inspect("ins_lamp", "Лампа", "Лампа дежурного", "Стекло тёплое. Внутри — не керосин, а сложенная записка.", {
    grantClue: {
      id: "lamp_note",
      title: "Записка в лампе",
      body: "«Не гасите. Третий звонок — не поезд.» Почерк обрывается.",
      source: "Комната дежурного",
    },
  }),
];

const edges: ScenarioEdge[] = [
  edge("start", "loc_platform", "out", "in", "начало"),
  edge("loc_platform", "loc_hall", "out", "in", "В зал"),
  edge("loc_hall", "loc_platform", "out", "in", "На платформу"),
  edge("loc_hall", "loc_office", "out", "in", "В кассу"),
  edge("loc_office", "loc_hall", "out", "in", "В зал"),
  edge("loc_hall", "loc_corridor", "out", "in", "В служебный коридор", {
    requiresFlag: "staff_key",
  }),
  edge("loc_corridor", "loc_hall", "out", "in", "В зал"),
  edge("loc_corridor", "loc_duty", "out", "in", "К дежурному"),
  edge("loc_duty", "loc_corridor", "out", "in", "В коридор"),
  edge("loc_platform", "ins_puddle", "events", "in"),
  edge("loc_platform", "ins_board", "events", "in"),
  edge("loc_platform", "ins_clock", "events", "in"),
  edge("loc_hall", "npc_ida", "events", "in"),
  edge("loc_hall", "ins_glass", "events", "in"),
  edge("loc_office", "ins_log", "events", "in"),
  edge("loc_office", "ins_drawer", "events", "in"),
  edge("loc_corridor", "ins_coat", "events", "in"),
  edge("loc_duty", "ins_lamp", "events", "in"),
];

const characters: ScenarioCharacter[] = [
  {
    id: "char_conductor",
    name: "Проводник",
    blurb: "Знает, как пахнет чужой билет, и не любит пустые вагоны.",
  },
  {
    id: "char_inspector",
    name: "Ревизор",
    blurb: "Читает журналы быстрее, чем люди успевают их спрятать.",
  },
  {
    id: "char_seer",
    name: "Провидец",
    blurb: "Держит при себе монету для гадания. Дождь ему не мешает смотреть.",
    lore: {
      baseId: "lotm",
      pathwayId: "fool",
      sequenceRank: 9,
      enabledAbilityIds: ["fool.9.spirit_vision", "fool.9.divination"],
    },
  },
];

export const thirdBellScenario: ScenarioDocument = {
  version: 1,
  manifest: {
    id: "third-bell",
    title: "Третий звонок",
    subtitle: "Ночь на станции «Ламповый тупик»",
    blurb:
      "Поезд не пришёл. Дежурный не отвечает. Текстовый сценарий, чтобы проверить стол: улики, флаги, закрытую дверь и одну способность.",
    coverImage: "/third-bell/cover.jpg",
    playersMin: 1,
    playersMax: 3,
    status: "playable",
    version: "0.1.0",
    updatedAt: "2026-10-15T00:00:00.000Z",
  },
  nodes,
  edges,
  characters,
  loreBaseId: "lotm",
  initialFlags: ["rain"],
  timeline: [
    {
      id: "tm_bell",
      atRound: 3,
      title: "Третий звонок",
      body: "Где-то в здании ударили в колокол трижды. Рельсы по-прежнему молчат.",
      scope: "all",
    },
    {
      id: "tm_duty",
      atRound: 4,
      title: "Щелчок в коридоре",
      body: "Дверь комнаты дежурного открылась сама. Без ключа от кассы до коридора всё равно не дойти.",
      scope: "all",
      unlockLocationId: "duty",
      grantClue: {
        id: "duty_unlock",
        title: "Дверь дежурного",
        body: "На четвёртом ходе замок в конце коридора сдался.",
        source: "Станция",
      },
    },
    {
      id: "tm_glass",
      atRound: 5,
      title: "Слово на стекле",
      body: "Тем, кто смотрел духовным зрением: на стекле зала держится фраза «не входи в лампу».",
      scope: "actor",
      requiresAbilityUsed: "ability_used:fool.9.spirit_vision",
    },
  ],
};
