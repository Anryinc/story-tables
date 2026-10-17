import { cherwoodScenario } from "./cherwood/scenario";
import { thirdBellScenario } from "./third-bell/scenario";
import type { ScenarioDocument } from "@/lib/scenario/types";

const BUNDLED: ScenarioDocument[] = [thirdBellScenario, cherwoodScenario];

export function listBundledScenarios(): ScenarioDocument[] {
  return BUNDLED;
}

export function getBundledScenario(id: string): ScenarioDocument | null {
  return BUNDLED.find((s) => s.manifest.id === id) ?? null;
}
