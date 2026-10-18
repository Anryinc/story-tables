import {
  availableExits,
  availableInspect,
  availableNpcs,
  availableTalkOptions,
  locationName,
} from "./graph/runtime";
import type { Clue, GraphDocument } from "./graph/types";
import { gateOpen, pickLocationImage } from "./graph/types";
import { newId } from "./ids";
import { findAbility, getLoreBase } from "./lore/registry";
import { abilityIdsForSequence, findSequence } from "./lore/types";
import type { TimelineRule } from "./scenario/compile";
import type { ScenarioCharacter } from "./scenario/types";
import { MAX_PARTY } from "@/projects/roster";
import type {
  ActionIntent,
  ActionOption,
  ActorState,
  CharacterOption,
  InventoryItem,
  JournalEntry,
  Memory,
  PartySeatView,
  PopupNotice,
  SceneHotspot,
  Seat,
  SharePayload,
  TurnSnapshot,
} from "./turn-types";

function intentKey(i: ActionIntent): string {
  switch (i.type) {
    case "wait":
      return "wait";
    case "move":
      return `move:${i.toLocationId}`;
    case "inspect":
      return `inspect:${i.targetId}`;
    case "talk":
      return `talk:${i.npcId}:${i.optionId}`;
    case "share":
      return `share:${i.clueId}`;
    case "ability":
      return `ability:${i.abilityId}`;
  }
}

export class TurnEngine {
  readonly code: string;
  readonly hostClientId: string;
  readonly projectId: string;
  readonly projectTitle: string;
  private graph: GraphDocument;
  private timeline: TimelineRule[];
  private characters: ScenarioCharacter[];
  private loreBaseId?: string;
  private maxParty: number;
  private phase: "lobby" | "planning" = "lobby";
  private round = 0;
  private seats: Seat[] = [];
  private flags: Record<string, boolean> = {};
  private locationOf = new Map<string, string>();
  private cluesOf = new Map<string, Clue[]>();
  private journalOf = new Map<string, JournalEntry[]>();
  private inspected = new Map<string, Set<string>>();
  private talkUsed = new Map<string, Set<string>>();
  private intents = new Map<string, ActionIntent>();
  private lastResultOf = new Map<string, string>();
  private shareBoard: SharePayload[] = [];
  private popupsOf = new Map<string, PopupNotice[]>();
  private abilityCooldown = new Map<string, Map<string, number>>();
  private usedAbilities = new Map<string, Set<string>>();
  private lastPublicEvent: string | null = null;
  private listeners = new Set<() => void>();
  private firedTimelineRounds = new Set<number>();
  private initialFlags: string[];
  private memoriesOf = new Map<string, Memory[]>();
  private itemsOf = new Map<string, InventoryItem[]>();
  private statesOf = new Map<string, ActorState[]>();
  private worldClaimed = new Set<string>();

  constructor(
    code: string,
    hostClientId: string,
    projectId: string,
    projectTitle: string,
    graph: GraphDocument,
    timeline: TimelineRule[] = [],
    characters: ScenarioCharacter[] = [],
    loreBaseId?: string,
    playersMax = MAX_PARTY,
    initialFlags: string[] = [],
  ) {
    this.code = code.toUpperCase();
    this.hostClientId = hostClientId;
    this.projectId = projectId;
    this.projectTitle = projectTitle;
    this.graph = graph;
    this.timeline = timeline;
    this.characters = characters;
    this.loreBaseId = loreBaseId;
    this.maxParty = playersMax;
    this.initialFlags = initialFlags;
    this.seats.push({
      clientId: hostClientId,
      displayName: "Хост",
      characterId: null,
    });
  }

  private charById(id: string) {
    return this.characters.find((c) => c.id === id);
  }

  private characterOptions(): CharacterOption[] {
    return this.characters.map((c) => {
      const base = getLoreBase(c.lore?.baseId || this.loreBaseId);
      const seq =
        base && c.lore
          ? findSequence(base, c.lore.pathwayId, c.lore.sequenceRank)
          : null;
      const path = base?.pathways.find((p) => p.id === c.lore?.pathwayId);
      const ids = c.lore
        ? (c.lore.enabledAbilityIds ??
          (base
            ? abilityIdsForSequence(base, c.lore.pathwayId, c.lore.sequenceRank)
            : []))
        : [];
      const abilities = ids.flatMap((id) => {
        const ability = base ? findAbility(base, id) : null;
        return ability
          ? [{ name: ability.nameRu, description: ability.descriptionRu }]
          : [];
      });
      return {
        id: c.id,
        name: c.name,
        givenName: c.givenName,
        blurb: c.blurb,
        pathway:
          path && seq ? `${path.nameRu} · C${seq.rank} · ${seq.nameRu}` : undefined,
        abilities,
        portraitUrl: c.portraitUrl,
        gender: c.gender,
      };
    });
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    for (const fn of this.listeners) fn();
  }

