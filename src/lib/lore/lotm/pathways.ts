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
    {
      id: "fool.9.omen",
      nameRu: "Дурное предчувствие",
      descriptionRu: "Чует, когда в комнате кто-то смотрит или говорит не всё.",
      kind: "reaction",
      on: "talk",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:fool.9.omen"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Дурное предчувствие",
            body: "В разговоре проскочила фальшь. Не ложь целиком — недосказанное.",
          },
          { type: "set_flag", flag: "ability_used:fool.9.omen" },
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
      descriptionRu: "Открывает закрытые выходы этой комнаты и снимает печать приговора.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:door.9.open", "door_opened"],
        effects: [
          { type: "open_doors" },
          { type: "set_flag", flag: "door_opened" },
        ],
      },
    },
  ],
  8: [
    {
      id: "door.8.trick",
      nameRu: "Мелкая помеха",
      descriptionRu: "Вспышка, звук, сбитый ритм — цирк, не дуэль.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:door.8.trick"],
        effects: [
          {
            type: "reveal_text",
            scope: "same_location",
            title: "Мелкая помеха",
            body: "Вспышка в глаза и чужой звук. Ритм комнаты на миг сломан.",
          },
          { type: "set_flag", flag: "ability_used:door.8.trick" },
        ],
      },
    },
  ],
  7: [
    {
      id: "door.7.star",
      nameRu: "Верный час",
      descriptionRu: "Небо подсказывает, когда и куда.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:door.7.star", "right_hour"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Верный час",
            body: "Совпадение легло. Сейчас — тот час. Ошибка в расчёте была бы дороже.",
          },
          { type: "set_flag", flag: "right_hour" },
        ],
      },
    },
  ],
  6: [
    {
      id: "door.6.scribe",
      nameRu: "Записать тень",
      descriptionRu: "Копирует последнюю силу комнаты как свою кнопку на ход.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:door.6.scribe"],
        effects: [
          { type: "copy_last_ability", rounds: 1 },
          { type: "set_flag", flag: "ability_used:door.6.scribe" },
        ],
      },
    },
  ],
  5: [
    {
      id: "door.5.step",
      nameRu: "Короткий шаг",
      descriptionRu: "Шаг в уже открытую локацию. Один раз.",
      kind: "active",
      target: "location",
      mechanics: {
        cost: "action",
        oncePerGame: true,
        setsFlags: ["ability_used:door.5.step"],
        effects: [
          { type: "travel" },
          { type: "set_flag", flag: "ability_used:door.5.step" },
        ],
      },
    },
  ],
  4: [
    {
      id: "door.4.secret_door",
      nameRu: "Дверь, которой нет",
      descriptionRu: "Открывает проход, если автор повесил на эту способность локацию.",
      kind: "active",
      mechanics: {
        cost: "action",
        oncePerGame: true,
        setsFlags: ["ability_used:door.4.secret_door", "secret_door"],
        effects: [
          { type: "open_doors" },
          { type: "set_flag", flag: "secret_door" },
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
  8: [
    {
      id: "visionary.8.thought",
      nameRu: "Обрывок мысли",
      descriptionRu: "Слышит кусок чужой мысли.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:visionary.8.thought"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Обрывок мысли",
            body: "Не книга — шум. Одна фраза всплыла и тут же ушла.",
          },
        ],
      },
    },
  ],
  7: [
    {
      id: "visionary.7.mend",
      nameRu: "Слово врача",
      descriptionRu: "Снимает пометку или вешает сомнение.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:visionary.7.mend"],
        effects: [
          { type: "clear_status", kind: "mark" },
          {
            type: "apply_status",
            status: {
              id: "doubt",
              title: "Сомнение",
              body: "Слово вскрыло старую рану. На ход труднее решиться.",
              kind: "mark",
              rounds: 1,
            },
          },
        ],
      },
    },
  ],
  6: [
    {
      id: "visionary.6.hold",
      nameRu: "Стой",
      descriptionRu: "Короткий приказ. Пока взгляд держит — нельзя идти.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:visionary.6.hold"],
        effects: [
          {
            type: "apply_status",
            status: {
              id: "held",
              title: "Приказ: стой",
              body: "Чужая воля держит ноги. Сильная воля сорвёт нить на следующем ходу.",
              kind: "restraint",
              blocks: ["move"],
              rounds: 1,
            },
          },
        ],
      },
    },
  ],
  5: [
    {
      id: "visionary.5.dreamwalk",
      nameRu: "Чужой сон",
      descriptionRu: "Один раз входит в чужой сон. Тело остаётся здесь.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        oncePerGame: true,
        setsFlags: ["ability_used:visionary.5.dreamwalk"],
        effects: [
          { type: "steal_memory" },
          {
            type: "apply_status",
            status: {
              id: "asleep",
              title: "Во сне",
              body: "Тело здесь, взгляд там. На ход нельзя осматривать.",
              kind: "restraint",
              blocks: ["inspect"],
              rounds: 1,
            },
          },
        ],
      },
    },
  ],
  4: [
    {
      id: "visionary.4.strings",
      nameRu: "Уже написано",
      descriptionRu: "Слышит, чей выбор в разговоре уже кем-то написан.",
      kind: "reaction",
      on: "talk",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:visionary.4.strings"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Уже написано",
            body: "Этот ответ не родился сейчас. Кто-то написал его раньше.",
          },
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
  8: [
    {
      id: "sun.8.warmth",
      nameRu: "Тепло веры",
      descriptionRu: "Снимает проклятие или согревает.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:sun.8.warmth"],
        effects: [
          { type: "clear_status", kind: "curse" },
          {
            type: "apply_status",
            status: {
              id: "warmth",
              title: "Тепло",
              body: "Свет лёг на плечи. На ход легче.",
              kind: "blessing",
              rounds: 1,
            },
          },
        ],
      },
    },
  ],
  7: [
    {
      id: "sun.7.bless",
      nameRu: "Слово света",
      descriptionRu: "Благословляет комнату. Проклятие светом автор вешает на флаг sun_word.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:sun.7.bless", "sun_word"],
        effects: [
          {
            type: "reveal_text",
            scope: "same_location",
            title: "Слово света",
            body: "Голос стал хором. Свет лёг на всех, кто здесь.",
          },
          { type: "set_flag", flag: "sun_word" },
        ],
      },
    },
  ],
  6: [
    {
      id: "sun.6.oath",
      nameRu: "Скрепить клятву",
      descriptionRu: "Подсвечивает правду и ложь в репликах неписей этой комнаты.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["oath", "ability_used:sun.6.oath"],
        effects: [
          { type: "bind_oath" },
          { type: "set_flag", flag: "oath" },
        ],
      },
    },
  ],
  5: [
    {
      id: "sun.5.cut",
      nameRu: "Резать тьму",
      descriptionRu: "Открывает искры, которым нужна эта сила.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:sun.5.cut", "light_cut"],
        effects: [
          { type: "reveal_hidden", rounds: 1 },
          { type: "set_flag", flag: "light_cut" },
        ],
      },
    },
  ],
  4: [
    {
      id: "sun.4.unshadowed",
      nameRu: "Бестеневой",
      descriptionRu: "Ложь и скрытое рядом сами проступают.",
      kind: "passive",
      mechanics: {
        cost: "action",
        setsFlags: ["unshadowed"],
        effects: [
          { type: "reveal_hidden" },
          { type: "set_flag", flag: "unshadowed" },
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
  8: [
    {
      id: "twilight_giant.8.blow",
      nameRu: "Удар",
      descriptionRu: "Оглушает цель на ход.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:twilight_giant.8.blow"],
        effects: [
          {
            type: "apply_status",
            status: { id: "stunned", title: "Оглушён", body: "Удар сел. На ход нельзя применить силу.", kind: "restraint", blocks: ["ability"], rounds: 1 },
          },
        ],
      },
    },
  ],
  7: [
    {
      id: "twilight_giant.7.weapon",
      nameRu: "Чужое оружие",
      descriptionRu: "Предмет с этой силой бьёт вашими руками.",
      kind: "passive",
      mechanics: {
        cost: "action",
        setsFlags: ["weapon_hand"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Оружие", body: "Вещь в руке ложится как своя. Без оружия сила спит." },
          { type: "set_flag", flag: "weapon_hand" },
        ],
      },
    },
  ],
  6: [
    {
      id: "twilight_giant.6.dawn",
      nameRu: "Удар зари",
      descriptionRu: "Благословляет удар. Рядом с тьмой — конфликт.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:twilight_giant.6.dawn", "dawn_strike"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Заря", body: "Удар несёт свет. Тьма рядом отвечает искрой." },
          { type: "set_flag", flag: "dawn_strike" },
        ],
      },
    },
  ],
  5: [
    {
      id: "twilight_giant.5.cover",
      nameRu: "Прикрыть",
      descriptionRu: "Союзник под прикрытием на ход.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:twilight_giant.5.cover"],
        effects: [
          {
            type: "apply_status",
            status: { id: "covered", title: "Прикрыт", body: "Удар, адресованный вам, поймает страж.", kind: "blessing", rounds: 1 },
          },
        ],
      },
    },
  ],
  4: [
    {
      id: "twilight_giant.4.hunt",
      nameRu: "Охота на тень",
      descriptionRu: "Видит и ранит потустороннее. Открывает такие искры.",
      kind: "active",
      target: "spark",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:twilight_giant.4.hunt", "demon_hunt"],
        effects: [
          { type: "reveal_hidden", rounds: 1 },
          { type: "set_flag", flag: "demon_hunt" },
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
  8: [
    {
      id: "hermit.8.draw",
      nameRu: "Вытянуть знание",
      descriptionRu: "Достаёт скрытое знание из вещи.",
      kind: "active",
      target: "spark",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:hermit.8.draw"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Знание", body: "Вещь отдала то, что в ней спрятано. Не всё — слой." },
        ],
      },
    },
  ],
  7: [
    {
      id: "hermit.7.trace",
      nameRu: "След колдовства",
      descriptionRu: "Чужое колдовство оставляет улику.",
      kind: "reaction",
      on: "ability",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:hermit.7.trace"],
        effects: [
          {
            type: "grant_clue",
            clue: { id: "spell_trace", title: "След колдовства", body: "Чужая сила оставила почерк.", source: "Отшельник" },
          },
        ],
      },
    },
  ],
  6: [
    {
      id: "hermit.6.chart",
      nameRu: "Звёздная карта",
      descriptionRu: "Говорит, куда.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:hermit.6.chart", "star_chart"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Карта", body: "Звёзды сложили направление. Не дорогу — сторону." },
          { type: "set_flag", flag: "star_chart" },
        ],
      },
    },
  ],
  5: [
    {
      id: "hermit.5.ask",
      nameRu: "Спросить напрямую",
      descriptionRu: "Один раз. Один ответ, и цена вопроса.",
      kind: "active",
      mechanics: {
        cost: "action",
        oncePerGame: true,
        setsFlags: ["ability_used:hermit.5.ask"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Ответ", body: "Знание ответило прямо. Цена уже легла." },
          {
            type: "apply_status",
            status: { id: "price", title: "Цена вопроса", body: "Прямой ответ не бывает бесплатным.", kind: "mark" },
          },
        ],
      },
    },
  ],
  4: [
    {
      id: "hermit.4.system",
      nameRu: "Система за частным",
      descriptionRu: "Скрытое знание само проступает. Открывает мистические искры.",
      kind: "passive",
      mechanics: {
        cost: "action",
        setsFlags: ["mystic_eye"],
        effects: [
          { type: "reveal_hidden" },
          { type: "set_flag", flag: "mystic_eye" },
        ],
      },
    },
  ],
};

