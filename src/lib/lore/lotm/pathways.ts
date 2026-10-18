/** LoTM: 22 pathways, sequences 9→4. Names from canon; P0 abilities richer. */

import type { AbilityDef, PathwayDef, SequenceDef } from "../types";
import { profileFor } from "./profiles";

function stubAbility(
  pathwayId: string,
  rank: number,
  seqNameRu: string,
): AbilityDef {
  const id = `${pathwayId}.${rank}.core`;
  return {
    id,
    nameRu: `Сила: ${seqNameRu}`,
    descriptionRu: `Базовая сверхъестественная способность последовательности «${seqNameRu}» (C${rank}).`,
    mechanics: {
      cost: "action",
      oncePerGame: false,
      cooldownRounds: 1,
      setsFlags: [`ability_used:${id}`],
      effects: [
        {
          type: "reveal_text",
          scope: "self",
          title: seqNameRu,
          body: `Вы опираетесь на силу пути (C${rank}: ${seqNameRu}).`,
        },
        { type: "set_flag", flag: `ability_used:${id}` },
      ],
    },
  };
}

function seqs(
  pathwayId: string,
  rows: [number, string, string][],
  rich?: Record<number, AbilityDef[]>,
): SequenceDef[] {
  return rows.map(([rank, nameEn, nameRu]) => ({
    rank: rank as 9 | 8 | 7 | 6 | 5 | 4,
    nameEn,
    nameRu,
    profileRu: profileFor(pathwayId, rank),
    actingPrincipleRu: `Действуйте в духе «${nameRu}».`,
    potionSummaryRu: `Зелье C${rank}: ${nameRu}.`,
    abilities: rich?.[rank] ?? [stubAbility(pathwayId, rank, nameRu)],
  }));
}

const foolRich: Record<number, AbilityDef[]> = {
  9: [
    {
      id: "fool.9.spirit_vision",
      nameRu: "Духовное зрение",
      descriptionRu: "Видеть ауры и духовные следы на предметах и людях.",
      kind: "passive",
      mechanics: {
        cost: "action",
        cooldownRounds: 0,
        setsFlags: ["ability_used:fool.9.spirit_vision", "spirit_vision"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Духовное зрение",
            body: "Контуры мира двоятся. На предметах — следы присутствия; на живых — ореолы эмоций.",
          },
          { type: "set_flag", flag: "ability_used:fool.9.spirit_vision" },
          { type: "set_flag", flag: "spirit_vision" },
        ],
      },
    },
    {
      id: "fool.9.divination",
      nameRu: "Гадание",
      descriptionRu: "Простой ритуал на ответ «да/нет» или направление угрозы.",
      kind: "active",
      target: "any",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:fool.9.divination"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Гадание",
            body: "Монета или маятник дают смутный, но настойчивый ответ.",
          },
          { type: "set_flag", flag: "ability_used:fool.9.divination" },
        ],
      },
    },
  ],
  8: [
    {
      id: "fool.8.agility",
      nameRu: "Ловкость клоуна",
      descriptionRu: "Сверхъестественная координация и уклонение.",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:fool.8.agility"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Ловкость",
            body: "Тело отвечает быстрее мысли.",
          },
          { type: "set_flag", flag: "ability_used:fool.8.agility" },
        ],
      },
    },
  ],
  7: [
    {
      id: "fool.7.illusion",
      nameRu: "Иллюзия",
      descriptionRu: "Краткий обман чувств.",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:fool.7.illusion"],
        effects: [
          {
            type: "reveal_text",
            scope: "same_location",
            title: "Иллюзия",
            body: "На мгновение реальность дрогнула.",
          },
          { type: "set_flag", flag: "ability_used:fool.7.illusion" },
        ],
      },
    },
  ],
  6: [
    {
      id: "fool.6.faceless",
      nameRu: "Смена облика",
      descriptionRu: "Изменить черты лица и голос.",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:fool.6.faceless", "disguised"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Безликий",
            body: "Кожа и голос подчиняются воле.",
          },
          { type: "set_flag", flag: "disguised" },
          { type: "set_flag", flag: "ability_used:fool.6.faceless" },
        ],
      },
    },
  ],
  5: [
    {
      id: "fool.5.threads",
      nameRu: "Духовные нити",
      descriptionRu: "Ощутить духовные нити цели.",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:fool.5.threads"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Нити",
            body: "В воздухе — паутина связей.",
          },
          { type: "set_flag", flag: "ability_used:fool.5.threads" },
        ],
      },
    },
  ],
  4: [
    {
      id: "fool.4.spirit_world",
      nameRu: "Шаг в духовный мир",
      descriptionRu: "Краткий выход в духовный мир.",
      mechanics: {
        cost: "action",
        oncePerGame: true,
        setsFlags: ["ability_used:fool.4.spirit_world"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Духовный мир",
            body: "Стены становятся полупрозрачными.",
          },
          { type: "set_flag", flag: "ability_used:fool.4.spirit_world" },
        ],
      },
    },
  ],
};

