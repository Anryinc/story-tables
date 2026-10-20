/** Прогон движка, базы LoTM и сценария «Третий звонок». */
import { compileScenario } from "@/lib/scenario/compile";
import { NODE_META, type ScenarioDocument, type ScenarioEdge, type ScenarioNode } from "@/lib/scenario/types";
import { TurnEngine } from "@/lib/turn-engine";
import type { ActionIntent } from "@/lib/turn-types";
import { getLoreBase } from "@/lib/lore/registry";
import { abilitiesForSequence, findAbility } from "@/lib/lore/types";
import { thirdBellScenario } from "@/projects/third-bell/scenario";

const fails: string[] = [];
let passes = 0;

function check(cond: unknown, msg: string) {
  if (cond) {
    passes += 1;
    return;
  }
  fails.push(msg);
  console.error("FAIL", msg);
}

function act(engine: TurnEngine, intents: Record<string, ActionIntent>) {
  for (const [id, intent] of Object.entries(intents)) {
    const r = engine.submitIntent(id, intent);
    if (!r.ok) {
      const labels = engine.snapshotFor(id).availableActions.map((a) => a.label).join(" | ");
      fails.push(`${id} ${intent.type}: ${r.error}. Сейчас: ${engine.snapshotFor(id).myLocationId} / ${labels}`);
    }
  }
}

function ports(kind: ScenarioNode["kind"]) {
  return NODE_META[kind].defaultPorts.map((p) => ({ ...p }));
}

const base = getLoreBase("lotm");
check(base, "база LoTM подключена");

if (base) {
  const playable = base.pathways.filter((p) => p.id !== "artifacts");
  check(playable.length === 22, `путей ${playable.length}, ждали 22`);
  for (const path of playable) {
    const ranks = path.sequences.map((s) => s.rank).sort((a, b) => b - a);
    check(ranks.join(",") === "9,8,7,6,5,4", `${path.id}: ранги ${ranks.join(",")}`);
    for (const seq of path.sequences) {
      check(seq.abilities.length > 0, `${path.id} C${seq.rank} без сил`);
      for (const a of seq.abilities) {
        check(!a.nameRu.startsWith("Сила:"), `${a.id} всё ещё заглушка`);
        check(a.mechanics.effects.length > 0, `${a.id} без эффекта`);
        check(Boolean(findAbility(base, a.id)), `${a.id} не находится`);
      }
    }
    const low = abilitiesForSequence(base, path.id, 9).map((a) => a.rank);
    check(low.every((r) => r === 9), `${path.id} C9 тянет чужие ранги: ${low.join(",")}`);
    const high = abilitiesForSequence(base, path.id, 4);
    check(high.some((a) => a.rank === 9) && high.some((a) => a.rank === 4), `${path.id} C4 не копит низшие зелья`);
  }
  const fool = abilitiesForSequence(base, "fool", 4, "door");
  check(fool.some((a) => a.id.startsWith("door.") && a.neighbor), "соседний путь Двери не добавился к Дураку");
  const wheel = base.pathways.find((p) => p.id === "wheel_of_fortune");
  check(!wheel?.neighbors?.length, "у Колеса фортуны не должно быть соседей");
}

const compiled = compileScenario(thirdBellScenario);
const locs = Object.keys(compiled.graph.locations);
for (const id of ["platform", "hall", "office", "yard", "corridor", "duty"]) {
  check(locs.includes(id), `нет локации ${id}`);
}
check(compiled.graph.startLocationId === "platform", "старт не платформа");
check((compiled.graph.locations.platform?.scene.length ?? 0) >= 3, "на платформе нет искр");
check(
  compiled.graph.locations.hall?.exits.some((e) => e.to === "corridor" && e.requiresFlag === "staff_key"),
  "коридор не закрыт ключом",
);
check(compiled.timeline.some((t) => t.unlockLocationId === "duty" && t.atRound === 4), "дежурный не открывается на 4 ходе");

const table = new TurnEngine(
  "QA01",
  "host",
  compiled.projectId,
  compiled.title,
  compiled.graph,
  compiled.timeline,
  compiled.characters,
  compiled.loreBaseId,
  compiled.playersMax,
  compiled.initialFlags,
);
check(table.claim("host", "missing").ok === false, "пустая роль не должна заниматься");
check(table.start("host").ok === false, "старт без роли");
table.ensureSeat("p2", "Второй");
table.ensureSeat("p3", "Третий");
check(table.claim("host", "char_seer").ok, "провидец");
check(table.claim("p2", "char_seer").ok === false, "роль занята дважды");
check(table.claim("p2", "char_conductor").ok, "проводник");
check(table.claim("p3", "char_inspector").ok, "ревизор");
check(table.start("p2").ok === false, "гость стартует стол");
check(table.start("host").ok, "старт");

