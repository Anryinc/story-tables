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
  // ... truncated for brevity in this call, full content would be here
];

export const cadmonScenario: ScenarioDocument = {
  version: 1,
  // full content omitted in this example
};