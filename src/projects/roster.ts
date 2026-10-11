export type Character = {
  id: string;
  name: string;
  pathway: string;
  blurb: string;
};

export const ROSTER: Character[] = [
  {
    id: "investigator",
    name: "Следователь",
    pathway: "Разум",
    blurb: "Видит связи, которые другие пропускают.",
  },
  {
    id: "medium",
    name: "Медиум",
    pathway: "Чутьё",
    blurb: "Слышит то, чего нет в реестре.",
  },
  {
    id: "doctor",
    name: "Врач",
    pathway: "Тело",
    blurb: "Читает следы на коже и в дыхании.",
  },
  {
    id: "thief",
    name: "Взломщик",
    pathway: "Тень",
    blurb: "Открывает то, что закрыто для гостей.",
  },
];

export const ROSTER_BY_ID = Object.fromEntries(ROSTER.map((c) => [c.id, c]));
export const MAX_PARTY = 4;