const errorRich: Record<number, AbilityDef[]> = {
  9: [
    {
      id: "error.9.pick",
      nameRu: "Чужой карман",
      descriptionRu: "Крадёт удачу момента: видит, когда карман открыт.",
      kind: "active",
      target: "spark",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:error.9.pick"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Чужой карман",
            body: "Удача на миг отлипла от вещи. Карман был открыт — или вот-вот откроется.",
          },
          { type: "set_flag", flag: "ability_used:error.9.pick" },
        ],
      },
    },
  ],
  8: [
    {
      id: "error.8.swindle",
      nameRu: "Сдвинуть доверие",
      descriptionRu: "Слова и жест сдвигают, кому здесь верят.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:error.8.swindle", "trust_shifted"],
        effects: [
          {
            type: "reveal_text",
            scope: "same_location",
            title: "Сдвинуть доверие",
            body: "Доверие в комнате качнулось. Верят чуть дольше, чем следует.",
          },
          { type: "set_flag", flag: "trust_shifted" },
        ],
      },
    },
  ],
  7: [
    {
      id: "error.7.code",
      nameRu: "Вскрыть код",
      descriptionRu: "Печать, тайнопись, договор — текст, который можно переписать.",
      kind: "active",
      target: "spark",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:error.7.code", "code_broken"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Вскрыть код",
            body: "Печать поддалась. Под ней — не тайна целиком, а место, где её переписали.",
          },
          { type: "set_flag", flag: "code_broken" },
        ],
      },
    },
  ],
  6: [
    {
      id: "error.6.prometheus",
      nameRu: "Унести огонь",
      descriptionRu: "Копирует последнюю силу, применённую в этой комнате. На ход она ваша кнопка.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:error.6.prometheus"],
        effects: [
          { type: "copy_last_ability", rounds: 1 },
          { type: "set_flag", flag: "ability_used:error.6.prometheus" },
        ],
      },
    },
  ],
  5: [
    {
      id: "error.5.dream",
      nameRu: "Украсть сон",
      descriptionRu: "Забирает одно воспоминание в свою вкладку. У хозяина оно остаётся.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:error.5.dream"],
        effects: [
          { type: "steal_memory" },
          { type: "set_flag", flag: "ability_used:error.5.dream" },
        ],
      },
    },
  ],
  4: [
    {
      id: "error.4.parasite",
      nameRu: "Вжиться",
      descriptionRu: "На ход носит силу выбранного соседнего пути, если сосед есть.",
      kind: "active",
      mechanics: {
        cost: "action",
        oncePerGame: true,
        setsFlags: ["ability_used:error.4.parasite"],
        effects: [
          { type: "borrow_neighbor", rounds: 1 },
          { type: "set_flag", flag: "parasite_host" },
        ],
      },
    },
  ],
};

const tyrantRich: Record<number, AbilityDef[]> = {
  9: [
    {
      id: "tyrant.9.tide",
      nameRu: "Солёный ветер",
      descriptionRu: "У воды и в сырости чует течение.",
      kind: "passive",
      mechanics: {
        cost: "action",
        setsFlags: ["tyrant_tide"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Солёный ветер",
            body: "Даже в городе воздух пахнет солью. Сырое место само показывает, куда течёт.",
          },
          { type: "set_flag", flag: "tyrant_tide" },
        ],
      },
    },
  ],
  8: [
    {
      id: "tyrant.8.rage",
      nameRu: "Волна гнева",
      descriptionRu: "Гнев разгоняет, потом оставляет пустоту.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:tyrant.8.rage"],
        effects: [
          {
            type: "reveal_text",
            scope: "same_location",
            title: "Волна гнева",
            body: "Ярость прошла по комнате. После неё тише, чем было.",
          },
          {
            type: "apply_status",
            status: {
              id: "spent",
              title: "Опустошение",
              body: "Вспышка съела силы. На ход труднее начать.",
              kind: "mark",
              rounds: 1,
            },
          },
        ],
      },
    },
  ],
  7: [
    {
      id: "tyrant.7.compass",
      nameRu: "Компас",
      descriptionRu: "Не теряется. Открывает искры пути, если автор их повесил.",
      kind: "passive",
      mechanics: {
        cost: "action",
        setsFlags: ["seafarer"],
        effects: [
          { type: "open_doors" },
          { type: "set_flag", flag: "seafarer" },
        ],
      },
    },
  ],
  6: [
    {
      id: "tyrant.6.wind",
      nameRu: "Порыв",
      descriptionRu: "Лёгкий шаг. В замкнутой комнате слабее.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:tyrant.6.wind", "wind_step"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Порыв",
            body: "Воздух стал союзником. В четырёх стенах порыв глуше.",
          },
          { type: "set_flag", flag: "wind_step" },
        ],
      },
    },
  ],
  5: [
    {
      id: "tyrant.5.song",
      nameRu: "Песня океана",
      descriptionRu: "Песня всем в комнате. Фальшь вешает состояние.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:tyrant.5.song"],
        effects: [
          {
            type: "reveal_text",
            scope: "same_location",
            title: "Песня океана",
            body: "Голос поднял волну. Если сфальшивить — утопит своих.",
          },
          {
            type: "apply_status",
            status: {
              id: "false_note",
              title: "Фальшь",
              body: "Нота села не туда. Комната это слышала.",
              kind: "mark",
              rounds: 1,
            },
          },
        ],
      },
    },
  ],
  4: [
    {
      id: "tyrant.4.scar",
      nameRu: "Шрам места",
      descriptionRu: "Один раз. Бедствие: смена фона, если автор повесил на флаг.",
      kind: "active",
      mechanics: {
        cost: "action",
        oncePerGame: true,
        setsFlags: ["ability_used:tyrant.4.scar", "cataclysm"],
        effects: [
          { type: "shift_background" },
          { type: "set_flag", flag: "cataclysm" },
        ],
      },
    },
  ],
};