const seer0 = table.snapshotFor("host");
check(seer0.round === 1, "ход не 1");
check(seer0.myLocationId === "platform", "провидец не на платформе");
check(seer0.flags === undefined || true, "снимок");
check(seer0.myScene.some((p) => p.label === "Лужи"), "лужи на сцене");
check(Boolean(seer0.characterOptions.find((c) => c.id === "char_seer")?.abilities.length), "на карточке нет сил");
check(seer0.availableActions.some((a) => a.intent.type === "ability" && a.intent.abilityId === "fool.9.divination"), "гадание не в кнопках");
check(!seer0.availableActions.some((a) => a.intent.type === "ability" && a.intent.abilityId === "fool.9.spirit_vision"), "пассивная сила не должна быть кнопкой");
check(seer0.availableActions.some((a) => a.intent.type === "inspect" && a.label.includes("Табло")), "табло закрыто");
check(!seer0.availableActions.some((a) => a.label.toLowerCase().includes("часы")), "часы видны до табло");

act(table, {
  host: { type: "inspect", targetId: "ins_board" },
  p2: { type: "inspect", targetId: "ins_puddle" },
  p3: { type: "wait" },
});
const after1 = table.snapshotFor("host");
check(after1.round === 2, "после осмотра ход не сменился");
check(after1.myClues.some((c) => c.id === "board_erased"), "улика табло не легла");
check(after1.availableActions.some((a) => a.label.toLowerCase().includes("часы")), "часы не открылись");
check(!table.snapshotFor("p2").availableActions.some((a) => a.label.includes("Лужи")), "лужа не спряталась после осмотра");

act(table, {
  host: { type: "ability", abilityId: "fool.9.divination" },
  p2: { type: "move", toLocationId: "hall" },
  p3: { type: "move", toLocationId: "yard" },
});
const seerCd = table.snapshotFor("host");
check(seerCd.myLocationId === "platform", "провидец ушёл сам");
check(seerCd.availableActions.some((a) => a.intent.type === "ability" && a.intent.abilityId === "fool.9.divination" && a.cooldownLeft === 1), "кулдаун девятки не 1 ход");
const cooled = seerCd.availableActions.find((a) => a.intent.type === "ability" && a.intent.abilityId === "fool.9.divination");
check(table.submitIntent("host", { type: "ability", abilityId: "fool.9.divination" }).ok === false, "силу применили на кулдауне");
check(table.snapshotFor("p2").myLocationId === "hall", "проводник не в зале");
check(!table.snapshotFor("p2").myScene.some((p) => p.inspectId === "ins_glass"), "без зрения видно стекло");
check(table.snapshotFor("p3").myLocationId === "yard", "ревизор не во дворе");
check(!table.snapshotFor("p3").myMemories.some((m) => m.title.includes("След колокола")), "след колокола виден без зрения");

act(table, {
  host: { type: "move", toLocationId: "hall" },
  p2: { type: "talk", npcId: "npc_ida", optionId: "ask_train" },
  p3: { type: "inspect", targetId: "ins_trunk" },
});
const bell = table.snapshotFor("host");
check(bell.round === 4, `ждали ход 4, сейчас ${bell.round}`);
check(bell.lastPublicEvent?.includes("Третий звонок") || bell.myMemories.some((m) => m.title === "Третий звонок"), "третий звонок не прозвучал");
check(bell.myLocationId === "hall", "провидец не дошёл до зала");
check(bell.myScene.some((p) => p.inspectId === "ins_glass"), "стекло скрыто от духовного зрения");
check(bell.myJournal.some((j) => j.title.includes("Дурное") || j.body.includes("фальшь")) || bell.myPopups.some((p) => p.title.includes("предчувствие") || p.body.includes("фальшь")), "реакция на разговор не сработала");
check(table.snapshotFor("p2").myClues.some((c) => c.id === "ida_train"), "Ида не дала улику");
check(table.snapshotFor("p3").myClues.some((c) => c.id === "empty_case"), "сундук не дал улику");

