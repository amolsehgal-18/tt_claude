/**
 * Local Scenario Engine — replaces AI generation.
 * 1238 scenarios, all tagged with psych: { left, right }.
 * Tracks global history in localStorage so users never see
 * the same scenario twice across ~100+ sessions.
 */

import scenarioData from './scenarios.json';
import type { AiScenarioPresentationOutput, AiScenarioPresentationInput } from '@/ai/flows/ai-scenario-presentation-flow';
import type { PsychDelta } from './psychProfile';
import { seededRand, stringToSeed } from './game-logic';

export type LocalScenario = AiScenarioPresentationOutput & {
  gameCategory: string;
  psych: { left: PsychDelta; right: PsychDelta };
};

const ALL_SCENARIOS = scenarioData.scenarios as LocalScenario[];

const HISTORY_KEY = 'tt_global_scenario_history';
const MAX_HISTORY = 600;

function loadHistory(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveHistory(history: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    const arr = Array.from(history).slice(-MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
  } catch {}
}

function markSeen(scenarioId: string) {
  const history = loadHistory();
  history.add(scenarioId);
  saveHistory(history);
}

export function getLocalScenario(
  input: AiScenarioPresentationInput & {
    flags?: string[];
    weeklyMode?: boolean;
  }
): LocalScenario {
  // Weekly challenge: skip global history for fairness (same pool for all players)
  const globalHistory = input.weeklyMode ? new Set<string>() : loadHistory();
  const excluded = new Set([...globalHistory, ...input.excludedScenarioIds]);

  let pool = ALL_SCENARIOS.filter(s => !excluded.has(s.scenarioId));

  if (pool.length === 0) {
    if (!input.weeklyMode) saveHistory(new Set());
    pool = ALL_SCENARIOS;
  }

  const flags = input.flags ?? [];

  // Contextual weighting: prefer scenarios relevant to current game state
  const weighted = pool.map(s => {
    let weight = 1;
    const { boardSupport, fanSupport, dressingRoom } = input;

    if (boardSupport < 0.35 && s.gameCategory === 'press')    weight += 3;
    if (fanSupport   < 0.35 && s.gameCategory === 'locker')   weight += 2;
    if (dressingRoom < 0.35 && s.gameCategory === 'training') weight += 3;
    if (s.isBreaking) weight += 1;

    // ── Flag-based category boosts ──────────────────────────────────────
    if (flags.includes('squad_unrest')    && s.gameCategory === 'locker')   weight += 4;
    if (flags.includes('board_pressure')  && s.gameCategory === 'press')    weight += 4;
    if (flags.includes('fan_revolt')      && s.gameCategory === 'stadium')  weight += 3;
    if (flags.includes('fan_revolt')      && s.gameCategory === 'press')    weight += 2;
    if (flags.includes('hot_streak')      && s.isBreaking)                  weight += 2;
    if (flags.includes('crisis_mode')     && s.gameCategory === 'press')    weight += 3;
    if (flags.includes('title_charge')    && s.gameCategory === 'stadium')  weight += 2;
    if (flags.includes('relegation_zone') && s.gameCategory === 'locker')   weight += 2;
    if (flags.includes('squad_harmony')   && s.gameCategory === 'training') weight += 2;
    if (flags.includes('on_the_brink')    && s.gameCategory === 'press')    weight += 3;

    return { scenario: s, weight };
  });

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);

  // Weekly mode: deterministic pick using seeded random
  let randVal: number;
  if (input.randomSeed) {
    const seed = stringToSeed(input.randomSeed + totalWeight.toString());
    randVal = seededRand(seed)() * totalWeight;
  } else {
    randVal = Math.random() * totalWeight;
  }

  let picked = weighted[0].scenario;
  for (const { scenario, weight } of weighted) {
    randVal -= weight;
    if (randVal <= 0) { picked = scenario; break; }
  }

  if (!input.weeklyMode) markSeen(picked.scenarioId);
  return picked;
}