  private players() {
    return this.seats.filter((s) => s.characterId);
  }

  ensureSeat(clientId: string, displayName = "Игрок") {
    if (this.seats.some((s) => s.clientId === clientId)) return { ok: true as const };
    if (this.seats.length >= this.maxParty + 1)
      return { ok: false as const, error: "Стол полон" };
    this.seats.push({ clientId, displayName, characterId: null });
    this.emit();
    return { ok: true as const };
  }

  claim(clientId: string, characterId: string | null) {
    this.ensureSeat(clientId);
    const seat = this.seats.find((s) => s.clientId === clientId);
    if (!seat) return { ok: false as const, error: "Нет места" };
    if (characterId) {
      const ch = this.charById(characterId);
      if (!ch) return { ok: false as const, error: "Нет роли" };
      if (
        this.seats.some(
          (s) => s.characterId === characterId && s.clientId !== clientId,
        )
      )
        return { ok: false as const, error: "Занято" };
      if (!seat.characterId && this.players().length >= this.maxParty)
        return { ok: false as const, error: "Максимум игроков" };
      seat.characterId = characterId;
      seat.displayName = ch.name;
    } else {
      seat.characterId = null;
      seat.displayName = clientId === this.hostClientId ? "Хост" : "Игрок";
    }
    this.emit();
    return { ok: true as const };
  }

  start(clientId: string) {
    if (clientId !== this.hostClientId)
      return { ok: false as const, error: "Только хост" };
    const players = this.players();
    if (!players.length) return { ok: false as const, error: "Нужна роль" };
    if (!this.characters.length)
      return {
        ok: false as const,
        error: "В сценарии нет персонажей — вкладка Персонажи",
      };
    const start = this.graph.startLocationId;
    if (!this.graph.locations[start]) {
      return { ok: false as const, error: "В графе нет стартовой локации" };
    }
    for (const s of players) {
      this.locationOf.set(s.clientId, start);
      this.cluesOf.set(s.clientId, []);
      this.journalOf.set(s.clientId, []);
      this.inspected.set(s.clientId, new Set());
      this.talkUsed.set(s.clientId, new Set());
      this.memoriesOf.set(s.clientId, []);
      this.itemsOf.set(s.clientId, []);
      this.statesOf.set(s.clientId, []);
      this.popupsOf.set(s.clientId, []);
      this.abilityCooldown.set(s.clientId, new Map());
      this.usedAbilities.set(s.clientId, new Set());
    }
    this.flags = {};
    this.worldClaimed.clear();
    for (const f of this.initialFlags) this.flags[f] = true;
    this.firedTimelineRounds.clear();
    this.round = 1;
    this.phase = "planning";
    this.intents.clear();
    this.lastPublicEvent = "Дело открыто.";
    this.fireTimelineForRound(1);
    this.emit();
    return { ok: true as const };
  }

  submitIntent(clientId: string, intent: ActionIntent) {
    if (this.phase !== "planning") return { ok: false as const, error: "Нельзя" };
    const seat = this.seats.find((s) => s.clientId === clientId);
    if (!seat?.characterId) return { ok: false as const, error: "Нужна роль" };
    const ok = this.actionsFor(clientId).some(
      (a) => intentKey(a.intent) === intentKey(intent),
    );
    if (!ok) return { ok: false as const, error: "Действие недоступно" };
    this.intents.set(clientId, intent);
    this.emit();
    if (this.players().every((s) => this.intents.has(s.clientId)))
      this.resolveRound();
    return { ok: true as const };
  }

  clearIntent(clientId: string) {
    if (this.phase !== "planning") return;
    this.intents.delete(clientId);
    this.emit();
  }