const whiteTowerRich: Record<number, AbilityDef[]> = {
  9: [
    {
      id: "white_tower.9.read",
      nameRu: "Схватить схему",
      descriptionRu: "Читает предмет или записку быстрее обычного.",
      kind: "active",
      target: "spark",
      mechanics: {
        cost: "action",
        cooldownRounds: 0,
        setsFlags: ["ability_used:white_tower.9.read"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Схватить схему",
            body: "Страница или устройство складываются в схему. Память держит её, пока не отвлечётесь.",
          },
          { type: "set_flag", flag: "ability_used:white_tower.9.read" },
        ],
      },
    },
  ],
  8: [
    {
      id: "white_tower.8.chain",
      nameRu: "Цепочка улик",
      descriptionRu: "Собирает уже виденное в одну улику.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:white_tower.8.chain"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Цепочка улик",
            body: "Разрозненное легло в одну линию. Ошибка в посылке рушит вывод.",
          },
          {
            type: "grant_clue",
            clue: {
              id: "chain_of_clues",
              title: "Цепочка",
              body: "Уже виденное собрано в один вывод.",
              source: "Рассуждение",
            },
          },
        ],
      },
    },
  ],
  7: [
    {
      id: "white_tower.7.detail",
      nameRu: "Деталь",
      descriptionRu: "Видит то, что другие пропускают. Открывает детективные искры.",
      kind: "passive",
      mechanics: {
        cost: "action",
        setsFlags: ["detective_eye"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Деталь", body: "На сцене кричит то, чего другие не заметили." },
          { type: "set_flag", flag: "detective_eye" },
        ],
      },
    },
  ],
  6: [
    {
      id: "white_tower.6.fact",
      nameRu: "Редкий факт",
      descriptionRu: "Достаёт нужное по предмету.",
      kind: "active",
      target: "spark",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:white_tower.6.fact"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Редкий факт",
            body: "Библиотека на ногах вспомнила нужную страницу.",
          },
        ],
      },
    },
  ],
  5: [
    {
      id: "white_tower.5.rite",
      nameRu: "Разобрать обряд",
      descriptionRu: "Ослабляет или усиливает чужой ритуал флагом.",
      kind: "active",
      target: "spark",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:white_tower.5.rite", "rite_read"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Разобрать обряд",
            body: "Символ, печать, ингредиент — система. Можно ослабить или усилить.",
          },
          { type: "set_flag", flag: "rite_read" },
        ],
      },
    },
  ],
  4: [
    {
      id: "white_tower.4.fork",
      nameRu: "Развилка",
      descriptionRu: "Один раз. Короткая ветка будущего. Сказанное ставит причину.",
      kind: "active",
      mechanics: {
        cost: "action",
        oncePerGame: true,
        setsFlags: ["ability_used:white_tower.4.fork", "prophecy"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Развилка",
            body: "Не судьба целиком — развилка. Сказанное вслух может само стать причиной.",
          },
          { type: "set_flag", flag: "prophecy" },
        ],
      },
    },
  ],
};

const hangedRich: Record<number, AbilityDef[]> = {
  9: [
    {
      id: "hanged_man.9.whisper",
      nameRu: "Шёпот запретного",
      descriptionRu: "Если в вещи есть тайное, слышит зуд.",
      kind: "reaction",
      on: "inspect",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:hanged_man.9.whisper"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Шёпот запретного",
            body: "В только что осмотренном есть то, о чём лучше молчать. Зуд в душе не врёт.",
          },
          { type: "set_flag", flag: "ability_used:hanged_man.9.whisper" },
        ],
      },
    },
  ],
  8: [
    {
      id: "hanged_man.8.listen",
      nameRu: "Голос, которого нет",
      descriptionRu: "При входе слышит того, кого в комнате нет.",
      kind: "reaction",
      on: "enter",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:hanged_man.8.listen"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Голос, которого нет",
            body: "В комнате говорят те, кого здесь нет. Без фильтра это сведёт с ума.",
          },
        ],
      },
    },
  ],
  7: [
    {
      id: "hanged_man.7.edge",
      nameRu: "Грань света",
      descriptionRu: "На границе сильнее. Открывает теневые искры.",
      kind: "passive",
      mechanics: {
        cost: "action",
        setsFlags: ["shadow_edge"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Грань", body: "Аскеза кормит силу. Удовольствие притупляет грань." },
          { type: "set_flag", flag: "shadow_edge" },
        ],
      },
    },
  ],
  6: [
    {
      id: "hanged_man.6.blood",
      nameRu: "Исцеление через боль",
      descriptionRu: "Снимает состояние и вешает долг.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:hanged_man.6.blood"],
        effects: [
          { type: "clear_status", kind: "curse" },
          {
            type: "apply_status",
            status: {
              id: "debt",
              title: "Долг",
              body: "Помогли через боль. Союзники боятся этой помощи.",
              kind: "mark",
            },
          },
        ],
      },
    },
  ],
  5: [
    {
      id: "hanged_man.5.flock",
      nameRu: "Паства",
      descriptionRu: "Собирает союзников здесь под один флаг.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:hanged_man.5.flock", "flock"],
        effects: [
          {
            type: "reveal_text",
            scope: "same_location",
            title: "Паства",
            body: "Сломленные и тени на миг стали стадом. Потеря контроля превратит его в хаос.",
          },
          { type: "set_flag", flag: "flock" },
        ],
      },
    },
  ],
  4: [
    {
      id: "hanged_man.4.blade",
      nameRu: "Клинок тёмной веры",
      descriptionRu: "Удар. Рядом со светлым путём — искра конфликта.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:hanged_man.4.blade", "faith_spark"],
        effects: [
          {
            type: "reveal_text",
            scope: "same_location",
            title: "Клинок тёмной веры",
            body: "Удар пропитан запретным. Светлые пути рядом искрят.",
          },
          { type: "set_flag", flag: "faith_spark" },
        ],
      },
    },
  ],
};

