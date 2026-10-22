/**
 * Случай в приходе святого Кадмона
 * Каркас карты: локации, связи, роли, часы.
 * Фоны: public/cadmon/*.jpg
 */
import { NODE_META, type ScenarioDocument, type ScenarioEdge, type ScenarioNode, type ScenarioPort } from "@/lib/scenario/types";

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
  backgrounds?: { id: string; name: string; url: string; requiresFlag?: string }[],
): ScenarioNode {
  return {
    id,
    kind: "location",
    x,
    y,
    ports: ports("location"),
    data: { title, locationId, description, background, backgrounds },
  };
}

function node(
  id: string,
  kind: ScenarioNode["kind"],
  title: string,
  x: number,
  y: number,
  data: ScenarioNode["data"],
): ScenarioNode {
  return { id, kind, x, y, ports: ports(kind), data: { title, ...data } };
}

function edge(
  from: string,
  to: string,
  fromPort: string,
  toPort: string,
  label?: string,
  extra?: Partial<ScenarioEdge>,
): ScenarioEdge {
  return { id: `e_${from}_${to}_${fromPort}`, from, to, fromPort, toPort, label, ...extra };
}

const nodes: ScenarioNode[] = [
  node("start", "start", "Старт", 40, 340, {}),

  loc("loc_porch", "Паперть", 260, 340, "porch",
    "Ночь. Дверь прихода святой Одели. Фонарь, скамейка, объявление о пропавшей кошке. Здесь встречают.",
    "/cadmon/porch.jpg"),
  loc("loc_square", "Площадь Соляного хода", 520, 340, "square",
    "Рабочая площадь. Закрытая лавка, пустая телега, доска объявлений: кошка, таблица приливов. Отсюда расходятся улицы.",
    "/cadmon/square.jpg"),

  loc("loc_nave", "Неф", 520, 560, "nave",
    "Икона святой Одели на главной стене. Скамьи. Старая балка. Под балкой слева — голая кладка. Исповедальни нет.",
    "/cadmon/nave.jpg",
    [
      { id: "bg_nave_default", name: "Голая стена", url: "/cadmon/nave.jpg" },
      { id: "bg_nave_booth", name: "Исповедальня появилась", url: "/cadmon/nave-booth.jpg", requiresFlag: "room_real" },
    ]),
  loc("loc_vestry", "Ризница", 300, 720, "vestry",
    "Облачения, свечи, журнал расхода масла. На аналое книга усопших.",
    "/cadmon/vestry.jpg"),
  loc("loc_choir", "Хор", 520, 780, "choir",
    "Пустой хор. Пыль на перилах. Колокола нет и не было. Сюда приходят его искать.",
    "/cadmon/choir.jpg"),
  loc("loc_crypt", "Склеп Одели", 300, 900, "crypt",
    "Пыльно, тихо, её плат на раке. Настоящая святость этого прихода. Кадмона здесь нет. Вскрывать — обидеть свою церковь и ничего не узнать.",
    "/cadmon/crypt.jpg"),
  loc("loc_alley", "Переулок за церковью", 760, 560, "alley",
    "Узко, пахнет солью и мокрым камнем. На стене надпись мелом и ножом.",
    "/cadmon/alley.jpg"),
  loc("loc_shed", "Угольный сарай", 980, 560, "shed",
    "Уголь, лопата, пустые мешки. Тупик. Никакой кабинки и никакого святого.",
    "/cadmon/shed.jpg"),

  loc("loc_lych", "Калитка кладбища", 40, 480, "lych",
    "Низкая железная калитка в ограде прихода. За ней камни, не площадь. Фонарь с паперти сюда почти не достаёт.",
    "/cadmon/lych.jpg"),
  loc("loc_graveyard", "Кладбище Одели", 40, 720, "graveyard",
    "Ночные могилы прихода. Кривые плиты, мокрая трава. Имени Кадмона на камнях нет: имена местные и старые.",
    "/cadmon/graveyard.jpg"),
  loc("loc_salt", "Могила Сольта", 240, 960, "salt",
    "Камень простой, относительно свежий. В банке те же цветы, что у Анны на столе. Кадмона здесь нет.",
    "/cadmon/salt.jpg"),
  loc("loc_north", "Северная стена", 40, 960, "northwall",
    "Тупик. Плющ, осыпавшаяся кладка. На кусте тёмно-красная тряпка. Это не занавесь и не вход.",
    "/cadmon/northwall.jpg"),

  loc("loc_anna", "Дом Анны Сольт", 520, 120, "anna",
    "Тесная кухня. Цветы в банке, чай, фото мужа. Анна смотрит в сторону церкви, когда говорит о Боге.",
    "/cadmon/anna.jpg"),
  loc("loc_school", "Школа", 780, 340, "school",
    "Класс пустой. Парты, чернильница, доска с обычными упражнениями. На одной парте детская записка.",
    "/cadmon/school.jpg"),
  loc("loc_yard", "Двор с бельём", 1000, 340, "yard",
    "Верёвки, простыни. Одна на миг похожа на тёмно-красную занавесь. Это бельё.",
    "/cadmon/yard.jpg"),
  loc("loc_constable", "Стол констебля", 260, 120, "constable",
    "Лампа, график дежурств, кружка. На столе протокол о человеке, который «проспался в кабинке».",
    "/cadmon/constable.jpg"),
  loc("loc_cell", "Вторая камера", 40, 120, "cell",
    "Пустая камера. Нары, ведро, храп из соседней. Тупик.",
    "/cadmon/cell.jpg"),
  loc("loc_penn", "Кухня Пенн", 780, 120, "penn",
    "Суп, счета, злость на полицию. Миссис Пенн кабинки не видела. Соседи, говорит, месяц как не в себе.",
    "/cadmon/penn.jpg"),
  loc("loc_lodging", "Постоялый двор", 1000, 120, "lodging",
    "Комната Восса. Скучная нарочно: журнал, остывший чай, обещанные бумаги переписи. Обвинять его здесь рано — ночь портится.",
    "/cadmon/lodging.jpg"),

  loc("loc_booth", "Исповедальня", 760, 780, "booth",
    "Тесная кабинка. Тёмно-красная занавесь, решётка, скамья. В углу плат не ночного кроя и флакон. Этой комнаты не было, пока её не собрали.",
    "/cadmon/booth.jpg"),

  node("npc_voss", "npc", "Каспар Восс", 260, 180, {
    npcName: "Каспар Восс",
    npcIntro: "Письмоводитель Церкви Пара. Мягкий, точный, не лезет в вашу веру. Первый, кто называет Кадмона и исповедальню.",
  }),
  node("npc_piel", "npc", "Томас Пил", 400, 560, {
    npcName: "Томас Пил",
    npcIntro: "Служка. Добрый, не выспался. Про молитву говорит. Про кабинку сам не начинает.",
  }),
  node("npc_anna", "npc", "Анна Сольт", 400, 120, {
    npcName: "Анна Сольт",
    npcIntro: "Вдова. Говорит, что в исповедальне наконец встретила Бога, и смотрит при этом в пустую стену.",
  }),
  node("npc_elvin", "npc", "Отец Элвин", 160, 720, {
    npcName: "Отец Элвин",
    npcIntro: "Диакон Одели. Единственный, кто ломается. Про кабинку молчит, пока не спросят прямо.",
  }),
  node("npc_block", "npc", "Харви Блок", 160, 120, {
    npcName: "Харви Блок",
    npcIntro: "Констебль. Честный и уже испорченный. В протоколе кабинка, которой нет.",
  }),
  node("npc_penn", "npc", "Миссис Пенн", 900, 120, {
    npcName: "Миссис Пенн",
    npcIntro: "Живой тупик. Кабинки не видела ни разу и сердится, что остальные месяц не в себе.",
  }),

  node("ins_door", "inspect", "Дверь прихода", 140, 480, {
    inspectLabel: "Прочитать надпись на двери",
    inspectResult: "«Приход святой Одели». Имени Кадмона на двери нет. Оно есть только в папке.",
    once: true,
  }),
  node("ins_wall", "inspect", "Левая стена", 640, 480, {
    inspectLabel: "Осмотреть стену под балкой",
    inspectResult: "Голая кладка. Сырость, соль, никаких следов кабинки, занавеси или решётки. В церквях Богини исповедален не бывает.",
    once: true,
  }),
  node("ins_pew", "inspect", "Третья скамья", 640, 640, {
    inspectLabel: "Осмотреть третью скамью",
    inspectResult: "На спинке свежий срез в старом дереве: «слева, если грехов довольно».",
    once: true,
    setFlags: ["clue_pew"],
    grantClue: {
      id: "clue_pew",
      title: "Царапина на скамье",
      body: "«слева, если грехов довольно». Срез свежий, дерево старое. Место совпадает с балкой, которую назвал Восс.",
      source: "Третья скамья",
    },
  }),
  node("ins_graffiti", "inspect", "Надпись в переулке", 760, 420, {
    inspectLabel: "Прочитать надпись",
    inspectResult: "Мел и нож: «ПОКАЙСЯ КАДМАНУ!!! СПАСИ СВОЮ ДУШУ!!!» Ниже, мельче: «он отвечает в исповедальне». На улице имя через А.",
    once: true,
    setFlags: ["clue_graffiti"],
    grantClue: {
      id: "clue_graffiti",
      title: "Надпись в переулке",
      body: "«ПОКАЙСЯ КАДМАНУ!!! СПАСИ СВОЮ ДУШУ!!!» Ниже: «он отвечает в исповедальне». Восс сказал «Кадмон». Улица ещё не договорила форму.",
      source: "Переулок",
    },
  }),
  node("ins_note", "inspect", "Детская записка", 780, 200, {
    inspectLabel: "Взять записку с парты",
    inspectResult: "Детская рука: «Сегодня я был в исповедальне. Он знал, как зовут маму. Я не говорил.»",
    once: true,
    setFlags: ["clue_note"],
    grantClue: {
      id: "clue_note",
      title: "Детская записка",
      body: "«Сегодня я был в исповедальне. Он знал, как зовут маму. Я не говорил.»",
      source: "Школа",
    },
  }),
  node("ins_book", "inspect", "Книга усопших", 300, 560, {
    inspectLabel: "Листать книгу усопших",
    inspectResult: "Запись трёхнедельной давности: имя, «исповедан Кадмону». Подписи священника нет. Почерк не Элвина.",
    once: true,
    setFlags: ["clue_book"],
    grantClue: {
      id: "clue_book",
      title: "Помета в книге усопших",
      body: "Три недели назад: «исповедан Кадмону». Подписи священника нет. Почерк не отца Элвина.",
      source: "Ризница",
    },
  }),
  node("ins_protocol", "inspect", "Протокол", 260, 240, {
    inspectLabel: "Прочитать протокол",
    inspectResult: "Пьяный «проспался в кабинке» и проснулся прощённым. Описаны красная занавесь и решётка. В нефе нет ни того, ни другого.",
    once: true,
    setFlags: ["clue_protocol"],
    grantClue: {
      id: "clue_protocol",
      title: "Протокол констебля",
      body: "Человек проспался «в кабинке» и проснулся прощённым. Красная занавесь, решётка. В нефе этого нет.",
      source: "Стол констебля",
    },
  }),
  node("ins_vial", "inspect", "Флакон в углу", 900, 780, {
    inspectLabel: "Осмотреть угол кабинки",
    inspectResult: "Плат не ночного кроя. Под ним флакон и остаток, который не кость святого. Пахнет внушаемостью, не ладаном. Упаковать без имени Кадмона.",
    once: true,
  }),
  node("ins_stones", "inspect", "Плиты", 160, 720, {
    inspectLabel: "Искать имя Кадмона",
    inspectResult: "Плиты стёрты солью и дождём. Читаются местные фамилии и Одель в поминальных формулах. Кадмона нет. Кадмана тоже нет.",
    once: true,
  }),
  node("ins_salt", "inspect", "Банка с цветами", 360, 960, {
    inspectLabel: "Посмотреть могилу Сольта",
    inspectResult: "Имя мужа Анны, дата трёхлетней давности. Цветы в банке свежие, те же, что на её столе. К кабинке это не ведёт.",
    once: true,
  }),
  node("ins_ribbon", "inspect", "Тряпка на кусте", 160, 960, {
    inspectLabel: "Снять тряпку",
    inspectResult: "Крашеная шерсть, мокрая, с репьями. Не занавесь. За стеной огород и чужой забор, хода нет.",
    once: true,
  }),
];