  explore(
    clientId: string,
    intent: Extract<ActionIntent, { type: "inspect" }> | Extract<ActionIntent, { type: "talk" }>,
  ) {
    if (this.phase !== "planning") return { ok: false as const, error: "Нельзя" };
    const seat = this.seats.find((s) => s.clientId === clientId);
    if (!seat?.characterId) return { ok: false as const, error: "Нужна роль" };
    if (intent.type === "inspect") this.resolveInspect(clientId, intent.targetId);
    else this.resolveTalk(clientId, intent.npcId, intent.optionId);
    this.emit();
    return { ok: true as const };
  }

  shareMemory(clientId: string, memoryId: string, to: string) {
    if (this.phase !== "planning") return { ok: false as const, error: "Нельзя" };
    const memory = (this.memoriesOf.get(clientId) ?? []).find((m) => m.id === memoryId);
    if (!memory) return { ok: false as const, error: "Нет такого воспоминания" };
    const loc = this.locationOf.get(clientId);
    if (!loc) return { ok: false as const, error: "Вы нигде" };
    const fromName =
      this.seats.find((s) => s.clientId === clientId)?.displayName ?? "Игрок";
    const company = this.players().filter(
      (s) => s.clientId !== clientId && this.locationOf.get(s.clientId) === loc,
    );
    const targets =
      to === "location"
        ? company
        : company.filter((s) => s.clientId === to);
    if (!targets.length) return { ok: false as const, error: "Рядом никого" };
    for (const s of targets) {
      this.addMemory(s.clientId, { ...memory, source: fromName });
      this.pushPopup(
        s.clientId,
        "Вам передали",
        `${fromName}: ${memory.title}`,
        this.round,
        memory.imageUrl,
      );
    }
    this.lastResultOf.set(
      clientId,
      to === "location"
        ? `Рассказали всем здесь: ${memory.title}`
        : `Рассказали: ${memory.title}`,
    );
    this.emit();
    return { ok: true as const };
  }

  dismissPopup(clientId: string, popupId: string) {
    const list = this.popupsOf.get(clientId) ?? [];
    this.popupsOf.set(
      clientId,
      list.filter((p) => p.id !== popupId),
    );
    this.emit();
    return { ok: true as const };
  }

  private setFlags(list?: string[]) {
    if (!list) return;
    for (const f of list) this.flags[f] = true;
  }

  private addClue(clientId: string, clue: Clue) {
    const bag = this.cluesOf.get(clientId) ?? [];
    if (bag.some((c) => c.id === clue.id)) return;
    this.cluesOf.set(clientId, [...bag, clue]);
  }

  private addMemory(
    clientId: string,
    memory: { id: string; title: string; body: string; imageUrl?: string; source?: string },
  ) {
    const bag = this.memoriesOf.get(clientId) ?? [];
    if (bag.some((m) => m.id === memory.id)) return;
    this.memoriesOf.set(clientId, [
      { ...memory, round: this.round },
      ...bag,
    ].slice(0, 80));
  }

  private addItem(clientId: string, item: InventoryItem) {
    const bag = this.itemsOf.get(clientId) ?? [];
    if (bag.some((i) => i.id === item.id)) return;
    this.itemsOf.set(clientId, [...bag, item]);
  }

  private addState(clientId: string, state: ActorState) {
    const bag = this.statesOf.get(clientId) ?? [];
    if (bag.some((s) => s.id === state.id)) return;
    this.statesOf.set(clientId, [...bag, state]);
  }

  private stateIds(clientId: string) {
    return new Set((this.statesOf.get(clientId) ?? []).map((s) => s.id));
  }

  private pushJournal(clientId: string, title: string, body: string) {
    const list = this.journalOf.get(clientId) ?? [];
    list.unshift({ id: newId(), round: this.round, title, body });
    this.journalOf.set(clientId, list.slice(0, 40));
  }

  private pushPopup(
    clientId: string,
    title: string,
    body: string,
    round: number,
    imageUrl?: string,
  ) {
    const list = this.popupsOf.get(clientId) ?? [];
    list.push({ id: newId(), title, body, round, imageUrl });
    this.popupsOf.set(clientId, list);
  }