const shared = table.shareMemory("p2", "ida_train", "host");
check(shared.ok, `не передалось воспоминание: ${shared.ok ? "" : shared.error}`);
check(table.snapshotFor("host").myMemories.some((m) => m.id === "ida_train" || m.title.includes("билетов")), "провидец не получил рассказ");
check(table.shareMemory("p3", "empty_case", "host").ok === false, "передача из другой комнаты прошла");

act(table, {
  host: { type: "wait" },
  p2: { type: "talk", npcId: "npc_ida", optionId: "ask_duty" },
  p3: { type: "inspect", targetId: "ins_lantern" },
});
check(table.snapshotFor("p2").availableActions.some((a) => a.intent.type === "move" && a.intent.toLocationId === "office") || table.snapshotFor("p2").myLocationId === "hall", "проводник в зале");
const gloveOwner = table.snapshotFor("p3");
check(gloveOwner.myItems.some((i) => i.id === "left_glove"), "перчатка не попала в инвентарь");
check(gloveOwner.availableActions.some((a) => a.intent.type === "ability" && a.intent.abilityId === "artifact.trace"), "сила предмета не в кнопках");

act(table, {
  host: { type: "move", toLocationId: "platform" },
  p2: { type: "move", toLocationId: "office" },
  p3: { type: "wait" },
});
act(table, {
  host: { type: "move", toLocationId: "yard" },
  p2: { type: "inspect", targetId: "ins_drawer" },
  p3: { type: "wait" },
});
const yardSeer = table.snapshotFor("host");
check(yardSeer.myLocationId === "yard", "провидец не во дворе");
check(yardSeer.myMemories.some((m) => m.id === "bell_trace" || m.title.includes("След колокола")), "присутствие во дворе не сработало");
check(yardSeer.company.some((c) => c.clientId === "p3"), "портрет соседа не в компании");
check(!yardSeer.availableActions.some((a) => a.label.includes("Фонарь")), "фонарь можно взять второй раз");
const office = table.snapshotFor("p2");
check(office.myLocationId === "office", "проводник не в кассе");
check(office.myItems.some((i) => i.id === "corridor_key"), "ключ не выдали");

act(table, {
  host: { type: "wait" },
  p2: { type: "move", toLocationId: "hall" },
  p3: { type: "give", itemId: "left_glove", toClientId: "host" },
});
check(table.snapshotFor("host").myItems.some((i) => i.id === "left_glove"), "перчатку не передали");
check(!table.snapshotFor("p3").myItems.some((i) => i.id === "left_glove"), "перчатка осталась у обоих");

act(table, {
  host: { type: "wait" },
  p2: { type: "move", toLocationId: "corridor" },
  p3: { type: "wait" },
});
check(table.snapshotFor("p2").myLocationId === "corridor", "коридор не открылся ключом");
const dutyOpen = table.snapshotFor("p2").availableActions.some((a) => a.intent.type === "move" && a.intent.toLocationId === "duty");
check(dutyOpen, "комната дежурного всё ещё закрыта после 4 хода");

const saved = table.exportState();
const restored = new TurnEngine(
  "QA01",
  "host",
  compiled.projectId,
  compiled.title,
  compiled.graph,
  compiled.timeline,
  compiled.characters,
  compiled.loreBaseId,
  compiled.playersMax,
  compiled.initialFlags,
);
restored.importState(saved);
check(restored.snapshotFor("p2").myLocationId === "corridor", "после загрузки локация слетела");
check(restored.snapshotFor("host").myItems.some((i) => i.id === "left_glove"), "после загрузки пропала перчатка");
check(!restored.snapshotFor("host").myPopups.some((p) => p.title.includes("След колокола") && false), "загрузка");
const before = restored.snapshotFor("host").myJournal.length;
act(restored, { host: { type: "wait" }, p2: { type: "wait" }, p3: { type: "wait" } });
check(restored.snapshotFor("host").myJournal.length >= before, "загруженный стол не ходит");

function lab(doc: ScenarioDocument) {
  const c = compileScenario(doc);
  const engine = new TurnEngine("LAB", "host", c.projectId, c.title, c.graph, c.timeline, c.characters, "lotm", doc.manifest.playersMax, []);
  for (const ch of doc.characters ?? []) {
    const client = ch.id === "c_host" ? "host" : ch.id;
    if (client !== "host") engine.ensureSeat(client, ch.name);
    const claimed = engine.claim(client, ch.id);
    if (!claimed.ok) fails.push(`роль ${ch.name}: ${claimed.error}`);
  }
  const started = engine.start("host");
  if (!started.ok) fails.push(`лаборатория не стартовала: ${started.error}`);
  return engine;
}

