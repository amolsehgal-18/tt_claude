export type CareerMode = 'title' | 'top4' | 'relegation' | 'season';

export interface CareerConfig {
  id: CareerMode;
  name: string;
  description: string;
  durations: { label: string; matches: number; target: number; startGW: number }[];
}

export const CAREER_MODES: Record<CareerMode, CareerConfig> = {
  title: {
    id: 'title',
    name: "League Title",
    description: "Win the league or you're out. Zero tolerance.",
    durations: [
      { label: "Final Push (6)", matches: 6, target: 1, startGW: 33 },
      { label: "Title Charge (8)", matches: 8, target: 1, startGW: 31 },
      { label: "Title Race (10)", matches: 10, target: 1, startGW: 29 }
    ]
  },
  top4: {
    id: 'top4',
    name: "Top 4 $$",
    description: "Champions League qualification is the only goal.",
    durations: [
      { label: "Final Stretch (6)", matches: 6, target: 4, startGW: 33 },
      { label: "Race for CL (8)", matches: 8, target: 4, startGW: 31 },
      { label: "Euro Hunt (10)", matches: 10, target: 4, startGW: 29 }
    ]
  },
  relegation: {
    id: 'relegation',
    name: "Relegation Battle",
    description: "Keep them up by any means necessary.",
    durations: [
      { label: "Great Escape (6)", matches: 6, target: 17, startGW: 33 },
      { label: "Survival Run (8)", matches: 8, target: 17, startGW: 31 },
      { label: "The Fight (10)", matches: 10, target: 17, startGW: 29 }
    ]
  },
  season: {
    id: 'season',
    name: "Full Season",
    description: "Classic managerial campaign.",
    durations: [
      { label: "Half Season (19)", matches: 19, target: 10, startGW: 20 },
      { label: "Full 38 Games", matches: 38, target: 10, startGW: 1 }
    ]
  },
};

export type LeagueTeam = {
  pos: number;
  team: string;
  gp: number;
  pts: number;
  isUser: boolean;
};

export interface LastDecision {
  scenario: string;      // truncated scenario text
  chosenOption: string;  // the option text the user picked
  impact: { board: number; fans: number; squad: number };
}

export type GameState = {
  id: string;
  managerName: string;
  userTeam: string;
  mode: CareerMode;
  durationIndex: number;
  boardSupport: number;
  fanSupport: number;
  dressingRoom: number;
  aggression: number;
  currentLeaguePosition: number;
  cardsSeen: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  isSacked: boolean;
  isSeasonEnd: boolean;
  history: string[];
  // ── New fields ──────────────────────────────────────────────────────────
  momentumBuffer: number[];          // last 3 card net impacts (-30..+30)
  teamPoints: Record<string, number>; // simulated points for all non-user teams
  flags: string[];                   // active consequence flags
  isWeeklyChallenge: boolean;
  weekKey?: string;
  varCardsLeft: number;
};

// ── All 20 league teams (slot 10 is replaced by userTeam at runtime) ─────────
export const ALL_TEAMS = [
  "City", "Reds", "London Blue", "North White", "Villa",
  "Toffees", "Seagulls", "Eagles", "Wolves", "Hammers",
  "United FC", "Magpies", "Hornets", "Cherries", "Saints",
  "Forest", "Foxes", "Bees", "Clarets", "Hatters",
];