  private fireTimelineForRound(round: number) {
    if (this.firedTimelineRounds.has(round)) return;
    const rules = this.timeline.filter((r) => r.atRound === round);
    if (!rules.length) return;
    this.firedTimelineRounds.add(round);

    for (const rule of rules) {
      if (!gateOpen(rule, this.flags)) continue;
      if (rule.requiresAbilityUsed && !this.flags[rule.requiresAbilityUsed]) continue;

      this.setFlags(rule.setFlags);
      if (rule.unlockLocationId) {
        this.flags[`unlock_${rule.unlockLocationId}`] = true;
      }

      let targets = this.players();
      if (rule.scope === "same_location" && rule.scopeLocationId) {
        targets = targets.filter(
          (s) => this.locationOf.get(s.clientId) === rule.scopeLocationId,
        );
      }

      for (const s of targets) {
        this.pushJournal(s.clientId, rule.title || `Ход ${round}`, rule.body || "");
        this.addMemory(s.clientId, {
          id: `tl:${rule.atRound}:${rule.title}`,
          title: rule.title || `Ход ${round}`,
          body: rule.body || "",
          imageUrl: rule.grantClue?.imageUrl,
          source: "Событие",
        });
        if (rule.grantClue) this.addClue(s.clientId, rule.grantClue);
        this.pushPopup(
          s.clientId,
          rule.title || `Ход ${round}`,
          rule.body || "",
          round,
        );
      }
      if (rule.scope === "all") {
        this.lastPublicEvent = rule.title
          ? `Раунд ${round}: ${rule.title}`
          : `Раунд ${round}: событие сценария`;
      }
    }
  }

  private resolveRound() {
    const players = this.players();
    for (const s of players) {
      const intent = this.intents.get(s.clientId);
      if (intent?.type !== "move") continue;
      const loc = this.locationOf.get(s.clientId);
      if (!loc) continue;
      if (
        availableExits(this.graph, loc, this.flags).some(
          (e) => e.to === intent.toLocationId,
        ) &&
        !this.isLocationLocked(intent.toLocationId)
      ) {
        this.locationOf.set(s.clientId, intent.toLocationId);
        const name = locationName(this.graph, intent.toLocationId);
        this.pushJournal(s.clientId, "Перемещение", name);
        this.lastResultOf.set(s.clientId, `Вы в локации: ${name}`);
      }
    }
    for (const s of players) {
      const intent = this.intents.get(s.clientId);
      if (!intent || intent.type === "move") continue;
      if (intent.type === "wait") {
        this.pushJournal(s.clientId, "Ожидание", "Ничего не делали.");
        this.lastResultOf.set(s.clientId, "Вы ждали.");
      } else if (intent.type === "inspect") {
        this.resolveInspect(s.clientId, intent.targetId);
      } else if (intent.type === "talk") {
        this.resolveTalk(s.clientId, intent.npcId, intent.optionId);
      } else if (intent.type === "share") {
        this.resolveShare(s.clientId, intent.clueId);
      } else if (intent.type === "ability") {
        this.resolveAbility(s.clientId, intent.abilityId, intent.targetLabel);
      }
    }
    this.intents.clear();
    const closed = this.round;
    this.round += 1;
    for (const [, map] of this.abilityCooldown) {
      for (const [aid, until] of [...map.entries()]) {
        if (until < this.round) map.delete(aid);
      }
    }
    this.lastPublicEvent = `Раунд ${closed} закрыт.`;
    this.fireTimelineForRound(this.round);
    this.emit();
  }

  private resolveAbility(clientId: string, abilityId: string, targetLabel?: string) {
    const seat = this.seats.find((s) => s.clientId === clientId);
    if (!seat?.characterId) return;
    const ch = this.charById(seat.characterId);
    if (!ch?.lore) return;
    const base = getLoreBase(ch.lore.baseId || this.loreBaseId);
    if (!base) return;
    const ab = findAbility(base, abilityId);
    if (!ab) return;
    if (ab.mechanics.requiresFlags?.some((f) => !this.flags[f])) return;
    if (ab.mechanics.oncePerGame && this.flags[`ability_used:${abilityId}`]) return;

    for (const fx of ab.mechanics.effects) {
      if (fx.type === "reveal_text") {
        const body = targetLabel ? `${fx.body} Цель: ${targetLabel}.` : fx.body;
        if (fx.scope === "self") {
          this.pushPopup(clientId, fx.title, body, this.round);
          this.lastResultOf.set(clientId, body);
        } else if (fx.scope === "all") {
          for (const s of this.players()) {
            this.pushPopup(s.clientId, fx.title, body, this.round);
          }
        } else if (fx.scope === "same_location") {
          const loc = this.locationOf.get(clientId);
          for (const s of this.players()) {
            if (this.locationOf.get(s.clientId) === loc) {
              this.pushPopup(s.clientId, fx.title, body, this.round);
            }
          }
        }
        this.pushJournal(clientId, ab.nameRu, body);
        this.addMemory(clientId, {
          id: `ab:${abilityId}:${fx.title}`,
          title: fx.title || ab.nameRu,
          body,
          source: "Способность",
        });
      } else if (fx.type === "set_flag") {
        this.flags[fx.flag] = true;
      } else if (fx.type === "grant_clue") {
        this.addClue(clientId, fx.clue);
        this.addMemory(clientId, {
          id: fx.clue.id,
          title: fx.clue.title,
          body: fx.clue.body,
          source: fx.clue.source,
        });
      } else if (fx.type === "unlock_location") {
        this.flags[`unlock_${fx.locationId}`] = true;
      }
    }
    this.setFlags(ab.mechanics.setsFlags);
    const cd = ab.mechanics.cooldownRounds ?? 0;
    if (cd > 0) {
      const map = this.abilityCooldown.get(clientId) ?? new Map();
      map.set(abilityId, this.round + cd);
      this.abilityCooldown.set(clientId, map);
    }
    this.flags[`ability_used:${abilityId}`] = true;
    const used = this.usedAbilities.get(clientId) ?? new Set();
    used.add(abilityId);
    this.usedAbilities.set(clientId, used);
  }