const deathRich: Record<number, AbilityDef[]> = {
  9: [
    {
      id: "death.9.cold",
      nameRu: "Холод недавней смерти",
      descriptionRu: "Чует, где недавно умирали.",
      kind: "passive",
      mechanics: {
        cost: "action",
        setsFlags: ["death_cold"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Холод",
            body: "На предметах и в углах лежит холод, которого не бывает от сквозняка.",
          },
          { type: "set_flag", flag: "death_cold" },
        ],
      },
    },
  ],
  8: [
    {
      id: "death.8.grave",
      nameRu: "Прочесть смерть",
      descriptionRu: "По предмету читает недавнюю смерть.",
      kind: "active",
      target: "spark",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:death.8.grave"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Могильщик", body: "На вещи лежит, как и когда здесь умирали. Не имя — след." },
        ],
      },
    },
  ],
  7: [
    {
      id: "death.7.medium",
      nameRu: "Голос мёртвого",
      descriptionRu: "Короткий разговор. Ответ пишет автор репликой на флаге.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:death.7.medium", "dead_speak"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Медиум", body: "Мёртвый ответил коротко. Долгий разговор опасен." },
          { type: "set_flag", flag: "dead_speak" },
        ],
      },
    },
  ],
  6: [
    {
      id: "death.6.guide",
      nameRu: "Провести дух",
      descriptionRu: "Ведёт. Ошибка — состояние «заблудился».",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:death.6.guide"],
        effects: [
          {
            type: "apply_status",
            status: { id: "lost", title: "Заблудился", body: "Нить духа сбилась. На ход выходы плывут.", kind: "mark", blocks: ["move"], rounds: 1 },
          },
        ],
      },
    },
  ],
  5: [
    {
      id: "death.5.gate",
      nameRu: "Держать порог",
      descriptionRu: "На ход закрывает выход флагом.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:death.5.gate", "threshold_held"],
        effects: [
          { type: "seal_exits", rounds: 1 },
          { type: "set_flag", flag: "threshold_held" },
        ],
      },
    },
  ],
  4: [
    {
      id: "death.4.edge",
      nameRu: "На грани",
      descriptionRu: "Смертельный удар не кончает сразу.",
      kind: "passive",
      mechanics: {
        cost: "action",
        setsFlags: ["undying"],
        effects: [
          {
            type: "apply_status",
            status: { id: "on_edge", title: "На грани", body: "Удар, который должен был кончить, оставил вас здесь.", kind: "blessing" },
          },
          { type: "set_flag", flag: "undying" },
        ],
      },
    },
  ],
};

const demonessRich: Record<number, AbilityDef[]> = {
  9: [
    {
      id: "demoness.9.glance",
      nameRu: "Чужой взгляд",
      descriptionRu: "На миг перетягивает внимание на себя.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:demoness.9.glance"],
        effects: [
          {
            type: "reveal_text",
            scope: "same_location",
            title: "Чужой взгляд",
            body: "Внимание комнаты на секунду сбилось. Смотрели не туда, куда собирались.",
          },
          { type: "set_flag", flag: "ability_used:demoness.9.glance" },
        ],
      },
    },
  ],
  8: [
    {
      id: "demoness.8.stir",
      nameRu: "Разжечь",
      descriptionRu: "Вешает «на взводе» на цель.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:demoness.8.stir"],
        effects: [
          {
            type: "apply_status",
            status: { id: "wound_up", title: "На взводе", body: "Ссора уже в воздухе. Малейший повод хватит.", kind: "mark", rounds: 1 },
          },
        ],
      },
    },
  ],
  7: [
    {
      id: "demoness.7.hex",
      nameRu: "Сглаз",
      descriptionRu: "Короткое проклятие.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:demoness.7.hex"],
        effects: [
          {
            type: "apply_status",
            status: { id: "hex", title: "Сглаз", body: "Мелочи идут против. На два хода.", kind: "curse", rounds: 2 },
          },
        ],
      },
    },
  ],
  6: [
    {
      id: "demoness.6.charm",
      nameRu: "Очаровать",
      descriptionRu: "Вешает очарование.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:demoness.6.charm"],
        effects: [
          {
            type: "apply_status",
            status: { id: "charmed", title: "Очарован", body: "Смотрите туда, куда сказали. На ход труднее уйти.", kind: "curse", blocks: ["move"], rounds: 1 },
          },
        ],
      },
    },
  ],
  5: [
    {
      id: "demoness.5.pain",
      nameRu: "Боль",
      descriptionRu: "Вешает боль и снимает очарование.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:demoness.5.pain"],
        effects: [
          { type: "clear_status", statusId: "charmed" },
          {
            type: "apply_status",
            status: { id: "pain", title: "Боль", body: "Очарование лопнуло. Осталась боль.", kind: "curse", rounds: 1 },
          },
        ],
      },
    },
  ],
  4: [
    {
      id: "demoness.4.despair",
      nameRu: "Отчаяние",
      descriptionRu: "Один раз. Комната впадает в отчаяние.",
      kind: "active",
      mechanics: {
        cost: "action",
        oncePerGame: true,
        setsFlags: ["ability_used:demoness.4.despair", "despair"],
        effects: [
          { type: "shift_background" },
          { type: "set_flag", flag: "despair" },
        ],
      },
    },
  ],
};

const redPriestRich: Record<number, AbilityDef[]> = {
  9: [
    {
      id: "red_priest.9.spark",
      nameRu: "Искра гнева",
      descriptionRu: "Разводит короткий гнев.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:red_priest.9.spark", "rage"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Искра гнева",
            body: "В груди вспыхнуло. На этот ход злость теплее мысли.",
          },
          { type: "set_flag", flag: "rage" },
          { type: "set_flag", flag: "ability_used:red_priest.9.spark" },
        ],
      },
    },
  ],
  8: [
    {
      id: "red_priest.8.dare",
      nameRu: "Вызов",
      descriptionRu: "Вызывает на конфликт.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:red_priest.8.dare"],
        effects: [
          {
            type: "apply_status",
            status: { id: "dared", title: "Вызван", body: "Отказаться можно. Забыть вызов труднее.", kind: "mark", rounds: 1 },
          },
        ],
      },
    },
  ],
  7: [
    {
      id: "red_priest.7.fire",
      nameRu: "Огонь",
      descriptionRu: "В замкнутой комнате опасен и своим.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:red_priest.7.fire", "fire"],
        effects: [
          { type: "reveal_text", scope: "same_location", title: "Огонь", body: "Пламя взялось. В четырёх стенах оно не выбирает." },
          { type: "set_flag", flag: "fire" },
        ],
      },
    },
  ],
  6: [
    {
      id: "red_priest.6.plot",
      nameRu: "Заговор",
      descriptionRu: "Плетёт план на тех, кто здесь.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:red_priest.6.plot", "plot"],
        effects: [
          { type: "reveal_text", scope: "same_location", title: "Заговор", body: "Слова легли как план. Кто здесь — в нём." },
          { type: "set_flag", flag: "plot" },
        ],
      },
    },
  ],
  5: [
    {
      id: "red_priest.5.reap",
      nameRu: "Добить",
      descriptionRu: "Сильнее, если на цели уже боль или пустота.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:red_priest.5.reap"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Жнец", body: "Слабое место видно. Если цель уже надломлена — удар короче." },
        ],
      },
    },
  ],
  4: [
    {
      id: "red_priest.4.iron",
      nameRu: "Железная кровь",
      descriptionRu: "Не ломается. Статус всегда на нём.",
      kind: "passive",
      mechanics: {
        cost: "action",
        setsFlags: ["iron_blood"],
        effects: [
          {
            type: "apply_status",
            status: { id: "iron", title: "Железнокровый", body: "Боль не кончает. Она только отмечает.", kind: "blessing" },
          },
          { type: "set_flag", flag: "iron_blood" },
        ],
      },
    },
  ],
};