const edges: ScenarioEdge[] = [
  edge("start", "loc_porch", "out", "in", "начало"),

  edge("loc_porch", "loc_square", "out", "in", "На площадь"),
  edge("loc_square", "loc_porch", "out", "in", "На паперть"),
  edge("loc_porch", "loc_nave", "out", "in", "В неф"),
  edge("loc_nave", "loc_porch", "out", "in", "На паперть"),
  edge("loc_porch", "loc_lych", "out", "in", "К калитке"),
  edge("loc_lych", "loc_porch", "out", "in", "На паперть"),
  edge("loc_lych", "loc_graveyard", "out", "in", "На кладбище"),
  edge("loc_graveyard", "loc_lych", "out", "in", "К калитке"),
  edge("loc_alley", "loc_graveyard", "out", "in", "Вдоль стены"),
  edge("loc_graveyard", "loc_alley", "out", "in", "В переулок"),
  edge("loc_graveyard", "loc_salt", "out", "in", "К могиле Сольта"),
  edge("loc_salt", "loc_graveyard", "out", "in", "На кладбище"),
  edge("loc_graveyard", "loc_north", "out", "in", "К северной стене"),
  edge("loc_north", "loc_graveyard", "out", "in", "Назад"),

  edge("loc_square", "loc_nave", "out", "in", "В церковь"),
  edge("loc_nave", "loc_square", "out", "in", "На площадь"),
  edge("loc_square", "loc_anna", "out", "in", "К Анне"),
  edge("loc_anna", "loc_square", "out", "in", "На площадь"),
  edge("loc_square", "loc_school", "out", "in", "В школу"),
  edge("loc_school", "loc_square", "out", "in", "На площадь"),
  edge("loc_square", "loc_constable", "out", "in", "К констеблю"),
  edge("loc_constable", "loc_square", "out", "in", "На площадь"),
  edge("loc_square", "loc_lodging", "out", "in", "На постоялый двор"),
  edge("loc_lodging", "loc_square", "out", "in", "На площадь"),
  edge("loc_square", "loc_penn", "out", "in", "К Пенн"),
  edge("loc_penn", "loc_square", "out", "in", "На площадь"),

  edge("loc_nave", "loc_vestry", "out", "in", "В ризницу"),
  edge("loc_vestry", "loc_nave", "out", "in", "В неф"),
  edge("loc_nave", "loc_choir", "out", "in", "На хор"),
  edge("loc_choir", "loc_nave", "out", "in", "В неф"),
  edge("loc_nave", "loc_alley", "out", "in", "В переулок"),
  edge("loc_alley", "loc_nave", "out", "in", "В неф"),
  edge("loc_vestry", "loc_crypt", "out", "in", "В склеп"),
  edge("loc_crypt", "loc_vestry", "out", "in", "В ризницу"),
  edge("loc_alley", "loc_shed", "out", "in", "В сарай"),
  edge("loc_shed", "loc_alley", "out", "in", "В переулок"),

  edge("loc_school", "loc_yard", "out", "in", "Во двор"),
  edge("loc_yard", "loc_school", "out", "in", "В школу"),
  edge("loc_constable", "loc_cell", "out", "in", "Во вторую камеру"),
  edge("loc_cell", "loc_constable", "out", "in", "К столу"),
  edge("loc_anna", "loc_penn", "out", "in", "К соседке"),
  edge("loc_penn", "loc_anna", "out", "in", "К Анне"),

  edge("loc_nave", "loc_booth", "out", "in", "В исповедальню", { requiresFlag: "room_real" }),
  edge("loc_booth", "loc_nave", "out", "in", "В неф"),

  edge("loc_porch", "npc_voss", "events", "in"),
  edge("loc_porch", "ins_door", "events", "in"),
  edge("loc_nave", "npc_piel", "events", "in"),
  edge("loc_nave", "ins_wall", "events", "in"),
  edge("loc_nave", "ins_pew", "events", "in"),
  edge("loc_alley", "ins_graffiti", "events", "in"),
  edge("loc_school", "ins_note", "events", "in"),
  edge("loc_vestry", "ins_book", "events", "in"),
  edge("loc_vestry", "npc_elvin", "events", "in"),
  edge("loc_anna", "npc_anna", "events", "in"),
  edge("loc_constable", "npc_block", "events", "in"),
  edge("loc_constable", "ins_protocol", "events", "in"),
  edge("loc_penn", "npc_penn", "events", "in"),
  edge("loc_booth", "ins_vial", "events", "in"),
  edge("loc_graveyard", "ins_stones", "events", "in"),
  edge("loc_salt", "ins_salt", "events", "in"),
  edge("loc_north", "ins_ribbon", "events", "in"),
];