  private resolveInspect(clientId: string, targetId: string) {
    const loc = this.locationOf.get(clientId);
    if (!loc) return;
    const seen = this.inspected.get(clientId) ?? new Set();
    const t = availableInspect(
      this.graph,
      loc,
      this.flags,
      seen,
      this.worldClaimed,
      this.stateIds(clientId),
      this.openAbilities(clientId),
    ).find((x) => x.id === targetId);
    if (!t) {
      this.lastResultOf.set(clientId, "Уже не на что смотреть.");
      this.pushPopup(clientId, "Пусто", "Кто-то успел раньше, или это уже закрыто.", this.round);
      return;
    }
    if (t.audience === "world") this.worldClaimed.add(t.id);
    seen.add(t.id);
    this.inspected.set(clientId, seen);
    this.setFlags(t.setFlags);
    this.addMemory(clientId, {
      id: t.clue?.id ?? t.id,
      title: t.clue?.title ?? t.label,
      body: t.result,
      imageUrl: t.image,
      source: t.clue?.source ?? t.label,
    });
    if (t.clue) this.addClue(clientId, t.clue);
    if (t.item) this.addItem(clientId, t.item);
    if (t.grantState) this.addState(clientId, t.grantState);
    this.pushJournal(clientId, t.label, t.result);
    this.lastResultOf.set(clientId, t.result);
    this.pushPopup(clientId, t.clue?.title ?? t.label, t.result, this.round, t.image ?? t.item?.imageUrl);
  }

  private resolveTalk(clientId: string, npcId: string, optionId: string) {
    const loc = this.locationOf.get(clientId);
    if (!loc) return;
    const npc = availableNpcs(this.graph, loc, this.flags).find((n) => n.id === npcId);
    if (!npc) return;
    const used = this.talkUsed.get(clientId) ?? new Set();
    const opt = availableTalkOptions(npc, this.flags, used).find(
      (o) => o.id === optionId,
    );
    if (!opt) return;
    used.add(`${npc.id}:${opt.id}`);
    this.talkUsed.set(clientId, used);
    this.setFlags(opt.setFlags);
    this.addMemory(clientId, {
      id: `${npc.id}:${opt.id}`,
      title: `${npc.name}: ${opt.label}`,
      body: opt.reply,
      imageUrl: npc.portraitUrl,
      source: npc.name,
    });
    if (opt.clue) {
      this.addClue(clientId, opt.clue);
      this.addMemory(clientId, {
        id: opt.clue.id,
        title: opt.clue.title,
        body: opt.clue.body,
        source: opt.clue.source,
      });
    }
    this.pushJournal(clientId, `${npc.name}: ${opt.label}`, opt.reply);
    this.lastResultOf.set(clientId, opt.reply);
    this.pushPopup(clientId, npc.name, opt.reply, this.round, npc.portraitUrl);
  }