const paragonRich: Record<number, AbilityDef[]> = {
  9: [
    {
      id: "paragon.9.flaw",
      nameRu: "Изъян",
      descriptionRu: "Чует изъян в предмете или ритуале.",
      kind: "passive",
      mechanics: {
        cost: "action",
        setsFlags: ["paragon_flaw"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Изъян",
            body: "В вещи или обряде видна трещина. Не всякий её заметит, пока не тронет.",
          },
          { type: "set_flag", flag: "paragon_flaw" },
        ],
      },
    },
  ],
  8: [
    {
      id: "paragon.8.break",
      nameRu: "Как ломается",
      descriptionRu: "Находит изъян и говорит, как он ломается.",
      kind: "active",
      target: "spark",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:paragon.8.break"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Изъян", body: "Трещина названа. Теперь видно, куда нажать." },
        ],
      },
    },
  ],
  7: [
    {
      id: "paragon.7.rite",
      nameRu: "Несовершенный обряд",
      descriptionRu: "Чует изъян ритуала. Открывает такие искры.",
      kind: "passive",
      mechanics: {
        cost: "action",
        setsFlags: ["flawed_rite"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Обряд", body: "В ритуале виден шов. Искры изъяна больше не прячутся." },
          { type: "set_flag", flag: "flawed_rite" },
        ],
      },
    },
  ],
  6: [
    {
      id: "paragon.6.mend",
      nameRu: "Подправить обряд",
      descriptionRu: "Усиливает или гасит чужой обряд флагом.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:paragon.6.mend", "rite_mended"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Подправка", body: "Обряд чуть сдвинут. Усилен или погашен — как повешено." },
          { type: "set_flag", flag: "rite_mended" },
        ],
      },
    },
  ],
  5: [
    {
      id: "paragon.5.snap",
      nameRu: "Довести до разрыва",
      descriptionRu: "Один раз. Изъян лопается.",
      kind: "active",
      target: "spark",
      mechanics: {
        cost: "action",
        oncePerGame: true,
        setsFlags: ["ability_used:paragon.5.snap", "flaw_snapped"],
        effects: [
          { type: "consume_spark" },
          { type: "set_flag", flag: "flaw_snapped" },
        ],
      },
    },
  ],
  4: [
    {
      id: "paragon.4.ideal",
      nameRu: "Идеал рядом",
      descriptionRu: "Чужое кривое само заметно при осмотре.",
      kind: "reaction",
      on: "inspect",
      mechanics: {
        cost: "action",
        cooldownRounds: 0,
        setsFlags: ["ability_used:paragon.4.ideal"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Идеал", body: "Рядом с идеалом кривое кричит. Только что осмотренное несовершенно." },
        ],
      },
    },
  ],
};

const wheelRich: Record<number, AbilityDef[]> = {
  9: [
    {
      id: "wheel_of_fortune.9.shift",
      nameRu: "Сдвиг удачи",
      descriptionRu: "Чует, когда чужая способность сдвинула шанс.",
      kind: "reaction",
      on: "ability",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:wheel_of_fortune.9.shift"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Сдвиг удачи",
            body: "Колесо чуть повернулось. Чей-то успех или провал был не совсем своим.",
          },
          { type: "set_flag", flag: "ability_used:wheel_of_fortune.9.shift" },
        ],
      },
    },
  ],
  8: [
    {
      id: "wheel_of_fortune.8.dim",
      nameRu: "Чужой успех тускнеет",
      descriptionRu: "Чужой успех оставляет тихую пометку.",
      kind: "reaction",
      on: "ability",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:wheel_of_fortune.8.dim"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Тусклый успех", body: "Чужая удача чуть померкла. Колесо это запомнило." },
        ],
      },
    },
  ],
  7: [
    {
      id: "wheel_of_fortune.7.spin",
      nameRu: "Крутить себе",
      descriptionRu: "На ход удача за вас.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:wheel_of_fortune.7.spin", "luck"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Удача", body: "Колесо на ход смотрит в вашу сторону." },
          { type: "set_flag", flag: "luck" },
        ],
      },
    },
  ],
  6: [
    {
      id: "wheel_of_fortune.6.tilt",
      nameRu: "Сдвинуть шанс",
      descriptionRu: "Вешает везение или невезение.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:wheel_of_fortune.6.tilt"],
        effects: [
          {
            type: "apply_status",
            status: { id: "luck_tilt", title: "Сдвинутый шанс", body: "Удача цели качнулась. В какую сторону — решает стол.", kind: "mark", rounds: 1 },
          },
        ],
      },
    },
  ],
  5: [
    {
      id: "wheel_of_fortune.5.step",
      nameRu: "Удачный шаг",
      descriptionRu: "При входе чует, удачен ли шаг.",
      kind: "reaction",
      on: "enter",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:wheel_of_fortune.5.step"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Шаг", body: "Этот вход удачен. Или нет. Колесо не врёт, но и не объясняет." },
        ],
      },
    },
  ],
  4: [
    {
      id: "wheel_of_fortune.4.break",
      nameRu: "Сломать полосу",
      descriptionRu: "Один раз. Снимает чужую полосу удачи, если автор повесил.",
      kind: "active",
      mechanics: {
        cost: "action",
        oncePerGame: true,
        setsFlags: ["ability_used:wheel_of_fortune.4.break", "streak_broken"],
        effects: [
          { type: "clear_flags", flags: ["luck", "luck_tilt"] },
          { type: "set_flag", flag: "streak_broken" },
        ],
      },
    },
  ],
};

const motherRich: Record<number, AbilityDef[]> = {
  9: [
    {
      id: "mother.9.tend",
      nameRu: "Под опекой",
      descriptionRu: "Короткое утешение или опора.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:mother.9.tend", "tended"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Под опекой",
            body: "Тепло легло на чужие плечи. Ненадолго рядом легче дышать.",
          },
          { type: "set_flag", flag: "tended" },
          { type: "set_flag", flag: "ability_used:mother.9.tend" },
        ],
      },
    },
  ],
  8: [
    {
      id: "mother.8.feed",
      nameRu: "Накормить силой",
      descriptionRu: "Снимает опустошение и похожие пометки.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:mother.8.feed"],
        effects: [
          { type: "clear_status", kind: "mark" },
          { type: "reveal_text", scope: "self", title: "Корм", body: "Пустота села. Сила вернулась чужими руками." },
        ],
      },
    },
  ],
  7: [
    {
      id: "mother.7.need",
      nameRu: "Чуять нужду",
      descriptionRu: "Видит, кому плохо. Открывает искры нужды.",
      kind: "passive",
      mechanics: {
        cost: "action",
        setsFlags: ["need_sense"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Нужда", body: "Кому здесь плохо, видно без слов." },
          { type: "set_flag", flag: "need_sense" },
        ],
      },
    },
  ],
  6: [
    {
      id: "mother.6.bond",
      nameRu: "Узы",
      descriptionRu: "Кладёт узы на всех в комнате.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:mother.6.bond", "bonds"],
        effects: [
          { type: "reveal_text", scope: "same_location", title: "Узы", body: "Комната на миг стала одной семьёй. Это и опора, и цепь." },
          { type: "set_flag", flag: "bonds" },
        ],
      },
    },
  ],
  5: [
    {
      id: "mother.5.wing",
      nameRu: "Под крылом",
      descriptionRu: "Один раз. Рождает защиту союзнику.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        oncePerGame: true,
        setsFlags: ["ability_used:mother.5.wing"],
        effects: [
          {
            type: "apply_status",
            status: { id: "wing", title: "Под крылом", body: "Защита легла. На этот раз удар придётся не в полную.", kind: "blessing", rounds: 2 },
          },
        ],
      },
    },
  ],
  4: [
    {
      id: "mother.4.harvest",
      nameRu: "Жатва",
      descriptionRu: "Один раз. Забирает одно состояние себе как улику.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        oncePerGame: true,
        setsFlags: ["ability_used:mother.4.harvest"],
        effects: [
          { type: "clear_status", kind: "curse" },
          {
            type: "grant_clue",
            clue: { id: "harvest", title: "Жатва", body: "Чужое состояние снято и легло уликой.", source: "Мать" },
          },
        ],
      },
    },
  ],
};

