import type { GraphDocument } from "@/lib/graph/types";

export const cherwoodGraph: GraphDocument = {
  version: 1,
  startLocationId: "street",
  locations: {
    street: {
      id: "street",
      name: "Улица Железных ворот",
      exits: [{ to: "parlor", label: "В пансион «Серебряная чайка»" }],
      inspect: [
        {
          id: "fog_sign",
          label: "Вывеска пансиона",
          result:
            "«Серебряная чайка» качается на цепи. Свежий мел: «Комнат нет. Спрашивайте Хэтти».",
          once: true,
        },
        {
          id: "wet_steps",
          label: "Мокрые следы у крыльца",
          result: "Следы к двери обрываются. Обратных нет.",
          once: true,
          clue: {
            id: "wet_steps",
            title: "Следы у крыльца",
            body: "Мокрые отпечатки к двери, обратных нет.",
            source: "Улица",
          },
        },
        {
          id: "sleepless_window",
          label: "Окно на углу",
          result: "Угловое окно второго этажа в копоти изнутри.",
          once: true,
          setFlags: ["saw_facade"],
          clue: {
            id: "sleepless_window",
            title: "Окно, которое не гасло",
            body: "Копоть на стекле изнутри, будто фитиль чадил до утра.",
            source: "Улица",
          },
        },
      ],
      npcs: [
        {
          id: "clara",
          name: "Клара Восс",
          intro: "Женщина у фонаря смотрит на угловое окно.",
          options: [
            {
              id: "hear_widow",
              label: "Выслушать Клару",
              once: true,
              hideIfFlag: "heard_widow",
              setFlags: ["heard_widow"],
              reply:
                "«Муж… Артур. Утром смотрел на меня, как на чужую. Потом вышел в туман.»",
              clue: {
                id: "widow_story",
                title: "Муж, который забыл жену",
                body: "Артур Восс не узнал Клару и исчез в тумане. Комната 7 за ним.",
                source: "Клара Восс",
              },
            },
            {
              id: "ask_room",
              label: "Спросить про комнату 7",
              once: true,
              requiresFlag: "heard_widow",
              reply: "«Седьмая. Угол. Ночью видела свет. Не лампа.»",
            },
          ],
        },
      ],
    },
    parlor: {
      id: "parlor",
      name: "Гостиная «Серебряной чайки»",
      exits: [
        { to: "street", label: "На улицу" },
        { to: "hallway", label: "На второй этаж" },
        {
          to: "basement",
          label: "К двери в подвал",
          requiresAnyFlags: ["heard_hattie_basement", "register_hint"],
        },
      ],
      inspect: [
        {
          id: "register",
          label: "Реестр гостей",
          result:
            "Восс, Пелл, Миллс. Край страницы липкий. Обычная лампа врёт.",
          once: true,
          setFlags: ["register_hint"],
          clue: {
            id: "register_edge",
            title: "Край реестра",
            body: "След влаги в книге жильцов.",
            source: "Гостиная",
          },
        },
        {
          id: "hearth",
          label: "Камин",
          result: "В золе обрывок: «пятница».",
          once: true,
          clue: {
            id: "friday_ash",
            title: "Пятница в золе",
            body: "Обгоревшее расписание: пятница.",
            source: "Гостиная",
          },
        },
      ],
      npcs: [
        {
          id: "hattie",
          name: "Хэтти",
          intro: "Хозяйка перебирает ключи. Пальцы белеют на слове «внизу».",
          options: [
            {
              id: "ask_boarders",
              label: "Спросить про жильцов",
              once: true,
              setFlags: ["heard_boarders", "heard_hattie_basement"],
              reply:
                "«Восс, Пелл, Миллс. Трезвость — в пятницу, внизу, чай без рома. Церковь Ночи спрашивала — я сказала: алкоголь.» На «внизу» стискивает ключи.",
            },
            {
              id: "ask_voss",
              label: "Спросить про Восса",
              once: true,
              requiresFlag: "heard_widow",
              reply: "«Комната 7 оплачена. Ключ у него — или у того, кто держит дверь.»",
            },
          ],
        },
      ],
    },
    hallway: {
      id: "hallway",
      name: "Коридор второго этажа",
      exits: [
        { to: "parlor", label: "В гостиную" },
        { to: "room7", label: "Комната 7" },
      ],
      inspect: [
        {
          id: "door_marks",
          label: "Царапины у 7",
          result: "Косяк исчерчен изнутри.",
          once: true,
          clue: {
            id: "door7_marks",
            title: "Царапины у комнаты 7",
            body: "Счёт на косяке изнутри.",
            source: "Коридор",
          },
        },
      ],
      npcs: [
        {
          id: "pell",
          name: "Гарольд Пелл",
          intro: "Здоровается слишком охотно. Пауза дольше, чем вежливо.",
          options: [
            {
              id: "ask_name",
              label: "Спросить, кто он",
              once: true,
              setFlags: ["met_pell"],
              reply: "«Пелл. Комната… пятая? Да.» Он уже не помнит вопроса.",
              clue: {
                id: "pell_empty",
                title: "Жилец без середины",
                body: "Пелл здоровается. Имя держится не дольше минуты.",
                source: "Коридор",
              },
            },
          ],
        },
      ],
    },
    room7: {
      id: "room7",
      name: "Комната 7",
      exits: [{ to: "hallway", label: "В коридор" }],
      inspect: [
        {
          id: "desk",
          label: "Стол",
          result: "Пустой флакон: соль и сырая бумага. Пятно — металл и зола.",
          once: true,
          clue: {
            id: "ink_stain",
            title: "Чернила не для писем",
            body: "Пятно: металл, зола, сладковатый дух.",
            source: "Комната 7",
          },
        },
        {
          id: "leaflet",
          label: "Листовка под кроватью",
          result: "«Пятница. Подвал. Тихий гость.»",
          once: true,
          setFlags: ["has_temperance_leaflet"],
          clue: {
            id: "temperance",
            title: "Общество трезвости",
            body: "Листовка: пятница, подвал.",
            source: "Комната 7",
          },
        },
      ],
    },
    basement: {
      id: "basement",
      name: "Дверь в подвал",
      exits: [{ to: "parlor", label: "Наверх" }],
      inspect: [
        {
          id: "door_lock",
          label: "Замок",
          result: "Не заперт — держат с той стороны. Холод и мокрый камень.",
          once: true,
          setFlags: ["basement_door_seen"],
          clue: {
            id: "basement_held",
            title: "Дверь держат изнутри",
            body: "Замок свободен, полотно удерживают изнутри.",
            source: "Подвал",
          },
        },
        {
          id: "listen",
          label: "Прислушаться",
          result: "Ритм шагов по кругу. Кто-то считает.",
          once: true,
          requiresFlag: "basement_door_seen",
        },
      ],
    },
  },
};