const doorRich: Record<number, AbilityDef[]> = {
  9: [
    {
      id: "door.9.open",
      nameRu: "Открыть дверь",
      descriptionRu: "Проходить сквозь препятствия.",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:door.9.open", "door_opened"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Дверь",
            body: "Граница поддалась.",
          },
          { type: "set_flag", flag: "door_opened" },
          { type: "set_flag", flag: "ability_used:door.9.open" },
        ],
      },
    },
  ],
};

const visionaryRich: Record<number, AbilityDef[]> = {
  9: [
    {
      id: "visionary.9.observe",
      nameRu: "Наблюдение",
      descriptionRu: "Считывать поверхностные эмоции.",
      mechanics: {
        cost: "action",
        cooldownRounds: 0,
        setsFlags: ["ability_used:visionary.9.observe"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Наблюдатель",
            body: "Чужие чувства проступают без слов.",
          },
          { type: "set_flag", flag: "ability_used:visionary.9.observe" },
        ],
      },
    },
  ],
};

const sunRich: Record<number, AbilityDef[]> = {
  9: [
    {
      id: "sun.9.chant",
      nameRu: "Священный напев",
      descriptionRu: "Слова силы и света.",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:sun.9.chant"],
        effects: [
          {
            type: "reveal_text",
            scope: "same_location",
            title: "Напев",
            body: "Голос наполняет комнату теплом.",
          },
          { type: "set_flag", flag: "ability_used:sun.9.chant" },
        ],
      },
    },
  ],
};

const warriorRich: Record<number, AbilityDef[]> = {
  9: [
    {
      id: "twilight_giant.9.strength",
      nameRu: "Сила воина",
      descriptionRu: "Тело крепче обычного человека.",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:twilight_giant.9.strength"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Сила",
            body: "Мышцы отвечают сверх меры.",
          },
          { type: "set_flag", flag: "ability_used:twilight_giant.9.strength" },
        ],
      },
    },
  ],
};

const hermitRich: Record<number, AbilityDef[]> = {
  9: [
    {
      id: "hermit.9.pry",
      nameRu: "Любопытство мистика",
      descriptionRu: "Чуять скрытое знание.",
      mechanics: {
        cost: "action",
        cooldownRounds: 0,
        setsFlags: ["ability_used:hermit.9.pry"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Тайновидец",
            body: "В вещах проступают узоры знания.",
          },
          { type: "set_flag", flag: "ability_used:hermit.9.pry" },
        ],
      },
    },
  ],
};

const darknessRich: Record<number, AbilityDef[]> = {
  9: [
    {
      id: "darkness.9.night_sense",
      nameRu: "Ночное чутьё",
      descriptionRu: "Ночью чувства и сила резко острее; днём — ватность и сонливость.",
      mechanics: {
        cost: "action",
        cooldownRounds: 0,
        setsFlags: ["ability_used:darkness.9.night_sense", "sleepless_night"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Бессонный",
            body: "Если сейчас ночь или полумрак — мир проступает резко, каждый шорох на счету. Днём эта же сила глушится дрёмой.",
          },
          { type: "set_flag", flag: "ability_used:darkness.9.night_sense" },
          { type: "set_flag", flag: "sleepless_night" },
        ],
      },
    },
  ],
};