// ── Seeded PRNG (mulberry32) ──────────────────────────────────────────────────
export function seededRand(seed: number): () => number {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function stringToSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

const getPPGForPosition = (pos: number): number => {
  if (pos === 1)  return 2.45;
  if (pos === 2)  return 2.20;
  if (pos <= 4)   return 1.95;
  if (pos <= 6)   return 1.70;
  if (pos <= 10)  return 1.35;
  if (pos <= 17)  return 1.05;
  return 0.75;
};

// ── Simulate a single gameweek for non-user teams ────────────────────────────
// Each team gets an independent seeded result based on their league position PPG.
// No pairing — avoids double-counting and edge-case issues with odd team counts.
export function simulateGameweek(
  gameId: string,
  gameweek: number,
  existingTeamPoints: Record<string, number>,
  nonUserTeams: string[],
): Record<string, number> {
  const rand = seededRand(stringToSeed(`${gameId}-gw${gameweek}`));
  const updated = { ...existingTeamPoints };

  nonUserTeams.forEach((team, idx) => {
    // Base position in the full 20-team league (user occupies slot 11)
    const basePos = idx < 10 ? idx + 1 : idx + 2;
    const ppg = getPPGForPosition(basePos);
    const roll = rand();
    let gwPts: number;
    if      (ppg >= 2.20) gwPts = roll < 0.60 ? 3 : roll < 0.82 ? 1 : 0; // top 2
    else if (ppg >= 1.95) gwPts = roll < 0.48 ? 3 : roll < 0.73 ? 1 : 0; // 3-4
    else if (ppg >= 1.70) gwPts = roll < 0.38 ? 3 : roll < 0.65 ? 1 : 0; // 5-6
    else if (ppg >= 1.35) gwPts = roll < 0.28 ? 3 : roll < 0.56 ? 1 : 0; // 7-10
    else if (ppg >= 1.05) gwPts = roll < 0.18 ? 3 : roll < 0.48 ? 1 : 0; // 11-17
    else                  gwPts = roll < 0.10 ? 3 : roll < 0.38 ? 1 : 0; // 18-20
    updated[team] = (updated[team] ?? 0) + gwPts;
  });

  return updated;
}

// Build starting team points from scratch using simulation only (no PPG seeding).
// Called at INITIAL_STATE creation and during migration of old saves.
export function buildStartingTeamPoints(
  gameId: string,
  userTeam: string,
  startGW: number,
): Record<string, number> {
  const nonUserTeams = ALL_TEAMS
    .map(t => t === 'United FC' ? userTeam : t)
    .filter(t => t !== userTeam);

  let pts: Record<string, number> = {};
  for (let gw = 1; gw < startGW; gw++) {
    pts = simulateGameweek(gameId, gw, pts, nonUserTeams);
  }
  return pts;
}

// ── Consequence flag computation ─────────────────────────────────────────────
export function computeFlags(
  newState: GameState,
  recentImpacts: Array<{ board: number; fans: number; squad: number }>,
): string[] {
  const flags: string[] = [];
  const last3 = recentImpacts.slice(-3);

  // squad_unrest: last 3 decisions all had negative squad impact
  if (last3.length >= 3 && last3.every(r => r.squad < 0)) flags.push('squad_unrest');

  // hot_streak: last 3 decisions all had positive net impact
  if (last3.length >= 3 && last3.every(r => (r.board + r.fans + r.squad) > 0)) flags.push('hot_streak');

  // board_pressure: board support critically low
  if (newState.boardSupport < 0.25) flags.push('board_pressure');

  // fan_revolt: fan support critically low
  if (newState.fanSupport < 0.3) flags.push('fan_revolt');

  // on_the_brink: any support near sack threshold
  if (newState.boardSupport < 0.15 || newState.fanSupport < 0.15) flags.push('on_the_brink');

  // title_charge: top 3 with some matches played
  if (newState.currentLeaguePosition <= 3 && newState.matchesPlayed >= 2) flags.push('title_charge');

  // relegation_zone
  if (newState.currentLeaguePosition >= 18) flags.push('relegation_zone');

  // crisis_mode: all three supports low
  if (newState.boardSupport < 0.3 && newState.fanSupport < 0.3 && newState.dressingRoom < 0.3) flags.push('crisis_mode');

  // squad_harmony: dressing room very high
  if (newState.dressingRoom > 0.75) flags.push('squad_harmony');

  return flags;
}

// ── Win probability (no randomness — used for UI display) ────────────────────
export function getMomentumWinChance(state: GameState, opponentPosition: number): number {
  const buf = state.momentumBuffer.slice(-3);
  const avgMomentum = buf.length > 0 ? buf.reduce((a, b) => a + b, 0) / buf.length : 0;
  const momentumBonus = Math.max(-0.15, Math.min(0.15, avgMomentum / 100));
  const opponentFactor = (opponentPosition - 1) / 19;
  const opponentBonus = (opponentFactor - 0.5) * 0.20;
  const aggressionPenalty = Math.abs(0.5 - state.aggression) * 0.5;
  const aggressionFactor = (1 - aggressionPenalty) * 0.15;
  const winProb = 0.30 + aggressionFactor + (state.dressingRoom * 0.15) + momentumBonus + opponentBonus;
  return Math.round(Math.max(5, Math.min(75, winProb * 100)));
}

export const INITIAL_STATE = (
  mode: CareerMode,
  durationIndex: number,
  managerName: string = "Gaffer",
  userTeam: string = "United FC"
): GameState => {
  const config = CAREER_MODES[mode].durations[durationIndex];

  let startPos = 10;
  if (mode === 'title') startPos = 2;
  else if (mode === 'top4') startPos = 5;
  else if (mode === 'relegation') startPos = 18;

  const startGW = config.startGW - 1;
  const startingPoints = Math.max(0, Math.floor(getPPGForPosition(startPos) * startGW));

  // Derive historical W/D/L consistent with startingPoints and startGW games played
  // Use ~22% draw rate as baseline, then adjust draws to make points add up exactly
  const histDraws  = Math.round(startGW * 0.22);
  const histWins   = Math.floor((startingPoints - histDraws) / 3);
  const adjDraws   = Math.max(0, startingPoints - histWins * 3); // exact remainder as draws
  const histLosses = Math.max(0, startGW - histWins - adjDraws);

  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const teamPoints = buildStartingTeamPoints(id, userTeam, config.startGW);

  // VAR cards: 2 for 6 matches, 3 for 8, 4 for 10, 5 for 19, 6 for 38
  const varCardsLeft = config.matches <= 6 ? 2
    : config.matches <= 8  ? 3
    : config.matches <= 10 ? 4
    : config.matches <= 19 ? 5
    : 6;

  return {
    id,
    managerName,
    userTeam,
    mode,
    durationIndex,
    boardSupport: 0.5,
    fanSupport: 0.5,
    dressingRoom: 0.5,
    aggression: 0.3,
    currentLeaguePosition: startPos,
    cardsSeen: 0,
    matchesPlayed: 0,
    wins: histWins,
    draws: adjDraws,
    losses: histLosses,
    points: startingPoints,
    isSacked: false,
    isSeasonEnd: false,
    history: [],
    momentumBuffer: [],
    teamPoints,
    flags: [],
    isWeeklyChallenge: false,
    varCardsLeft,
  };
};

// ── Weekly challenge ──────────────────────────────────────────────────────────
export function getWeekKey(date: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(
    ((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7,
  );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export function WEEKLY_CHALLENGE_STATE(
  managerName: string,
  userTeam: string,
): GameState {
  const weekKey = getWeekKey();
  const base = INITIAL_STATE('top4', 1, managerName, userTeam);
  return {
    ...base,
    id: weekKey,
    isWeeklyChallenge: true,
    weekKey,
  };
}

export type ManagerMood = 'happy' | 'neutral' | 'stressed' | 'angry' | 'sacked';

export function calculateMood(state: GameState): ManagerMood {
  if (state.isSacked) return 'sacked';
  const avgSupport = (state.boardSupport + state.fanSupport) / 2;
  if (avgSupport >= 0.7) return 'happy';
  if (avgSupport >= 0.5) return 'neutral';
  if (avgSupport >= 0.3) return 'stressed';
  return 'angry';
}

export function getMatchOdds(aggression: number) {
  const win = (0.35 + (0.15 * (1 - Math.abs(0.5 - aggression) * 2))).toFixed(2);
  const draw = "0.25";
  const loss = (1 - parseFloat(win) - 0.25).toFixed(2);
  return { win, draw, loss };
}

// ── Match result: momentum + opponent strength ─────────────────────────────
export function calculateMatchResult(
  state: GameState,
  opponentPosition: number = 10,
): 'win' | 'draw' | 'loss' {
  const buf = state.momentumBuffer.slice(-3);
  const avgMomentum = buf.length > 0 ? buf.reduce((a, b) => a + b, 0) / buf.length : 0;
  const momentumBonus = Math.max(-0.15, Math.min(0.15, avgMomentum / 100));
  const opponentFactor = (opponentPosition - 1) / 19;
  const opponentBonus = (opponentFactor - 0.5) * 0.20;
  const aggressionPenalty = Math.abs(0.5 - state.aggression) * 0.5;
  const aggressionFactor = (1 - aggressionPenalty) * 0.15;
  const winProb = Math.max(0.05, Math.min(0.75,
    0.30 + aggressionFactor + (state.dressingRoom * 0.15) + momentumBonus + opponentBonus,
  ));

  const roll = Math.random();
  if (roll < winProb) return 'win';
  if (roll < winProb + 0.25) return 'draw';
  return 'loss';
}

export function getLeagueTable(state: GameState): LeagueTeam[] {
  const config = CAREER_MODES[state.mode].durations[state.durationIndex];
  const teams = ALL_TEAMS.map(t => t === 'United FC' ? state.userTeam : t);
  const currentGW = (config.startGW - 1) + state.matchesPlayed;

  return teams.map((team, i) => {
    const isUser = team === state.userTeam;
    let teamPts: number;
    if (isUser) {
      teamPts = state.points;
    } else if (state.teamPoints && state.teamPoints[team] !== undefined) {
      teamPts = state.teamPoints[team];
    } else {
      // Fallback: PPG estimate for teams not yet simulated
      teamPts = Math.floor(getPPGForPosition(i + 1) * currentGW);
    }
    return { pos: i + 1, team, gp: currentGW, pts: teamPts, isUser };
  })
  .sort((a, b) => b.pts - a.pts)
  .map((t, i) => ({ ...t, pos: i + 1 }));
}

// ── Manager profile (persists name/team across seasons, 7-day name lock) ─────
const MANAGER_PROFILE_KEY = 'tt_manager_v1';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export type ManagerProfile = {
  name: string;
  team: string;
  nameChangedAt: number; // timestamp ms
  kitPrimary:   string;  // user team colour, default '#3b82f6'
  kitSecondary: string;  // opponent colour,  default '#ef4444'
};

export function loadManagerProfile(): ManagerProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(MANAGER_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveManagerProfile(p: ManagerProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MANAGER_PROFILE_KEY, JSON.stringify(p));
}

export function isNameLocked(profile: ManagerProfile | null): boolean {
  if (!profile) return false;
  return (Date.now() - profile.nameChangedAt) < SEVEN_DAYS_MS;
}

export function nameLockDaysRemaining(profile: ManagerProfile | null): number {
  if (!profile) return 0;
  const elapsed = Date.now() - profile.nameChangedAt;
  return Math.max(0, Math.ceil((SEVEN_DAYS_MS - elapsed) / 86400000));
}

// ── Persistence (v8 — adds momentumBuffer, teamPoints, flags, weekly fields) ─
const SAVE_KEY = 'tt_save_v8';
const WEEKLY_SAVE_KEY = 'tt_weekly_v1';

export function saveGameLocally(state: GameState) {
  if (typeof window === 'undefined') return;
  const key = state.isWeeklyChallenge ? WEEKLY_SAVE_KEY : SAVE_KEY;
  localStorage.setItem(key, JSON.stringify(state));
}

export function loadGameLocally(): GameState | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SAVE_KEY) ?? localStorage.getItem('tt_save_v7');
  try {
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    // Migration guards
    if (!Array.isArray(s.flags))          s.flags          = [];
    if (!Array.isArray(s.momentumBuffer)) s.momentumBuffer = [];
    if (s.isWeeklyChallenge === undefined) s.isWeeklyChallenge = false;
    if (s.varCardsLeft === undefined) {
      const cfg = CAREER_MODES[s.mode]?.durations[s.durationIndex];
      const m = cfg?.matches ?? 6;
      s.varCardsLeft = m <= 6 ? 2 : m <= 8 ? 3 : m <= 10 ? 4 : m <= 19 ? 5 : 6;
    }
    // Rebuild W/D/L if they don't match total games played (old save migration)
    const config = CAREER_MODES[s.mode]?.durations[s.durationIndex];
    const totalGW2 = (config?.startGW ?? 1) - 1 + s.matchesPlayed;
    const recordTotal = s.wins + s.draws + s.losses;
    if (totalGW2 > 3 && recordTotal < totalGW2 * 0.5) {
      // Derive from points: use same formula as INITIAL_STATE
      const hDraws  = Math.round(totalGW2 * 0.22);
      const hWins   = Math.floor((s.points - hDraws) / 3);
      const hAdj    = Math.max(0, s.points - hWins * 3);
      s.wins   = hWins;
      s.draws  = hAdj;
      s.losses = Math.max(0, totalGW2 - hWins - hAdj);
    }
    // Rebuild teamPoints if missing, empty, or clearly wrong (old save migration)
    const totalGW = totalGW2;
    const maxTeamPts = s.teamPoints ? Math.max(0, ...Object.values(s.teamPoints)) : 0;
    const teamPointsCorrupt = !s.teamPoints
      || typeof s.teamPoints !== 'object'
      || Object.keys(s.teamPoints).length === 0
      || (totalGW > 3 && maxTeamPts < totalGW * 0.8); // detect obviously wrong values
    if (teamPointsCorrupt) {
      s.teamPoints = buildStartingTeamPoints(s.id, s.userTeam, totalGW + 1);
    }
    return s;
  } catch {
    return null;
  }
}

export function loadWeeklySave(): GameState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(WEEKLY_SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    // Only return if it's the current week
    if (s.weekKey !== getWeekKey()) return null;
    return s;
  } catch {
    return null;
  }
}

// ── Match verdict — 20 contextual explanations ───────────────────────────────
export function getMatchVerdict(
  result: 'win' | 'draw' | 'loss',
  state: GameState,
  lastDecisions: LastDecision[],
): string {
  const totB = lastDecisions.reduce((s, d) => s + d.impact.board, 0);
  const totF = lastDecisions.reduce((s, d) => s + d.impact.fans, 0);
  const totS = lastDecisions.reduce((s, d) => s + d.impact.squad, 0);
  const mb   = (state.momentumBuffer ?? []).slice(-3);
  const avgM = mb.length ? mb.reduce((a, b) => a + b, 0) / mb.length : 0;

  if (result === 'win') {
    if (totS >= 8)                   return "A tight dressing room transmits itself onto the pitch. The squad was unified and it showed.";
    if (totB >= 8)                   return "The board's confidence filtered down. Players perform differently when they trust the hierarchy above them.";
    if (totF >= 8)                   return "The crowd bought in. Three points for the faithful who never stopped believing.";
    if (avgM >= 4)                   return "Three consecutive positive decisions. The momentum was always going to tell. Clinical.";
    if (state.dressingRoom > 0.72)   return "A harmonious dressing room is a winning dressing room. The evidence was there for ninety minutes.";
    if (state.boardSupport > 0.72)   return "Boardroom security breeds on-pitch confidence. The players felt it. So did the opposition.";
    if (state.fanSupport > 0.72)     return "The fans carried the team when the legs grew heavy. That home crowd was worth a goal start.";
    if (state.currentLeaguePosition <= 3) return "The table leaders don't lose focus. This result came from a week of correct decisions.";
    return "Not pretty. Not convincing. But the points are in the bag and that's all that matters right now.";
  }

  if (result === 'draw') {
    if (totS <= -8)                  return "Dressing room friction crept into the performance. A point shared — but also a point dropped.";
    if (totB <= -8)                  return "The board's frustration must have been felt in the dressing room. The players looked uncertain of their brief.";
    if (totF <= -8)                  return "A restless crowd is a distracted crowd. The performance reflected the tension in the stands tonight.";
    if (avgM <= -3)                  return "Three consecutive poor decisions drained the momentum. A draw was the best available outcome.";
    if (state.dressingRoom < 0.35)   return "When the squad stops believing in the process, results like this follow. One point. Must do better.";
    if (state.boardSupport < 0.30)   return "The board's lack of support to the manager must have played through the players' minds tonight.";
    if (state.currentLeaguePosition >= 15) return "A point in the context of a relegation battle has its value. But the gap hasn't changed. Keep going.";
    return "Honours even. Both sides cancelled each other out on an evening where composure was everything.";
  }

  // Loss
  if (totS <= -10)                 return "The dressing room was fractured before kick-off. You cannot hide that on a football pitch. Not at this level.";
  if (totB <= -10)                 return "An unsettled boardroom creates an unsettled squad. The defeat was written in the week's decisions.";
  if (totF <= -10)                 return "When the fans turn, the weight of it falls on every player's shoulders. They couldn't handle it tonight.";
  if (avgM <= -4)                  return "Three decisions that hurt. Each one compounded the last. The team had nothing left to give by the end.";
  if (state.fanSupport < 0.20)     return "The fans had already checked out before kick-off. On nights like this, that silence is absolutely deafening.";
  if (state.boardSupport < 0.20)   return "A manager on the brink manages differently. The players sensed it. So did the opposition's analysts.";
  if (state.dressingRoom < 0.25)   return "A dressing room at war with itself produces exactly this kind of performance. Individual errors. No cover.";
  return "Outclassed, outfought, and out-managed on the day. Sometimes the other team is simply better. Regroup.";
}