const moonRich: Record<number, AbilityDef[]> = {
  9: [
    {
      id: "moon.9.dusk",
      nameRu: "Полутьма",
      descriptionRu: "Ночью и в полутьме видит лучше.",
      kind: "passive",
      mechanics: {
        cost: "action",
        setsFlags: ["moon_dusk"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Полутьма",
            body: "Там, где другим серо, для вас проступают края. День эту остроту забирает.",
          },
          { type: "set_flag", flag: "moon_dusk" },
        ],
      },
    },
  ],
  8: [
    {
      id: "moon.8.aura",
      nameRu: "Ауры",
      descriptionRu: "В полутьме видит ауры. Открывает лунные искры.",
      kind: "passive",
      mechanics: {
        cost: "action",
        setsFlags: ["moon_aura"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Аура", body: "В полутьме люди и вещи носят цвет. Днём это зрение бледнеет." },
          { type: "set_flag", flag: "moon_aura" },
        ],
      },
    },
  ],
  7: [
    {
      id: "moon.7.call",
      nameRu: "Звать спутник",
      descriptionRu: "Зовёт. Текст и флаг.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:moon.7.call", "moon_call"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Спутник", body: "Луна ответила. Спутник рядом, если автор его повесил." },
          { type: "set_flag", flag: "moon_call" },
        ],
      },
    },
  ],
  6: [
    {
      id: "moon.6.doze",
      nameRu: "Дрёма",
      descriptionRu: "Навязывает сонливость.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:moon.6.doze"],
        effects: [
          {
            type: "apply_status",
            status: { id: "doze", title: "Дрёма", body: "Веки тяжелеют. На ход труднее осмотреть.", kind: "curse", blocks: ["inspect"], rounds: 1 },
          },
        ],
      },
    },
  ],
  5: [
    {
      id: "moon.5.gate",
      nameRu: "Портал сна",
      descriptionRu: "Один раз. Улика из чужого сна, тело здесь.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        oncePerGame: true,
        setsFlags: ["ability_used:moon.5.gate"],
        effects: [
          { type: "steal_memory" },
          { type: "reveal_text", scope: "self", title: "Сон", body: "Портал открылся в чужой сон. Тело осталось здесь." },
        ],
      },
    },
  ],
  4: [
    {
      id: "moon.4.cycle",
      nameRu: "Цикл",
      descriptionRu: "Ночью сильнее, днём бледнее.",
      kind: "passive",
      mechanics: {
        cost: "action",
        setsFlags: ["moon_cycle"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Цикл", body: "Ночь кормит. День забирает. Часы игры этого не меряют — меряет сцена." },
          { type: "set_flag", flag: "moon_cycle" },
        ],
      },
    },
  ],
};

const abyssRich: Record<number, AbilityDef[]> = {
  9: [
    {
      id: "abyss.9.tempt",
      nameRu: "Шёпот искушения",
      descriptionRu: "Слышит, чем можно купить эту минуту.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:abyss.9.tempt", "temptation"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Шёпот искушения",
            body: "Бездна подсказала цену. Не крик — шёпот того, чего здесь хотят.",
          },
          { type: "set_flag", flag: "temptation" },
          { type: "set_flag", flag: "ability_used:abyss.9.tempt" },
        ],
      },
    },
  ],
  8: [
    {
      id: "abyss.8.wish",
      nameRu: "Шепнуть желание",
      descriptionRu: "Вешает искушение на цель.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:abyss.8.wish"],
        effects: [
          {
            type: "apply_status",
            status: { id: "tempted", title: "Искушение", body: "Желание названо. Отказаться можно. Забыть труднее.", kind: "curse", rounds: 2 },
          },
        ],
      },
    },
  ],
  7: [
    {
      id: "abyss.7.want",
      nameRu: "Несказанное",
      descriptionRu: "Слышит, чего человек хочет и не говорит.",
      kind: "reaction",
      on: "talk",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:abyss.7.want"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Желание", body: "За словами — то, чего не сказали. Бездна это слышит." },
        ],
      },
    },
  ],
  6: [
    {
      id: "abyss.6.taint",
      nameRu: "Порча места",
      descriptionRu: "Портит комнату. Фон сменится, если повешен.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:abyss.6.taint", "taint"],
        effects: [
          { type: "shift_background" },
          { type: "set_flag", flag: "taint" },
        ],
      },
    },
  ],
  5: [
    {
      id: "abyss.5.loan",
      nameRu: "Демон на час",
      descriptionRu: "Один раз. Одолженная сила.",
      kind: "active",
      mechanics: {
        cost: "action",
        oncePerGame: true,
        setsFlags: ["ability_used:abyss.5.loan", "loaned"],
        effects: [
          {
            type: "apply_status",
            status: { id: "loaned", title: "Одолженная сила", body: "Бездна дала на час. Счёт придёт.", kind: "blessing", rounds: 2 },
          },
          { type: "set_flag", flag: "loaned" },
        ],
      },
    },
  ],
  4: [
    {
      id: "abyss.4.rift",
      nameRu: "Разлом",
      descriptionRu: "Один раз. Открывает присутствие бездны в этой комнате.",
      kind: "active",
      mechanics: {
        cost: "action",
        oncePerGame: true,
        setsFlags: ["ability_used:abyss.4.rift", "abyss_rift"],
        effects: [
          { type: "reveal_text", scope: "same_location", title: "Разлом", body: "Пол под ногами помнит бездну. Присутствие, если повешено, проснётся." },
          { type: "set_flag", flag: "abyss_rift" },
        ],
      },
    },
  ],
};

const chainedRich: Record<number, AbilityDef[]> = {
  9: [
    {
      id: "chained.9.bonds",
      nameRu: "Чуять оковы",
      descriptionRu: "Чует цепи, печати и запертое.",
      kind: "passive",
      mechanics: {
        cost: "action",
        setsFlags: ["chained_bonds"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Оковы",
            body: "Запертое само тянет взгляд. Печать, замок, обещание — одно и то же железо.",
          },
          { type: "set_flag", flag: "chained_bonds" },
        ],
      },
    },
  ],
  8: [
    {
      id: "chained.8.pull",
      nameRu: "Потянуть цепь",
      descriptionRu: "Запертое отвечает.",
      kind: "active",
      target: "spark",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:chained.8.pull"],
        effects: [
          { type: "open_doors" },
        ],
      },
    },
  ],
  7: [
    {
      id: "chained.7.seal",
      nameRu: "Чуять печати",
      descriptionRu: "Открывает искры оков.",
      kind: "passive",
      mechanics: {
        cost: "action",
        setsFlags: ["seal_sense"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Печати", body: "Печати в комнате сами светятся для вас." },
          { type: "set_flag", flag: "seal_sense" },
        ],
      },
    },
  ],
  6: [
    {
      id: "chained.6.bind",
      nameRu: "Наложить оковы",
      descriptionRu: "Сковывает цель на ход.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:chained.6.bind"],
        effects: [
          {
            type: "apply_status",
            status: { id: "bound", title: "Скован", body: "Цепь легла. На ход нельзя идти.", kind: "restraint", blocks: ["move"], rounds: 1 },
          },
        ],
      },
    },
  ],
  5: [
    {
      id: "chained.5.break",
      nameRu: "Сломать свою печать",
      descriptionRu: "Один раз. Снимает своё состояние ценой надлома.",
      kind: "active",
      mechanics: {
        cost: "action",
        oncePerGame: true,
        setsFlags: ["ability_used:chained.5.break", "cracked"],
        effects: [
          { type: "clear_status", kind: "restraint" },
          {
            type: "apply_status",
            status: { id: "cracked", title: "Надлом", body: "Печать сломана. Цена осталась на вас.", kind: "mark" },
          },
          { type: "set_flag", flag: "cracked" },
        ],
      },
    },
  ],
  4: [
    {
      id: "chained.4.puppet",
      nameRu: "Марионетка цепей",
      descriptionRu: "Один раз. Непись получает принудительную реплику, если автор повесил.",
      kind: "active",
      mechanics: {
        cost: "action",
        oncePerGame: true,
        setsFlags: ["ability_used:chained.4.puppet", "chain_puppet"],
        effects: [
          { type: "reveal_text", scope: "same_location", title: "Марионетка", body: "Цепь дёрнула чужой рот. Реплика, если повешена на флаг, прозвучит." },
          { type: "set_flag", flag: "chain_puppet" },
        ],
      },
    },
  ],
};