  private resolveShare(clientId: string, clueId: string) {
    const clue = (this.cluesOf.get(clientId) ?? []).find((c) => c.id === clueId);
    if (!clue) return;
    const loc = this.locationOf.get(clientId) ?? this.graph.startLocationId;
    const locName = locationName(this.graph, loc);
    const fromName =
      this.seats.find((s) => s.clientId === clientId)?.displayName ?? "Игрок";
    this.shareBoard = [
      {
        id: newId(),
        fromName,
        locationId: loc,
        locationName: locName,
        title: clue.title,
        body: clue.body,
        round: this.round,
      },
      ...this.shareBoard,
    ].slice(0, 12);
    for (const s of this.players()) {
      if (this.locationOf.get(s.clientId) !== loc) continue;
      this.addClue(s.clientId, clue);
      if (s.clientId !== clientId) {
        this.pushJournal(s.clientId, "Поделились", `${fromName}: «${clue.title}»`);
      }
    }
    this.pushJournal(clientId, "На экран", clue.title);
    this.lastResultOf.set(clientId, `Показано в «${locName}»: ${clue.title}`);
    this.lastPublicEvent = `${fromName} → ${locName}: ${clue.title}`;
  }

  private heldAbilityIds(clientId: string): string[] {
    const seat = this.seats.find((s) => s.clientId === clientId);
    const ch = seat?.characterId ? this.charById(seat.characterId) : null;
    if (!ch?.lore) return [];
    return ch.lore.enabledAbilityIds ?? [];
  }

  /** Passive powers are open immediately. Active ones open after this player uses them. */
  private openAbilities(clientId: string): Set<string> {
    const base = getLoreBase(this.loreBaseId);
    const used = this.usedAbilities.get(clientId) ?? new Set();
    const open = new Set<string>();
    for (const id of this.heldAbilityIds(clientId)) {
      const ab = base ? findAbility(base, id) : null;
      if (!ab) continue;
      if ((ab.kind ?? "active") === "passive" || used.has(id)) open.add(id);
    }
    return open;
  }

  private actionsFor(clientId: string): ActionOption[] {
    if (this.phase !== "planning") return [];
    const seat = this.seats.find((s) => s.clientId === clientId);
    if (!seat?.characterId) return [];
    const loc = this.locationOf.get(clientId);
    if (!loc) return [];
    const opts: ActionOption[] = [
      { id: "wait", intent: { type: "wait" }, label: "Ничего не делать" },
    ];
    for (const e of availableExits(this.graph, loc, this.flags)) {
      if (this.isLocationLocked(e.to)) continue;
      opts.push({
        id: `move:${e.to}`,
        intent: { type: "move", toLocationId: e.to },
        label: `Идти: ${e.label}`,
      });
    }

    const open = this.openAbilities(clientId);
    const seen = this.inspected.get(clientId) ?? new Set();
    for (const t of availableInspect(
      this.graph,
      loc,
      this.flags,
      seen,
      this.worldClaimed,
      this.stateIds(clientId),
      open,
    )) {
      opts.push({
        id: `inspect:${t.id}`,
        intent: { type: "inspect", targetId: t.id },
        label: `Осмотреть: ${t.label}`,
      });
    }
    const used = this.talkUsed.get(clientId) ?? new Set();
    for (const npc of availableNpcs(this.graph, loc, this.flags, open)) {
      for (const o of availableTalkOptions(npc, this.flags, used)) {
        opts.push({
          id: `talk:${npc.id}:${o.id}`,
          intent: { type: "talk", npcId: npc.id, optionId: o.id },
          label: `${npc.name}: ${o.label}`,
        });
      }
    }

    const ch = this.charById(seat.characterId);
    if (ch?.lore) {
      const base = getLoreBase(ch.lore.baseId || this.loreBaseId);
      const ids = ch.lore.enabledAbilityIds ?? [];
      const cdMap = this.abilityCooldown.get(clientId) ?? new Map();
      for (const aid of ids) {
        const ab = base ? findAbility(base, aid) : null;
        if (!ab) continue;
        if ((ab.kind ?? "active") === "passive") continue;
        if (ab.mechanics.requiresFlags?.some((f) => !this.flags[f])) continue;
        if (ab.mechanics.oncePerGame && this.flags[`ability_used:${aid}`]) continue;
        const until = cdMap.get(aid);
        if (until != null && until >= this.round) continue;
        opts.push({
          id: `ability:${aid}`,
          intent: { type: "ability", abilityId: aid },
          label: `✧ ${ab.nameRu}`,
          detail: ab.target && ab.target !== "none"
            ? `${ab.descriptionRu} Нужна цель.`
            : ab.descriptionRu,
          needsTarget: ab.target && ab.target !== "none" ? ab.target : undefined,
        });
      }
    }

    return opts;
  }

