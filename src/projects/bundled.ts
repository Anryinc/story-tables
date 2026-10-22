import { cherwoodScenario } from "./cherwood/scenario";
import { thirdBellScenario } from "./third-bell/scenario";
import { cadmonScenario } from "./cadmon/scenario";
import type { ScenarioDocument } from "@/lib/scenario/types";

const BUNDLED: ScenarioDocument[] = [thirdBellScenario, cherwoodScenario, cadmonScenario];

export function listBundledScenarios(): ScenarioDocument[] {
  return BUNDLED;
}

export function getBundledScenario(id: string): ScenarioDocument | null {
  return BUNDLED.find((s) => s.manifest.id === id) ?? null;
}
