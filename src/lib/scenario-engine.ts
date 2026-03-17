/**
 * Local Scenario Engine — replaces AI generation.
 * 1238 scenarios, all tagged with psych: { left, right }.
 * Tracks global history in localStorage so users never see
 * the same scenario twice across ~100+ sessions.
 *
 * NEW: Flag-triggered consequence scenarios surface when specific
 * game-state conditions are met (squad_crisis, board_crisis, fan_revolt,
 * momentum_surge, press_war).
 */

import scenarioData from './scenarios.json';
import type { AiScenarioPresentationOutput, AiScenarioPresentationInput } from '@/ai/flows/ai-scenario-presentation-flow';
import type { PsychDelta } from './psychProfile';

export type LocalScenario = AiScenarioPresentationOutput & {
  gameCategory: string;
  psych: { left: PsychDelta; right: PsychDelta };
};

export type ScenarioResult = {
  scenario: LocalScenario;
  consumedFlag?: string;
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

// ── Consequence flag scenarios ─────────────────────────────────────────────────
// These surface when a matching flag is active in GameState.flags.
// Each fires once (consuming the flag) then the regular pool resumes.

const NEUTRAL_PSYCH = {
  left:  { board: 0, fans: 0, squad: 0, TF: 0, D: 0, MP: 0, MM: 0, TT: 0 },
  right: { board: 0, fans: 0, squad: 0, TF: 0, D: 0, MP: 0, MM: 0, TT: 0 },
};

const FLAG_SCENARIOS: Record<string, LocalScenario> = {

  squad_crisis: {
    scenarioId: 'cons_squad_crisis',
    scenario: "Three players have reportedly gone above your head — they've met with the board privately. The dressing room is split and your authority is crumbling.",
    leftOption:  "Call an emergency meeting. Clear the air.",
    rightOption: "Identify the ringleaders and drop them.",
    impactLeft:  { board: -5,  fans:  5, squad: 15, aggression: -0.05 },
    impactRight: { board: 10,  fans: -5, squad: -10, aggression: 0.10 },
    imageCategory: 'locker',
    isBreaking: true,
    gameCategory: 'locker',
    psych: {
      left:  { board: -1, fans: 1, squad: 2, TF: 0, D: -1, MP: 1, MM: 2, TT: -1 },
      right: { board: 1, fans: -1, squad: -1, TF: 0, D: 2, MP: -1, MM: -2, TT: 2 },
    },
  },

  board_crisis: {
    scenarioId: 'cons_board_crisis',
    scenario: "An emergency board meeting has been called. Club insiders say your future is being discussed without you in the room. The chairman won't return your calls.",
    leftOption:  "Demand a face-to-face. Fight your corner.",
    rightOption: "Stay calm. Let results do the talking.",
    impactLeft:  { board: -10, fans: 8,  squad: 5,  aggression: 0.08 },
    impactRight: { board: 5,   fans: -3, squad: -3, aggression: -0.05 },
    imageCategory: 'board_pressure',
    isBreaking: true,
    gameCategory: 'press',
    psych: {
      left:  { board: -1, fans: 1, squad: 0, TF: 0, D: 1, MP: 2, MM: 0, TT: 2 },
      right: { board: 1, fans: -1, squad: 0, TF: 1, D: 0, MP: -1, MM: 1, TT: -2 },
    },
  },

  fan_revolt: {
    scenarioId: 'cons_fan_revolt',
    scenario: "Two hundred ultras have gathered outside the training ground. A banner reads 'GET OUT'. A protest march to the stadium is being organised for matchday.",
    leftOption:  "Go out and speak to them directly.",
    rightOption: "Release a formal statement only.",
    impactLeft:  { board: -8, fans: 18, squad: 5,  aggression: 0.05 },
    impactRight: { board: 5,  fans: -8, squad: -3, aggression: -0.03 },
    imageCategory: 'fans',
    isBreaking: true,
    gameCategory: 'locker',
    psych: {
      left:  { board: -1, fans: 2, squad: 1, TF: 0, D: -1, MP: 2, MM: 1, TT: 1 },
      right: { board: 1, fans: -1, squad: 0, TF: 0, D: 1, MP: -1, MM: -1, TT: -1 },
    },
  },

  momentum_surge: {
    scenarioId: 'cons_momentum_surge',
    scenario: "Your methods are suddenly the talk of the football world. A top club has reportedly approached your assistant manager — and two of your players have attracted summer interest.",
    leftOption:  "Block it all. Keep the squad together.",
    rightOption: "Let them leave if the money's right.",
    impactLeft:  { board: 8,  fans: 10, squad: 8,  aggression: 0.02 },
    impactRight: { board: 15, fans: -5, squad: -8, aggression: -0.02 },
    imageCategory: 'press',
    isBreaking: true,
    gameCategory: 'press',
    psych: {
      left:  { board: 0, fans: 1, squad: 1, TF: 0, D: 0, MP: 1, MM: 2, TT: 0 },
      right: { board: 2, fans: -1, squad: -1, TF: 1, D: 1, MP: -1, MM: -1, TT: 0 },
    },
  },

  press_war: {
    scenarioId: 'cons_press_war',
    scenario: "A national newspaper has run a five-page exposé — unnamed sources, training ground leaks, questionable tactical diagrams. Your agent is urging you to sue.",
    leftOption:  "Take legal action. Go nuclear.",
    rightOption: "Rise above it. Stay professional.",
    impactLeft:  { board: -5, fans: 10, squad: 5,  aggression: 0.12 },
    impactRight: { board: 8,  fans: 3,  squad: -2, aggression: -0.05 },
    imageCategory: 'press',
    isBreaking: true,
    gameCategory: 'press',
    psych: {
      left:  { board: -1, fans: 1, squad: 1, TF: 0, D: 0, MP: 2, MM: 0, TT: 2 },
      right: { board: 1, fans: 0, squad: 0, TF: 0, D: 1, MP: 0, MM: 1, TT: -2 },
    },
  },

  winless_run: {
    scenarioId: 'cons_winless_run',
    scenario: "Five without a win. The local radio phone-in is doing a full hour on whether you're the right person for the job. The callers are not kind.",
    leftOption:  "Phone in live. Defend yourself.",
    rightOption: "Ignore it. Focus on training.",
    impactLeft:  { board: -3, fans: 12, squad: 5,  aggression: 0.08 },
    impactRight: { board: 5,  fans: -5, squad: 3,  aggression: -0.03 },
    imageCategory: 'press',
    isBreaking: false,
    gameCategory: 'press',
    psych: {
      left:  { board: 0, fans: 1, squad: 0, TF: 0, D: 0, MP: 2, MM: 0, TT: 1 },
      right: { board: 1, fans: -1, squad: 0, TF: 1, D: 1, MP: -1, MM: 1, TT: -1 },
    },
  },
};

// Extended input type that accepts active flags
export interface ScenarioInput extends AiScenarioPresentationInput {
  flags?: string[];
}

export function getLocalScenario(input: ScenarioInput): ScenarioResult {
  const globalHistory = loadHistory();
  const excluded = new Set([...globalHistory, ...input.excludedScenarioIds]);

  // ── Check for active flag consequence scenarios first ───────────────────────
  const flags = input.flags ?? [];
  for (const flag of flags) {
    const flagScenario = FLAG_SCENARIOS[flag];
    if (flagScenario && !excluded.has(flagScenario.scenarioId)) {
      markSeen(flagScenario.scenarioId);
      return { scenario: flagScenario, consumedFlag: flag };
    }
  }

  // ── Regular weighted pool ───────────────────────────────────────────────────
  let pool = ALL_SCENARIOS.filter(s => !excluded.has(s.scenarioId));

  // Pool exhausted → reset global history
  if (pool.length === 0) {
    saveHistory(new Set());
    pool = ALL_SCENARIOS;
  }

  // Contextual weighting: prefer scenarios relevant to current game state
  const weighted = pool.map(s => {
    let weight = 1;
    const { boardSupport, fanSupport, dressingRoom } = input;

    if (boardSupport < 0.35 && s.gameCategory === 'press')    weight += 3;
    if (fanSupport   < 0.35 && s.gameCategory === 'locker')   weight += 2;
    if (dressingRoom < 0.35 && s.gameCategory === 'training') weight += 3;
    if (s.isBreaking) weight += 1;

    return { scenario: s, weight };
  });

  // Weighted random pick
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let rand   = Math.random() * totalWeight;
  let picked = weighted[0].scenario;
  for (const { scenario, weight } of weighted) {
    rand -= weight;
    if (rand <= 0) { picked = scenario; break; }
  }

  markSeen(picked.scenarioId);
  return { scenario: picked };
}
