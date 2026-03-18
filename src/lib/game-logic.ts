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
// Returns an UPDATED copy of teamPoints after adding that GW's results.
export function simulateGameweek(
  gameId: string,
  gameweek: number,
  existingTeamPoints: Record<string, number>,
  nonUserTeams: string[],
): Record<string, number> {
  const rand = seededRand(stringToSeed(`${gameId}-gw${gameweek}`));
  const updated = { ...existingTeamPoints };
  // Pair teams for 9 fixtures; if odd count play one team twice (edge case)
  const paired = [...nonUserTeams];
  while (paired.length % 2 !== 0) paired.push(paired[0]);

  for (let i = 0; i < paired.length; i += 2) {
    const home = paired[i];
    const away = paired[i + 1];
    if (home === away) continue;
    // Win probability based on current position in table (approximated by PPG)
    const homePts = updated[home] ?? 0;
    const awayPts = updated[away] ?? 0;
    const homeAdvantage = 0.05;
    const totalPts = homePts + awayPts + 1;
    const homeWinProb = Math.min(0.70, Math.max(0.15, (homePts / totalPts) + homeAdvantage));
    const drawProb = 0.25;
    const roll = rand();
    if (roll < homeWinProb) {
      updated[home] = (updated[home] ?? 0) + 3;
    } else if (roll < homeWinProb + drawProb) {
      updated[home] = (updated[home] ?? 0) + 1;
      updated[away] = (updated[away] ?? 0) + 1;
    } else {
      updated[away] = (updated[away] ?? 0) + 3;
    }
  }
  return updated;
}

// Pre-seed team points for historical GWs before the user's career starts
function buildStartingTeamPoints(
  gameId: string,
  userTeam: string,
  startGW: number,
): Record<string, number> {
  const nonUserTeams = ALL_TEAMS
    .map(t => t === 'United FC' ? userTeam : t)
    .filter(t => t !== userTeam);

  // Seed initial points based on base position PPG up to GW 1
  let pts: Record<string, number> = {};
  for (let i = 0; i < nonUserTeams.length; i++) {
    const basePos = i < 10 ? i + 1 : i + 2; // skip slot 10 (user)
    pts[nonUserTeams[i]] = Math.max(0, Math.floor(getPPGForPosition(basePos) * (startGW - 1)));
  }

  // Apply simulated variance for each historical GW
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

  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const teamPoints = buildStartingTeamPoints(id, userTeam, config.startGW);

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
    wins: 0,
    draws: 0,
    losses: 0,
    points: startingPoints,
    isSacked: false,
    isSeasonEnd: false,
    history: [],
    momentumBuffer: [],
    teamPoints,
    flags: [],
    isWeeklyChallenge: false,
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
  // Try v8 first, then migrate v7 save
  const raw = localStorage.getItem(SAVE_KEY) ?? localStorage.getItem('tt_save_v7');
  try {
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    // Migration guards
    if (!Array.isArray(s.flags))          s.flags          = [];
    if (!Array.isArray(s.momentumBuffer)) s.momentumBuffer = [];
    if (!s.teamPoints || typeof s.teamPoints !== 'object') s.teamPoints = {};
    if (s.isWeeklyChallenge === undefined) s.isWeeklyChallenge = false;
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
