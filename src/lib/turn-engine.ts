import {
  availableExits,
  availableInspect,
  availableNpcs,
  availableTalkOptions,
  locationName,
} from "./graph/runtime";
import type { Clue, GraphDocument } from "./graph/types";
import { newId } from "./ids";
import { findAbility, getLoreBase } from "./lore/registry";
import type { TimelineRule } from "./scenario/compile";
import type { ScenarioCharacter } from "./scenario/types";
import { MAX_PARTY } from "@/projects/roster";
import type {
  ActionIntent,
  ActionOption,
  CharacterOption,
  JournalEntry,
  PopupNotice,
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
  private lastPublicEvent: string | null = null;
  private listeners = new Set<() => void>();
  private firedTimelineRounds = new Set<number>();

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
    return this.characters.map((c) => ({
      id: c.id,
      name: c.name,
      blurb: c.blurb,
      pathway: c.lore
        ? `${c.lore.pathwayId} · C${c.lore.sequenceRank}`
        : undefined,
      portraitUrl: c.portraitUrl,
    }));
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
      this.popupsOf.set(s.clientId, []);
      this.abilityCooldown.set(s.clientId, new Map());
    }
    this.flags = {};
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

  private pushJournal(clientId: string, title: string, body: string) {
    const list = this.journalOf.get(clientId) ?? [];
    list.unshift({ id: newId(), round: this.round, title, body });
    this.journalOf.set(clientId, list.slice(0, 40));
  }

  private pushPopup(clientId: string, title: string, body: string, round: number) {
    const list = this.popupsOf.get(clientId) ?? [];
    list.push({ id: newId(), title, body, round });
    this.popupsOf.set(clientId, list);
  }

  private fireTimelineForRound(round: number) {
    if (this.firedTimelineRounds.has(round)) return;
    const rules = this.timeline.filter((r) => r.atRound === round);
    if (!rules.length) return;
    this.firedTimelineRounds.add(round);

    for (const rule of rules) {
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
        if (rule.grantClue) this.addClue(s.clientId, rule.grantClue);
        this.pushPopup(
          s.clientId,
          rule.title || `Ход ${round}`,
          rule.body || "",
          round,
        );
      }
      this.lastPublicEvent = `Раунд ${round}: событие сценария`;
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
        )
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
        this.resolveAbility(s.clientId, intent.abilityId);
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

  private resolveAbility(clientId: string, abilityId: string) {
    const seat = this.seats.find((s) => s.clientId === clientId);
    if (!seat?.characterId) return;
    const ch = this.charById(seat.characterId);
    if (!ch?.lore) return;
    const base = getLoreBase(ch.lore.baseId || this.loreBaseId);
    if (!base) return;
    const ab = findAbility(base, abilityId);
    if (!ab) return;

    for (const fx of ab.mechanics.effects) {
      if (fx.type === "reveal_text") {
        if (fx.scope === "self") {
          this.pushPopup(clientId, fx.title, fx.body, this.round);
          this.lastResultOf.set(clientId, fx.body);
        } else if (fx.scope === "all") {
          for (const s of this.players()) {
            this.pushPopup(s.clientId, fx.title, fx.body, this.round);
          }
        } else if (fx.scope === "same_location") {
          const loc = this.locationOf.get(clientId);
          for (const s of this.players()) {
            if (this.locationOf.get(s.clientId) === loc) {
              this.pushPopup(s.clientId, fx.title, fx.body, this.round);
            }
          }
        }
        this.pushJournal(clientId, ab.nameRu, fx.body);
      } else if (fx.type === "set_flag") {
        this.flags[fx.flag] = true;
      } else if (fx.type === "grant_clue") {
        this.addClue(clientId, fx.clue);
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
  }

  private resolveInspect(clientId: string, targetId: string) {
    const loc = this.locationOf.get(clientId);
    if (!loc) return;
    const seen = this.inspected.get(clientId) ?? new Set();
    const t = availableInspect(this.graph, loc, this.flags, seen).find(
      (x) => x.id === targetId,
    );
    if (!t) {
      this.lastResultOf.set(clientId, "Нечего осматривать.");
      return;
    }
    seen.add(t.id);
    this.inspected.set(clientId, seen);
    this.setFlags(t.setFlags);
    this.pushJournal(clientId, t.label, t.result);
    this.lastResultOf.set(clientId, t.result);
    if (t.clue) this.addClue(clientId, t.clue);
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
    this.pushJournal(clientId, `${npc.name}: ${opt.label}`, opt.reply);
    this.lastResultOf.set(clientId, opt.reply);
    if (opt.clue) this.addClue(clientId, opt.clue);
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
      const unlockKey = `unlock_${e.to}`;
      if (
        Object.keys(this.flags).some((k) => k.startsWith("unlock_")) &&
        this.graph.locations[e.to] &&
        this.timeline.some((t) => t.unlockLocationId === e.to) &&
        !this.flags[unlockKey]
      ) {
        continue;
      }
      opts.push({
        id: `move:${e.to}`,
        intent: { type: "move", toLocationId: e.to },
        label: `Идти: ${e.label}`,
      });
    }
    const seen = this.inspected.get(clientId) ?? new Set();
    for (const t of availableInspect(this.graph, loc, this.flags, seen)) {
      opts.push({
        id: `inspect:${t.id}`,
        intent: { type: "inspect", targetId: t.id },
        label: `Осмотреть: ${t.label}`,
      });
    }
    const used = this.talkUsed.get(clientId) ?? new Set();
    for (const npc of availableNpcs(this.graph, loc, this.flags)) {
      for (const o of availableTalkOptions(npc, this.flags, used)) {
        opts.push({
          id: `talk:${npc.id}:${o.id}`,
          intent: { type: "talk", npcId: npc.id, optionId: o.id },
          label: `${npc.name}: ${o.label}`,
          detail: npc.intro,
        });
      }
    }
    for (const c of this.cluesOf.get(clientId) ?? []) {
      opts.push({
        id: `share:${c.id}`,
        intent: { type: "share", clueId: c.id },
        label: `Показать здесь: ${c.title}`,
        detail: "Тратит ход.",
      });
    }

    const ch = this.charById(seat.characterId);
    if (ch?.lore) {
      const base = getLoreBase(ch.lore.baseId || this.loreBaseId);
      const ids = ch.lore.enabledAbilityIds ?? [];
      const cdMap = this.abilityCooldown.get(clientId) ?? new Map();
      for (const aid of ids) {
        const ab = base ? findAbility(base, aid) : null;
        if (!ab) continue;
        if (ab.mechanics.oncePerGame && this.flags[`ability_used:${aid}`]) continue;
        const until = cdMap.get(aid);
        if (until != null && until >= this.round) continue;
        opts.push({
          id: `ability:${aid}`,
          intent: { type: "ability", abilityId: aid },
          label: `✧ ${ab.nameRu}`,
          detail: ab.descriptionRu,
        });
      }
    }

    return opts;
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
    const hereNpcs = loc
      ? availableNpcs(this.graph, loc, this.flags).map((n) => ({
          id: n.id,
          name: n.name,
          intro: n.intro,
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
      myLocationImage: loc ? this.graph.locations[loc]?.image ?? null : null,
      hereNpcs,
      hereWith,
      availableActions: this.actionsFor(clientId),
      myIntent: this.intents.get(clientId) ?? null,
      intentsReady: [...this.intents.keys()].filter((id) =>
        players.some((p) => p.clientId === id),
      ).length,
      intentsNeeded: players.length,
      myClues: this.cluesOf.get(clientId) ?? [],
      myJournal: this.journalOf.get(clientId) ?? [],
      shareBoard: this.shareBoard,
      myPopups: this.popupsOf.get(clientId) ?? [],
      lastResult: this.lastResultOf.get(clientId) ?? null,
      lastPublicEvent: this.lastPublicEvent,
    };
  }
}