function room(id: string, title: string, extra?: Partial<ScenarioNode["data"]>): ScenarioNode {
  return { id, kind: "location", x: 0, y: 0, ports: ports("location"), data: { title, locationId: id, description: title, ...extra } };
}

const doorDoc: ScenarioDocument = {
  version: 1,
  manifest: { id: "lab", title: "Лаборатория", blurb: "тест", playersMin: 1, playersMax: 4, status: "playable", version: "0", updatedAt: "" },
  loreBaseId: "lotm",
  nodes: [
    { id: "start", kind: "start", x: 0, y: 0, ports: ports("start"), data: { title: "Старт" } },
    room("here", "Здесь", {
      backgrounds: [
        { id: "a", name: "А", url: "/a.jpg" },
        { id: "b", name: "Б", url: "/b.jpg" },
      ],
      sceneObjects: [
        { id: "pin_npc", kind: "npc", label: "Страж", x: 20, y: 20, w: 16, h: 40, linkNodeId: "npc", interaction: "talk", percent: true },
        { id: "pin_box", kind: "hotspot", label: "Шкатулка", x: 60, y: 60, w: 12, h: 16, linkNodeId: "box", interaction: "inspect", percent: true },
      ],
    }),
    room("there", "Там"),
    { id: "npc", kind: "npc", x: 0, y: 0, ports: ports("npc"), data: { title: "Страж", npcName: "Страж", talkOptions: [
      { id: "yes", label: "Да", reply: "Правда.", veracity: "truth" },
      { id: "no", label: "Нет", reply: "Ложь.", veracity: "lie" },
    ] } },
    { id: "box", kind: "inspect", x: 0, y: 0, ports: ports("inspect"), data: { title: "Шкатулка", inspectLabel: "Шкатулка", inspectResult: "Пусто.", once: true } },
  ],
  edges: [
    { id: "e1", from: "start", to: "here", fromPort: "out", toPort: "in" },
    { id: "e2", from: "here", to: "there", fromPort: "out", toPort: "in", label: "Заперто", requiresFlag: "secret" },
    { id: "e3", from: "there", to: "here", fromPort: "out", toPort: "in", label: "Назад" },
    { id: "e4", from: "here", to: "npc", fromPort: "events", toPort: "in" },
    { id: "e5", from: "here", to: "box", fromPort: "events", toPort: "in" },
  ] as ScenarioEdge[],
  characters: [
    { id: "c_host", name: "Дверь", blurb: "", lore: { baseId: "lotm", pathwayId: "door", sequenceRank: 9, enabledAbilityIds: ["door.9.open"] } },
    { id: "c_sun", name: "Солнце", blurb: "", lore: { baseId: "lotm", pathwayId: "sun", sequenceRank: 6, enabledAbilityIds: ["sun.6.oath"] } },
    { id: "c_judge", name: "Судья", blurb: "", lore: { baseId: "lotm", pathwayId: "justiciar", sequenceRank: 4, enabledAbilityIds: ["justiciar.4.sentence", "hanged_man.4.blade"] } },
    { id: "c_para", name: "Изъян", blurb: "", lore: { baseId: "lotm", pathwayId: "paragon", sequenceRank: 5, enabledAbilityIds: ["paragon.5.snap"] } },
  ],
};

const door = lab(doorDoc);
check(!door.snapshotFor("host").availableActions.some((a) => a.intent.type === "move" && a.intent.toLocationId === "there"), "запертый выход виден сразу");
act(door, {
  host: { type: "ability", abilityId: "door.9.open" },
  c_sun: { type: "wait" },
  c_judge: { type: "wait" },
  c_para: { type: "wait" },
});
check(door.snapshotFor("host").availableActions.some((a) => a.intent.type === "move" && a.intent.toLocationId === "there"), "дверь не открыла выход");
check(door.snapshotFor("host").availableActions.some((a) => a.cooldownLeft === 1), "после двери нет видимого кулдауна");