  private isLocationLocked(locationId: string): boolean {
    const gated = this.timeline.some((t) => t.unlockLocationId === locationId);
    if (!gated) return false;
    return !this.flags[`unlock_${locationId}`];
  }

  private visibleShares(clientId: string): SharePayload[] {
    const loc = this.locationOf.get(clientId);
    if (!loc) {
      return clientId === this.hostClientId ? this.shareBoard : [];
    }
    return this.shareBoard.filter((s) => s.locationId === loc);
  }

  private partyView(): PartySeatView[] {
    return this.seats.map((s) => {
      const loc = this.locationOf.get(s.clientId);
      return {
        clientId: s.clientId,
        name: s.displayName,
        locationName: loc ? locationName(this.graph, loc) : null,
        ready: this.intents.has(s.clientId),
        playing: Boolean(s.characterId),
      };
    });
  }

  snapshotFor(clientId: string): TurnSnapshot {
    const seat = this.seats.find((s) => s.clientId === clientId);
    const loc = this.locationOf.get(clientId) ?? null;
    const players = this.players();
    const hereWith = players
      .filter(
        (s) => s.clientId !== clientId && this.locationOf.get(s.clientId) === loc,
      )
      .map((s) => s.displayName);
    const company = players
      .filter(
        (s) => s.clientId !== clientId && this.locationOf.get(s.clientId) === loc,
      )
      .map((s) => ({ clientId: s.clientId, name: s.displayName }));
    const hereNpcs = loc
      ? availableNpcs(this.graph, loc, this.flags, this.openAbilities(clientId)).map((n) => ({
          id: n.id,
          name: n.name,
          intro: n.intro,
          portraitUrl: n.portraitUrl,
        }))
      : [];
    return {
      code: this.code,
      projectId: this.projectId,
      projectTitle: this.projectTitle,
      isHost: clientId === this.hostClientId,
      status: this.phase === "lobby" ? "lobby" : "playing",
      phase: this.phase,
      round: this.round,
      seats: this.seats.map((s) => ({ ...s })),
      characterOptions: this.characterOptions(),
      myCharacterId: seat?.characterId ?? null,
      takenCharacterIds: this.seats
        .map((s) => s.characterId)
        .filter(Boolean) as string[],
      myLocationId: loc,
      myLocationName: loc ? locationName(this.graph, loc) : null,
      myLocationDescription: loc
        ? (this.graph.locations[loc]?.description ?? null)
        : null,
      myLocationImage: loc ? pickLocationImage(this.graph.locations[loc], this.flags, this.round) : null,
      myScene: this.sceneFor(clientId, loc),
      hereNpcs,
      hereWith,
      company,
      availableActions: this.actionsFor(clientId),
      myIntent: this.intents.get(clientId) ?? null,
      intentsReady: [...this.intents.keys()].filter((id) =>
        players.some((p) => p.clientId === id),
      ).length,
      intentsNeeded: players.length,
      myClues: this.cluesOf.get(clientId) ?? [],
      myJournal: this.journalOf.get(clientId) ?? [],
      myMemories: this.memoriesOf.get(clientId) ?? [],
      myItems: this.itemsOf.get(clientId) ?? [],
      myStates: this.statesOf.get(clientId) ?? [],
      shareBoard: this.visibleShares(clientId),
      myPopups: this.popupsOf.get(clientId) ?? [],
      lastResult: this.lastResultOf.get(clientId) ?? null,
      lastPublicEvent: this.lastPublicEvent,
      party: clientId === this.hostClientId ? this.partyView() : undefined,
    };
  }

  private sceneFor(clientId: string, loc: string | null): SceneHotspot[] {
    if (!loc || this.phase !== "planning") return [];
    const pins = this.graph.locations[loc]?.scene ?? [];
    const seen = this.inspected.get(clientId) ?? new Set<string>();
    const open = this.openAbilities(clientId);
    const openInspect = new Set(
      availableInspect(
        this.graph,
        loc,
        this.flags,
        seen,
        this.worldClaimed,
        this.stateIds(clientId),
        open,
      ).map((t) => t.id),
    );
    const openNpcs = new Set(
      availableNpcs(this.graph, loc, this.flags, open).map((n) => n.id),
    );
    const used = this.talkUsed.get(clientId) ?? new Set<string>();
    const hotspots: SceneHotspot[] = [];
    for (const pin of pins) {
      const inspectId =
        pin.interaction === "inspect" ? pin.linkNodeId : undefined;
      const npcId = pin.interaction === "talk" ? pin.linkNodeId : undefined;
      if (inspectId && !openInspect.has(inspectId)) continue;
      if (npcId && !openNpcs.has(npcId)) continue;
      const npc = npcId
        ? availableNpcs(this.graph, loc, this.flags).find((n) => n.id === npcId)
        : undefined;
      hotspots.push({
        id: pin.id,
        label: pin.label ?? "",
        image: pin.url,
        x: pin.x,
        y: pin.y,
        w: pin.w,
        h: pin.h,
        kind: npcId ? "npc" : "inspect",
        inspectId,
        npcId,
        talkOptions: npc
          ? availableTalkOptions(npc, this.flags, used).map((o) => ({
              id: o.id,
              label: o.label,
            }))
          : undefined,
      });
    }
    return hotspots;
  }