const emperorRich: Record<number, AbilityDef[]> = {
  9: [
    {
      id: "black_emperor.9.deal",
      nameRu: "Сделка",
      descriptionRu: "Короткий разговор звучит как договор.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:black_emperor.9.deal", "deal"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Сделка",
            body: "Слова легли как пункт договора. Отказаться можно. Забыть — уже труднее.",
          },
          { type: "set_flag", flag: "deal" },
          { type: "set_flag", flag: "ability_used:black_emperor.9.deal" },
        ],
      },
    },
  ],
  8: [
    {
      id: "black_emperor.8.loophole",
      nameRu: "Лазейка",
      descriptionRu: "Как обойти запрет, если автор повесил.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:black_emperor.8.loophole", "loophole"],
        effects: [
          { type: "open_doors" },
          { type: "set_flag", flag: "loophole" },
        ],
      },
    },
  ],
  7: [
    {
      id: "black_emperor.7.bought",
      nameRu: "Уже куплено",
      descriptionRu: "Слышит, где слова уже куплены.",
      kind: "reaction",
      on: "talk",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:black_emperor.7.bought"],
        effects: [
          { type: "reveal_text", scope: "self", title: "Куплено", body: "Эти слова уже кому-то проданы. Цена была раньше разговора." },
        ],
      },
    },
  ],
  6: [
    {
      id: "black_emperor.6.bribe",
      nameRu: "Взятка смыслом",
      descriptionRu: "Кладёт должок.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:black_emperor.6.bribe", "owed"],
        effects: [
          { type: "set_flag", flag: "owed" },
          { type: "reveal_text", scope: "self", title: "Должок", body: "Смысл передан. Долг лёг тише монеты." },
        ],
      },
    },
  ],
  5: [
    {
      id: "black_emperor.5.order",
      nameRu: "Порядок из хаоса",
      descriptionRu: "Собирает флаги комнаты в одну улику.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:black_emperor.5.order"],
        effects: [
          {
            type: "grant_clue",
            clue: { id: "order", title: "Порядок", body: "Хаос комнаты собран в один счёт.", source: "Чёрный император" },
          },
        ],
      },
    },
  ],
  4: [
    {
      id: "black_emperor.4.edict",
      nameRu: "Указ",
      descriptionRu: "Один раз. Всем в комнате — под указом.",
      kind: "active",
      mechanics: {
        cost: "action",
        oncePerGame: true,
        setsFlags: ["ability_used:black_emperor.4.edict", "edict"],
        effects: [
          {
            type: "room_status",
            status: { id: "edict", title: "Под указом", body: "Слово комнаты держит. На ход нельзя уйти.", kind: "restraint", blocks: ["move"], rounds: 1 },
          },
          { type: "set_flag", flag: "edict" },
        ],
      },
    },
  ],
};