export const cadmonScenario: ScenarioDocument = {
  version: 1,
  manifest: {
    id: "cadmon",
    title: "Случай в приходе святого Кадмона",
    subtitle: "Ночь в приходе святой Одели, Карроу",
    blurb: "Церковь Ночи прислала проверить приход, где молятся чужому имени. На паперти уже ждут. Исповедальни в церкви нет — пока её не собрут.",
    coverImage: "/cadmon/cover.jpg",
    playersMin: 1,
    playersMax: 4,
    status: "draft",
    version: "0.1.2",
    updatedAt: "2026-10-22T21:00:00.000Z",
  },
  loreBaseId: "lotm",
  nodes,
  edges,
  characters: [
    {
      id: "char_martin",
      name: "Мартин Кейл",
      givenName: "Мартин",
      blurb: "Провидец на службе у Ястребов. Не поверил своему гаданию и опоздал к жене.",
      lore: { baseId: "lotm", pathwayId: "fool", sequenceRank: 9 },
    },
    {
      id: "char_agnes",
      name: "Агнесса Войль",
      givenName: "Агнесса",
      blurb: "Сборщица трупов. Закрыла сестре глаза по уставу и не простилась.",
      lore: { baseId: "lotm", pathwayId: "death", sequenceRank: 9 },
    },
    {
      id: "char_ien",
      name: "Иэн Брэм",
      givenName: "Иэн",
      blurb: "Полуночный поэт. Спеть покой человеку, который просил не петь.",
      lore: { baseId: "lotm", pathwayId: "darkness", sequenceRank: 8 },
    },
    {
      id: "char_oscar",
      name: "Оскар Фенн",
      givenName: "Оскар",
      blurb: "Аптекарь, прикомандирован. Усилил отцу капли сверх меры.",
      lore: { baseId: "lotm", pathwayId: "moon", sequenceRank: 9 },
    },
  ],
  timeline: [
    {
      id: "tm_seed",
      atRound: 1,
      title: "Чужая занавесь",
      body: "Пока Восс говорит про исповедальню, в голове на миг встаёт картинка: тёмно-красная занавесь, запах бумаги, чужое спокойствие. В нефе под балкой по-прежнему голая стена.",
      scope: "all",
    },
    {
      id: "tm_bell",
      atRound: 3,
      title: "Удар без башни",
      body: "Где-то ударили один раз. Колокола в приходе нет. Звук пришёл не сверху.",
      scope: "all",
    },
    {
      id: "tm_tea",
      atRound: 6,
      title: "Тот же чай",
      body: "Пахнет тем же чаем, что на паперти. Если рядом кто-то из местных, он здоровается так, будто видел вас утром с письмоводителем.",
      scope: "all",
    },
    {
      id: "tm_paper",
      atRound: 9,
      title: "Бумага на площади",
      body: "На тумбе у площади влажный лист. Детская рука, те же слова, что в школе, если записку ещё не брали.",
      scope: "all",
    },
  ],
};