  exportState(): EngineState {
    return {
      phase: this.phase,
      round: this.round,
      seats: this.seats.map((s) => ({ ...s })),
      flags: { ...this.flags },
      locationOf: [...this.locationOf.entries()],
      cluesOf: [...this.cluesOf.entries()],
      journalOf: [...this.journalOf.entries()],
      memoriesOf: [...this.memoriesOf.entries()],
      itemsOf: [...this.itemsOf.entries()],
      statesOf: [...this.statesOf.entries()],
      worldClaimed: [...this.worldClaimed],
      inspected: [...this.inspected.entries()].map(([id, set]) => [id, [...set]]),
      talkUsed: [...this.talkUsed.entries()].map(([id, set]) => [id, [...set]]),
      intents: [...this.intents.entries()],
      lastResultOf: [...this.lastResultOf.entries()],
      shareBoard: this.shareBoard,
      popupsOf: [...this.popupsOf.entries()],
      abilityCooldown: [...this.abilityCooldown.entries()].map(([id, map]) => [
        id,
        [...map.entries()],
      ]),
      lastPublicEvent: this.lastPublicEvent,
      firedTimelineRounds: [...this.firedTimelineRounds],
    };
  }

  importState(state: EngineState) {
    this.phase = state.phase === "planning" ? "planning" : "lobby";
    this.round = state.round || 0;
    this.seats = state.seats?.length
      ? state.seats.map((s) => ({ ...s }))
      : this.seats;
    this.flags = { ...(state.flags ?? {}) };
    this.locationOf = new Map(state.locationOf ?? []);
    this.cluesOf = new Map(state.cluesOf ?? []);
    this.journalOf = new Map(state.journalOf ?? []);
    this.memoriesOf = new Map(state.memoriesOf ?? []);
    this.itemsOf = new Map(state.itemsOf ?? []);
    this.statesOf = new Map(state.statesOf ?? []);
    this.worldClaimed = new Set(state.worldClaimed ?? []);
    this.inspected = new Map(
      (state.inspected ?? []).map(([id, ids]) => [id, new Set(ids)]),
    );
    this.talkUsed = new Map(
      (state.talkUsed ?? []).map(([id, ids]) => [id, new Set(ids)]),
    );
    this.intents = new Map(state.intents ?? []);
    this.lastResultOf = new Map(state.lastResultOf ?? []);
    this.shareBoard = state.shareBoard ?? [];
    this.popupsOf = new Map(state.popupsOf ?? []);
    this.abilityCooldown = new Map(
      (state.abilityCooldown ?? []).map(([id, pairs]) => [id, new Map(pairs)]),
    );
    this.lastPublicEvent = state.lastPublicEvent ?? null;
    this.firedTimelineRounds = new Set(state.firedTimelineRounds ?? []);
  }
}

export type EngineState = {
  phase: "lobby" | "planning";
  round: number;
  seats: Seat[];
  flags: Record<string, boolean>;
  locationOf: [string, string][];
  cluesOf: [string, Clue[]][];
  journalOf: [string, JournalEntry[]][];
  memoriesOf?: [string, Memory[]][];
  itemsOf?: [string, InventoryItem[]][];
  statesOf?: [string, ActorState[]][];
  worldClaimed?: string[];
  inspected: [string, string[]][];
  talkUsed: [string, string[]][];
  intents: [string, ActionIntent][];
  lastResultOf: [string, string][];
  shareBoard: SharePayload[];
  popupsOf: [string, PopupNotice[]][];
  abilityCooldown: [string, [string, number][]][];
  lastPublicEvent: string | null;
  firedTimelineRounds: number[];
};