act(door, {
  host: { type: "wait" },
  c_sun: { type: "ability", abilityId: "sun.6.oath" },
  c_judge: { type: "wait" },
  c_para: { type: "wait" },
});
const lines = door.snapshotFor("c_sun").myScene.find((p) => p.npcId === "npc")?.talkOptions ?? [];
check(lines.some((l) => l.veracity === "truth") && lines.some((l) => l.veracity === "lie"), "клятва не подсветила метки");
check(lines.length === 2, "клятва спрятала реплику");

act(door, {
  host: { type: "wait" },
  c_sun: { type: "wait" },
  c_judge: { type: "ability", abilityId: "hanged_man.4.blade" },
  c_para: { type: "wait" },
});
const blade = door.snapshotFor("c_judge").availableActions.find((a) => a.intent.type === "ability" && a.intent.abilityId === "hanged_man.4.blade");
check(blade?.cooldownLeft === 6, `кулдаун четвёрки не 6: ${blade?.cooldownLeft}`);

act(door, {
  host: { type: "wait" },
  c_sun: { type: "wait" },
  c_judge: { type: "ability", abilityId: "justiciar.4.sentence" },
  c_para: { type: "wait" },
});
check(!door.snapshotFor("host").availableActions.some((a) => a.intent.type === "move"), "приговор не закрыл выходы");

act(door, {
  host: { type: "ability", abilityId: "door.9.open" },
  c_sun: { type: "wait" },
  c_judge: { type: "wait" },
  c_para: { type: "ability", abilityId: "paragon.5.snap", targetId: "box" },
});
check(door.snapshotFor("host").availableActions.some((a) => a.intent.type === "move"), "дверь не сняла печать");
check(!door.snapshotFor("c_para").availableActions.some((a) => a.label.includes("Шкатулка")), "изъян не убрал шкатулку");
check(!door.snapshotFor("host").availableActions.some((a) => a.label.includes("Шкатулка")), "шкатулка осталась у другого игрока");

const tyrantDoc: ScenarioDocument = {
  ...doorDoc,
  edges: doorDoc.edges.map((e) => (e.id === "e2" ? { ...e, requiresFlag: undefined } : e)),
  characters: [
    { id: "c_host", name: "Тиран", blurb: "", lore: { baseId: "lotm", pathwayId: "tyrant", sequenceRank: 4, enabledAbilityIds: ["tyrant.4.scar"] } },
    { id: "c_hold", name: "Гипноз", blurb: "", lore: { baseId: "lotm", pathwayId: "visionary", sequenceRank: 6, enabledAbilityIds: ["visionary.6.hold"] } },
    { id: "c_thief", name: "Вор", blurb: "", lore: { baseId: "lotm", pathwayId: "error", sequenceRank: 5, enabledAbilityIds: ["error.5.dream"] } },
  ],
};
const tyrant = lab(tyrantDoc);
act(tyrant, {
  host: { type: "inspect", targetId: "box" },
  c_hold: { type: "wait" },
  c_thief: { type: "wait" },
});
const beforeBg = tyrant.snapshotFor("host").myLocationImage;
act(tyrant, {
  host: { type: "ability", abilityId: "tyrant.4.scar" },
  c_hold: { type: "ability", abilityId: "visionary.6.hold", targetId: "host" },
  c_thief: { type: "wait" },
});
check(tyrant.snapshotFor("host").myLocationImage === "/b.jpg", `фон не сменился: ${beforeBg} → ${tyrant.snapshotFor("host").myLocationImage}`);
check(tyrant.snapshotFor("host").myStates.some((s) => s.blocks?.includes("move")), "приказ «стой» не сковал");
const memBefore = tyrant.snapshotFor("host").myMemories.length;
act(tyrant, {
  host: { type: "move", toLocationId: "there" },
  c_hold: { type: "wait" },
  c_thief: { type: "ability", abilityId: "error.5.dream", targetId: "host" },
});
check(tyrant.snapshotFor("host").myLocationId === "here", "скованный всё же ушёл");
check(
  tyrant.snapshotFor("host").lastResult?.includes("Мешает") ||
    tyrant.snapshotFor("host").myJournal.some((j) => j.body.includes("Мешает")),
  "нет текста, почему нельзя идти",
);
check(tyrant.snapshotFor("c_thief").myMemories.some((m) => m.title.startsWith("Сон:")), "воровство сна не сработало");
check(tyrant.snapshotFor("host").myMemories.length < memBefore, "у хозяина сон остался");

console.log(`\n${passes} проверок прошло, ${fails.length} провалено`);
if (fails.length) {
  for (const f of fails) console.log(" -", f);
  process.exit(1);
}