export const LOTM_PATHWAYS: PathwayDef[] = [
  {
    id: "fool",
    nameRu: "Дурак",
    nameEn: "Fool",
    group: "Lord of Mysteries",
    sequences: seqs(
      "fool",
      [
        [9, "Seer", "Провидец"],
        [8, "Clown", "Клоун"],
        [7, "Magician", "Маг"],
        [6, "Faceless", "Безликий"],
        [5, "Marionettist", "Марионеточник"],
        [4, "Bizarro Sorcerer", "Причудливый чародей"],
      ],
      foolRich,
    ),
  },
  {
    id: "error",
    nameRu: "Ошибка",
    nameEn: "Error",
    group: "Lord of Mysteries",
    sequences: seqs("error", [
      [9, "Marauder", "Мародёр"],
      [8, "Swindler", "Мошенник"],
      [7, "Cryptologist", "Криптолог"],
      [6, "Prometheus", "Прометей"],
      [5, "Dream Stealer", "Похититель снов"],
      [4, "Parasite", "Паразит"],
    ]),
  },
  {
    id: "door",
    nameRu: "Дверь",
    nameEn: "Door",
    group: "Lord of Mysteries",
    sequences: seqs(
      "door",
      [
        [9, "Apprentice", "Ученик"],
        [8, "Trickmaster", "Фокусник"],
        [7, "Astrologer", "Астролог"],
        [6, "Scribe", "Писец"],
        [5, "Traveler", "Путешественник"],
        [4, "Secrets Sorcerer", "Чародей тайн"],
      ],
      doorRich,
    ),
  },
  {
    id: "visionary",
    nameRu: "Визионер",
    nameEn: "Visionary",
    group: "God Almighty",
    sequences: seqs(
      "visionary",
      [
        [9, "Spectator", "Зритель"],
        [8, "Telepathist", "Телепат"],
        [7, "Psychiatrist", "Психиатр"],
        [6, "Hypnotist", "Гипнотизёр"],
        [5, "Dreamwalker", "Сновидец"],
        [4, "Manipulator", "Манипулятор"],
      ],
      visionaryRich,
    ),
  },
  {
    id: "sun",
    nameRu: "Солнце",
    nameEn: "Sun",
    group: "God Almighty",
    sequences: seqs(
      "sun",
      [
        [9, "Bard", "Бард"],
        [8, "Light Suppliant", "Молящий о свете"],
        [7, "Solar High Priest", "Солнечный первосвященник"],
        [6, "Notary", "Нотариус"],
        [5, "Priest of Light", "Жрец света"],
        [4, "Unshadowed", "Бестеневой"],
      ],
      sunRich,
    ),
  },
  {
    id: "tyrant",
    nameRu: "Тиран",
    nameEn: "Tyrant",
    group: "God Almighty",
    sequences: seqs("tyrant", [
      [9, "Sailor", "Моряк"],
      [8, "Folk of Rage", "Народ ярости"],
      [7, "Seafarer", "Мореход"],
      [6, "Wind-blessed", "Благословлённый ветром"],
      [5, "Ocean Songster", "Певец океана"],
      [4, "Cataclysmic Interrer", "Катастрофический погребатель"],
    ]),
  },
  {
    id: "white_tower",
    nameRu: "Белая башня",
    nameEn: "White Tower",
    group: "God Almighty",
    sequences: seqs("white_tower", [
      [9, "Reader", "Читатель"],
      [8, "Student of Ratiocination", "Ученик рассуждения"],
      [7, "Detective", "Детектив"],
      [6, "Polymath", "Эрудит"],
      [5, "Mysticism Magister", "Магистр мистики"],
      [4, "Prophet", "Пророк"],
    ]),
  },
  {
    id: "hanged_man",
    nameRu: "Повешенный",
    nameEn: "Hanged Man",
    group: "God Almighty",
    sequences: seqs("hanged_man", [
      [9, "Secrets Suppliant", "Молящий о тайнах"],
      [8, "Listener", "Слушатель"],
      [7, "Shadow Ascetic", "Теневой аскет"],
      [6, "Rose Bishop", "Розовый епископ"],
      [5, "Shepherd", "Пастырь"],
      [4, "Black Knight", "Чёрный рыцарь"],
    ]),
  },
  {
    id: "darkness",
    nameRu: "Тьма",
    nameEn: "Darkness",
    group: "Eternal Darkness",
    sequences: seqs(
      "darkness",
      [
        [9, "Sleepless", "Бессонный"],
        [8, "Midnight Poet", "Полуночный поэт"],
        [7, "Nightmare", "Кошмар"],
        [6, "Soul Assurer", "Успокоитель душ"],
        [5, "Spirit Warlock", "Духовный чернокнижник"],
        [4, "Nightwatcher", "Ночной страж"],
      ],
      darknessRich,
    ),
  },
  {
    id: "death",
    nameRu: "Смерть",
    nameEn: "Death",
    group: "Eternal Darkness",
    sequences: seqs("death", [
      [9, "Corpse Collector", "Собиратель трупов"],
      [8, "Gravedigger", "Могильщик"],
      [7, "Spirit Medium", "Медиум"],
      [6, "Spirit Guide", "Проводник духов"],
      [5, "Gatekeeper", "Привратник"],
      [4, "Undying", "Бессмертный"],
    ]),
  },
  {
    id: "twilight_giant",
    nameRu: "Гигант сумерек",
    nameEn: "Twilight Giant",
    group: "Eternal Darkness",
    sequences: seqs(
      "twilight_giant",
      [
        [9, "Warrior", "Воин"],
        [8, "Pugilist", "Кулачный боец"],
        [7, "Weapon Master", "Мастер оружия"],
        [6, "Dawn Paladin", "Паладин зари"],
        [5, "Guardian", "Страж"],
        [4, "Demon Hunter", "Охотник на демонов"],
      ],
      warriorRich,
    ),
  },
  {
    id: "demoness",
    nameRu: "Демонесса",
    nameEn: "Demoness",
    group: "Calamity of Destruction",
    sequences: seqs("demoness", [
      [9, "Assassin", "Ассасин"],
      [8, "Instigator", "Подстрекатель"],
      [7, "Witch", "Ведьма"],
      [6, "Pleasure", "Удовольствие"],
      [5, "Affliction", "Страдание"],
      [4, "Despair", "Отчаяние"],
    ]),
  },
  {
    id: "red_priest",
    nameRu: "Красный жрец",
    nameEn: "Red Priest",
    group: "Calamity of Destruction",
    sequences: seqs("red_priest", [
      [9, "Hunter", "Охотник"],
      [8, "Provoker", "Провокатор"],
      [7, "Pyromaniac", "Пироман"],
      [6, "Conspirer", "Заговорщик"],
      [5, "Reaper", "Жнец"],
      [4, "Iron-blooded Knight", "Железнокровый рыцарь"],
    ]),
  },
  {
    id: "hermit",
    nameRu: "Отшельник",
    nameEn: "Hermit",
    group: "Demon of Knowledge",
    sequences: seqs(
      "hermit",
      [
        [9, "Mystery Pryer", "Тайновидец"],
        [8, "Melee Scholar", "Учёный ближнего боя"],
        [7, "Warlock", "Колдун"],
        [6, "Scrolls Professor", "Профессор свитков"],
        [5, "Constellations Master", "Владыка созвездий"],
        [4, "Mysticologist", "Мистиколог"],
      ],
      hermitRich,
    ),
  },
  {
    id: "paragon",
    nameRu: "Совершенство",
    nameEn: "Paragon",
    group: "Demon of Knowledge",
    sequences: seqs("paragon", [
      [9, "Savant", "Знаток"],
      [8, "Archaeologist", "Археолог"],
      [7, "Appraiser", "Оценщик"],
      [6, "Artisan", "Ремесленник"],
      [5, "Astronomer", "Астроном"],
      [4, "Alchemist", "Алхимик"],
    ]),
  },
  {
    id: "wheel_of_fortune",
    nameRu: "Колесо фортуны",
    nameEn: "Wheel of Fortune",
    group: "Key of Light",
    sequences: seqs("wheel_of_fortune", [
      [9, "Monster", "Монстр"],
      [8, "Robot", "Робот"],
      [7, "Lucky One", "Счастливчик"],
      [6, "Calamity Priest", "Жрец бедствий"],
      [5, "Winner", "Победитель"],
      [4, "Misfortune Mage", "Маг неудач"],
    ]),
  },
  {
    id: "mother",
    nameRu: "Мать",
    nameEn: "Mother",
    group: "Goddess of Origin",
    sequences: seqs("mother", [
      [9, "Planter", "Садовод"],
      [8, "Doctor", "Врач"],
      [7, "Harvest Priest", "Жрец урожая"],
      [6, "Biologist", "Биолог"],
      [5, "Druid", "Друид"],
      [4, "Ancient Alchemist", "Древний алхимик"],
    ]),
  },
  {
    id: "moon",
    nameRu: "Луна",
    nameEn: "Moon",
    group: "Goddess of Origin",
    sequences: seqs("moon", [
      [9, "Apothecary", "Аптекарь"],
      [8, "Beast Tamer", "Укротитель зверей"],
      [7, "Vampire", "Вампир"],
      [6, "Potions Professor", "Профессор зелий"],
      [5, "Scarlet Scholar", "Алый учёный"],
      [4, "Shaman King", "Король шаманов"],
    ]),
  },
  {
    id: "abyss",
    nameRu: "Бездна",
    nameEn: "Abyss",
    group: "Fallen Creator",
    sequences: seqs("abyss", [
      [9, "Criminal", "Преступник"],
      [8, "Unwinged Angel", "Бескрылый ангел"],
      [7, "Serial Killer", "Серийный убийца"],
      [6, "Devil", "Дьявол"],
      [5, "Desire Apostle", "Апостол желания"],
      [4, "Demon", "Демон"],
    ]),
  },
  {
    id: "chained",
    nameRu: "Скованный",
    nameEn: "Chained",
    group: "Fallen Creator",
    sequences: seqs("chained", [
      [9, "Prisoner", "Узник"],
      [8, "Lunatic", "Безумец"],
      [7, "Werewolf", "Оборотень"],
      [6, "Zombie", "Зомби"],
      [5, "Wraith", "Призрак"],
      [4, "Puppet", "Марионетка"],
    ]),
  },
  {
    id: "black_emperor",
    nameRu: "Чёрный император",
    nameEn: "Black Emperor",
    group: "Nation of Disorder",
    sequences: seqs("black_emperor", [
      [9, "Lawyer", "Адвокат"],
      [8, "Barbarian", "Варвар"],
      [7, "Briber", "Взяткодатель"],
      [6, "Baron of Corruption", "Барон порчи"],
      [5, "Mentor of Disorder", "Наставник беспорядка"],
      [4, "Earl of the Fallen", "Граф падших"],
    ]),
  },
  {
    id: "justiciar",
    nameRu: "Вершитель",
    nameEn: "Justiciar",
    group: "Nation of Disorder",
    sequences: seqs("justiciar", [
      [9, "Arbiter", "Арбитр"],
      [8, "Sheriff", "Шериф"],
      [7, "Interrogator", "Дознаватель"],
      [6, "Judge", "Судья"],
      [5, "Discipline Paladin", "Паладин дисциплины"],
      [4, "Imperative Mage", "Маг повелений"],
    ]),
  },
];