const justiciarRich: Record<number, AbilityDef[]> = {
  9: [
    {
      id: "justiciar.9.mismatch",
      nameRu: "Слова и дело",
      descriptionRu: "Слышит, когда слова расходятся с делом.",
      kind: "reaction",
      on: "talk",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:justiciar.9.mismatch"],
        effects: [
          {
            type: "reveal_text",
            scope: "self",
            title: "Слова и дело",
            body: "В только что сказанном шов. Не вся ложь — расхождение между словом и тем, что человек делает.",
          },
          { type: "set_flag", flag: "ability_used:justiciar.9.mismatch" },
        ],
      },
    },
  ],
  8: [
    {
      id: "justiciar.8.verdict",
      nameRu: "Вердикт",
      descriptionRu: "Вердикт по увиденному. Улика.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:justiciar.8.verdict"],
        effects: [
          {
            type: "grant_clue",
            clue: { id: "verdict", title: "Вердикт", body: "Увиденное сведено в приговор. Не окончательный.", source: "Вершитель" },
          },
        ],
      },
    },
  ],
  7: [
    {
      id: "justiciar.7.guilt",
      nameRu: "Чуять вину",
      descriptionRu: "Открывает искры вины.",
      kind: "passive",
      mechanics: {
        cost: "action",
        setsFlags: ["guilt_sense"],
        effects: [
          { type: "reveal_hidden" },
          { type: "set_flag", flag: "guilt_sense" },
        ],
      },
    },
  ],
  6: [
    {
      id: "justiciar.6.question",
      nameRu: "Допрос",
      descriptionRu: "Подсвечивает правду и ложь у неписей здесь. Обязательная реплика — если автор повесил её на флаг.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:justiciar.6.question", "questioned"],
        effects: [
          { type: "bind_oath" },
          { type: "set_flag", flag: "questioned" },
        ],
      },
    },
  ],
  5: [
    {
      id: "justiciar.5.law",
      nameRu: "Печать закона",
      descriptionRu: "Кладёт закон на локацию.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:justiciar.5.law", "law"],
        effects: [
          { type: "reveal_text", scope: "same_location", title: "Закон", body: "На это место легла печать. Правило здесь громче желания." },
          { type: "set_flag", flag: "law" },
        ],
      },
    },
  ],
  4: [
    {
      id: "justiciar.4.sentence",
      nameRu: "Приговор",
      descriptionRu: "Один раз. Закрывает выходы этой комнаты на ход.",
      kind: "active",
      mechanics: {
        cost: "action",
        oncePerGame: true,
        setsFlags: ["ability_used:justiciar.4.sentence", "sentence"],
        effects: [
          { type: "seal_exits", rounds: 1 },
          { type: "set_flag", flag: "sentence" },
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
      kind: "passive",
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
  8: [
    {
      id: "darkness.8.shade",
      nameRu: "Сгустить тень",
      descriptionRu: "Прячет искру или кладёт «скрыт».",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:darkness.8.shade", "shade"],
        effects: [
          {
            type: "apply_status",
            status: { id: "hidden", title: "Скрыт", body: "Тень легла плотнее. На ход вас труднее заметить.", kind: "mark", rounds: 1 },
          },
          { type: "set_flag", flag: "shade" },
        ],
      },
    },
  ],
  7: [
    {
      id: "darkness.7.fear",
      nameRu: "Кошмар",
      descriptionRu: "Вешает страх. В полной тьме сильнее.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:darkness.7.fear"],
        effects: [
          {
            type: "apply_status",
            status: { id: "fear", title: "Страх", body: "Кошмар сел на плечи. В темноте он громче.", kind: "curse", blocks: ["inspect"], rounds: 1 },
          },
        ],
      },
    },
  ],
  6: [
    {
      id: "darkness.6.spirit",
      nameRu: "Чуять дух",
      descriptionRu: "Открывает духовные искры.",
      kind: "active",
      mechanics: {
        cost: "action",
        cooldownRounds: 1,
        setsFlags: ["ability_used:darkness.6.spirit", "spirit_sense"],
        effects: [
          { type: "reveal_hidden", rounds: 1 },
          { type: "set_flag", flag: "spirit_sense" },
        ],
      },
    },
  ],
  5: [
    {
      id: "darkness.5.ward",
      nameRu: "Под охраной",
      descriptionRu: "Кладёт охрану себе или союзнику.",
      kind: "active",
      target: "person",
      mechanics: {
        cost: "action",
        cooldownRounds: 2,
        setsFlags: ["ability_used:darkness.5.ward"],
        effects: [
          {
            type: "apply_status",
            status: { id: "warded", title: "Под охраной", body: "Ночь держит удар. На ход спокойнее.", kind: "blessing", rounds: 1 },
          },
        ],
      },
    },
  ],
  4: [
    {
      id: "darkness.4.watch",
      nameRu: "Ночной дозор",
      descriptionRu: "Ночью почти всё видно. Открывает ночные искры.",
      kind: "passive",
      mechanics: {
        cost: "action",
        setsFlags: ["night_watch"],
        effects: [
          { type: "reveal_hidden" },
          { type: "set_flag", flag: "night_watch" },
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
    neighbors: ["error", "door"],
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
    neighbors: ["fool", "door"],
    sequences: seqs("error", [
      [9, "Marauder", "Мародёр"],
      [8, "Swindler", "Мошенник"],
      [7, "Cryptologist", "Криптолог"],
      [6, "Prometheus", "Прометей"],
      [5, "Dream Stealer", "Похититель снов"],
      [4, "Parasite", "Паразит"],
    ], errorRich),
  },
  {
    id: "door",
    nameRu: "Дверь",
    nameEn: "Door",
    group: "Lord of Mysteries",
    neighbors: ["fool", "error"],
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
    neighbors: ["sun", "tyrant", "white_tower", "hanged_man"],
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
    neighbors: ["visionary", "tyrant", "white_tower", "hanged_man"],
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
    neighbors: ["visionary", "sun", "white_tower", "hanged_man"],
    sequences: seqs("tyrant", [
      [9, "Sailor", "Моряк"],
      [8, "Folk of Rage", "Народ ярости"],
      [7, "Seafarer", "Мореход"],
      [6, "Wind-blessed", "Благословлённый ветром"],
      [5, "Ocean Songster", "Певец океана"],
      [4, "Cataclysmic Interrer", "Катастрофический погребатель"],
    ], tyrantRich),
  },
  {
    id: "white_tower",
    nameRu: "Белая башня",
    nameEn: "White Tower",
    group: "God Almighty",
    neighbors: ["visionary", "sun", "tyrant", "hanged_man"],
    sequences: seqs("white_tower", [
      [9, "Reader", "Читатель"],
      [8, "Student of Ratiocination", "Ученик рассуждения"],
      [7, "Detective", "Детектив"],
      [6, "Polymath", "Эрудит"],
      [5, "Mysticism Magister", "Магистр мистики"],
      [4, "Prophet", "Пророк"],
    ], whiteTowerRich),
  },
  {
    id: "hanged_man",
    nameRu: "Повешенный",
    nameEn: "Hanged Man",
    group: "God Almighty",
    neighbors: ["visionary", "sun", "tyrant", "white_tower"],
    sequences: seqs("hanged_man", [
      [9, "Secrets Suppliant", "Молящий о тайнах"],
      [8, "Listener", "Слушатель"],
      [7, "Shadow Ascetic", "Теневой аскет"],
      [6, "Rose Bishop", "Розовый епископ"],
      [5, "Shepherd", "Пастырь"],
      [4, "Black Knight", "Чёрный рыцарь"],
    ], hangedRich),
  },
  {
    id: "darkness",
    nameRu: "Тьма",
    nameEn: "Darkness",
    group: "Eternal Darkness",
    neighbors: ["death", "twilight_giant"],
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
    neighbors: ["darkness", "twilight_giant"],
    sequences: seqs("death", [
      [9, "Corpse Collector", "Собиратель трупов"],
      [8, "Gravedigger", "Могильщик"],
      [7, "Spirit Medium", "Медиум"],
      [6, "Spirit Guide", "Проводник духов"],
      [5, "Gatekeeper", "Привратник"],
      [4, "Undying", "Бессмертный"],
    ], deathRich),
  },
  {
    id: "twilight_giant",
    nameRu: "Гигант сумерек",
    nameEn: "Twilight Giant",
    group: "Eternal Darkness",
    neighbors: ["darkness", "death"],
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
    neighbors: ["red_priest"],
    sequences: seqs("demoness", [
      [9, "Assassin", "Ассасин"],
      [8, "Instigator", "Подстрекатель"],
      [7, "Witch", "Ведьма"],
      [6, "Pleasure", "Удовольствие"],
      [5, "Affliction", "Страдание"],
      [4, "Despair", "Отчаяние"],
    ], demonessRich),
  },
  {
    id: "red_priest",
    nameRu: "Красный жрец",
    nameEn: "Red Priest",
    group: "Calamity of Destruction",
    neighbors: ["demoness"],
    sequences: seqs("red_priest", [
      [9, "Hunter", "Охотник"],
      [8, "Provoker", "Провокатор"],
      [7, "Pyromaniac", "Пироман"],
      [6, "Conspirer", "Заговорщик"],
      [5, "Reaper", "Жнец"],
      [4, "Iron-blooded Knight", "Железнокровый рыцарь"],
    ], redPriestRich),
  },
  {
    id: "hermit",
    nameRu: "Отшельник",
    nameEn: "Hermit",
    group: "Demon of Knowledge",
    neighbors: ["paragon"],
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
    neighbors: ["hermit"],
    sequences: seqs("paragon", [
      [9, "Savant", "Знаток"],
      [8, "Archaeologist", "Археолог"],
      [7, "Appraiser", "Оценщик"],
      [6, "Artisan", "Ремесленник"],
      [5, "Astronomer", "Астроном"],
      [4, "Alchemist", "Алхимик"],
    ], paragonRich),
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
    ], wheelRich),
  },
  {
    id: "mother",
    nameRu: "Мать",
    nameEn: "Mother",
    group: "Goddess of Origin",
    neighbors: ["moon"],
    sequences: seqs("mother", [
      [9, "Planter", "Садовод"],
      [8, "Doctor", "Врач"],
      [7, "Harvest Priest", "Жрец урожая"],
      [6, "Biologist", "Биолог"],
      [5, "Druid", "Друид"],
      [4, "Ancient Alchemist", "Древний алхимик"],
    ], motherRich),
  },
  {
    id: "moon",
    nameRu: "Луна",
    nameEn: "Moon",
    group: "Goddess of Origin",
    neighbors: ["mother"],
    sequences: seqs("moon", [
      [9, "Apothecary", "Аптекарь"],
      [8, "Beast Tamer", "Укротитель зверей"],
      [7, "Vampire", "Вампир"],
      [6, "Potions Professor", "Профессор зелий"],
      [5, "Scarlet Scholar", "Алый учёный"],
      [4, "Shaman King", "Король шаманов"],
    ], moonRich),
  },
  {
    id: "abyss",
    nameRu: "Бездна",
    nameEn: "Abyss",
    group: "Fallen Creator",
    neighbors: ["chained"],
    sequences: seqs("abyss", [
      [9, "Criminal", "Преступник"],
      [8, "Unwinged Angel", "Бескрылый ангел"],
      [7, "Serial Killer", "Серийный убийца"],
      [6, "Devil", "Дьявол"],
      [5, "Desire Apostle", "Апостол желания"],
      [4, "Demon", "Демон"],
    ], abyssRich),
  },
  {
    id: "chained",
    nameRu: "Скованный",
    nameEn: "Chained",
    group: "Fallen Creator",
    neighbors: ["abyss"],
    sequences: seqs("chained", [
      [9, "Prisoner", "Узник"],
      [8, "Lunatic", "Безумец"],
      [7, "Werewolf", "Оборотень"],
      [6, "Zombie", "Зомби"],
      [5, "Wraith", "Призрак"],
      [4, "Puppet", "Марионетка"],
    ], chainedRich),
  },
  {
    id: "black_emperor",
    nameRu: "Чёрный император",
    nameEn: "Black Emperor",
    group: "Nation of Disorder",
    neighbors: ["justiciar"],
    sequences: seqs("black_emperor", [
      [9, "Lawyer", "Адвокат"],
      [8, "Barbarian", "Варвар"],
      [7, "Briber", "Взяткодатель"],
      [6, "Baron of Corruption", "Барон порчи"],
      [5, "Mentor of Disorder", "Наставник беспорядка"],
      [4, "Earl of the Fallen", "Граф падших"],
    ], emperorRich),
  },
  {
    id: "justiciar",
    nameRu: "Вершитель",
    nameEn: "Justiciar",
    group: "Nation of Disorder",
    neighbors: ["black_emperor"],
    sequences: seqs("justiciar", [
      [9, "Arbiter", "Арбитр"],
      [8, "Sheriff", "Шериф"],
      [7, "Interrogator", "Дознаватель"],
      [6, "Judge", "Судья"],
      [5, "Discipline Paladin", "Паладин дисциплины"],
      [4, "Imperative Mage", "Маг повелений"],
    ], justiciarRich),
  },
  {
    id: "artifacts",
    nameRu: "Артефакты",
    nameEn: "Artifacts",
    group: "Items",
    sequences: [
      {
        rank: 9,
        nameEn: "Token",
        nameRu: "Вещь",
        profileRu: "Предмет, который несёт чужую силу, пока лежит в кармане.",
        abilities: [
          {
            id: "artifact.trace",
            nameRu: "Чужой след",
            descriptionRu: "Вещь помнит, кто её держал.",
            kind: "active",
            mechanics: {
              cost: "action",
              cooldownRounds: 1,
              setsFlags: ["ability_used:artifact.trace"],
              effects: [
                {
                  type: "reveal_text",
                  scope: "self",
                  title: "Чужой след",
                  body: "На ткани остался холод чужой руки. Хозяин ушёл не к поезду.",
                },
                { type: "set_flag", flag: "ability_used:artifact.trace" },
              ],
            },
          },
        ],
      },
    ],
  },
];
