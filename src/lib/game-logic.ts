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

// All 20 team names — "United FC" is the user's slot (index 10)
export const TEAM_NAMES = [
  "City", "Reds", "London Blue", "North White", "Villa",
  "Toffees", "Seagulls", "Eagles", "Wolves", "Hammers",
  "United FC", "Magpies", "Hornets", "Cherries", "Saints",
  "Forest", "Foxes", "Bees", "Clarets", "Hatters"
];

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
  // New fields
  momentum: number;             // 0–100: decision momentum going into each match
  flags: string[];              // active consequence flags
  teamPoints: Record<string, number>; // simulated points for all 20 teams
  isWeeklyChallenge?: boolean;  // playing the weekly challenge mode
  weeklySeed?: number;          // seed for the current weekly challenge
};

const getPPGForPosition = (pos: number): number => {
  if (pos === 1) return 2.45;
  if (pos === 2) return 2.20;
  if (pos <= 4) return 1.95;
  if (pos <= 6) return 1.70;
  if (pos <= 10) return 1.35;
  if (pos <= 17) return 1.05;
  return 0.75;
};

function initTeamPoints(startGW: number): Record<string, number> {
  const record: Record<string, number> = {};
  TEAM_NAMES.forEach((team, i) => {
    record[team] = Math.max(0, Math.floor(getPPGForPosition(i + 1) * (startGW - 1)));
  });
  return record;
}

export const INITIAL_STATE = (
  mode: CareerMode,
  durationIndex: number,
  managerName: string = "Gaffer",
  userTeam: string = "United FC",
  isWeeklyChallenge = false,
  weeklySeed?: number,
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

  const teamPoints = initTeamPoints(config.startGW);
  // Override the user's slot with their actual starting points
  teamPoints["United FC"] = startingPoints;

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
    momentum: 50,
    flags: [],
    teamPoints,
    isWeeklyChallenge,
    weeklySeed,
  };
};

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

/**
 * Calculate match result using:
 * - momentum (0–100): last 3 cards' combined impact
 * - opponent position: higher-ranked opponent = harder
 * - dressingRoom: squad morale
 */
export function calculateMatchResult(
  state: GameState,
  opponentPosition?: number
): 'win' | 'draw' | 'loss' {
  const momentum = state.momentum ?? 50;
  // Momentum converts to a ±0.20 swing on win probability
  const momentumFactor = ((momentum - 50) / 50) * 0.20;

  // Opponent difficulty: pos 1 = hardest (0.95), pos 20 = easiest (0.05)
  const oppPos = opponentPosition ?? 10;
  const oppStrength = (21 - oppPos) / 20;    // 0.05 to 1.0
  const oppPenalty = (oppStrength - 0.5) * 0.20; // -0.10 to +0.10 against the user

  const winProb = Math.max(0.05, Math.min(0.75,
    0.30 + momentumFactor + (state.dressingRoom * 0.15) - oppPenalty
  ));

  const roll = Math.random();
  if (roll < winProb) return 'win';
  if (roll < winProb + 0.25) return 'draw';
  return 'loss';
}

/**
 * Simulate all other league fixtures for this gameweek.
 * Returns updated teamPoints for non-user teams.
 */
export function simulateLeagueMatchday(state: GameState): Record<string, number> {
  const teamPoints = { ...state.teamPoints };
  // All teams except the user's slot
  const others = TEAM_NAMES.filter(t => t !== "United FC");

  // Simple shuffle for random pairings
  const shuffled = [...others];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  for (let i = 0; i + 1 < shuffled.length; i += 2) {
    const home = shuffled[i];
    const away = shuffled[i + 1];
    const homePts = teamPoints[home] ?? 0;
    const awayPts = teamPoints[away] ?? 0;
    const diff = (homePts - awayPts) / 100; // normalise

    const r = Math.random();
    const winThreshold = 0.38 + Math.max(-0.15, Math.min(0.15, diff));
    if (r < winThreshold) {
      teamPoints[home] += 3;
    } else if (r < winThreshold + 0.27) {
      teamPoints[home] += 1;
      teamPoints[away] += 1;
    } else {
      teamPoints[away] += 3;
    }
  }

  return teamPoints;
}

/**
 * Update momentum after a swipe decision.
 * impactSum = board + fans + squad delta values
 */
export function updateMomentum(currentMomentum: number, impactSum: number): number {
  // Scale: impactSum range is roughly -60 to +45 → maps to ±15 momentum
  const delta = Math.round(impactSum * 0.25);
  return Math.max(0, Math.min(100, currentMomentum + delta));
}

export function getLeagueTable(state: GameState): LeagueTeam[] {
  const modeConfig = CAREER_MODES[state.mode];
  const config = modeConfig.durations[state.durationIndex];
  const currentGW = (config.startGW - 1) + state.matchesPlayed;

  return TEAM_NAMES.map((originalName, i) => {
    const isUser = originalName === "United FC";
    const displayName = isUser ? state.userTeam : originalName;

    let teamPts: number;
    if (isUser) {
      teamPts = state.points;
    } else if (state.teamPoints?.[originalName] !== undefined) {
      teamPts = state.teamPoints[originalName];
    } else {
      teamPts = Math.floor(getPPGForPosition(i + 1) * currentGW);
    }

    return {
      pos: i + 1,
      team: displayName,
      gp: currentGW,
      pts: teamPts,
      isUser,
    };
  }).sort((a, b) => b.pts - a.pts).map((t, i) => ({ ...t, pos: i + 1 }));
}

export function saveGameLocally(state: GameState) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tt_save_v8', JSON.stringify(state));
  }
}

export function loadGameLocally(): GameState | null {
  if (typeof window !== 'undefined') {
    // Try v8 first, then fall back to v7 (old format) with defaults
    const saved8 = localStorage.getItem('tt_save_v8');
    if (saved8) {
      try {
        const state = JSON.parse(saved8) as GameState;
        return migrateState(state);
      } catch { return null; }
    }
    const saved7 = localStorage.getItem('tt_save_v7');
    if (saved7) {
      try {
        const state = JSON.parse(saved7) as GameState;
        return migrateState(state);
      } catch { return null; }
    }
  }
  return null;
}

/** Fill in any missing fields from older save formats */
function migrateState(state: GameState): GameState {
  const config = CAREER_MODES[state.mode]?.durations[state.durationIndex];
  return {
    ...state,
    momentum: state.momentum ?? 50,
    flags: state.flags ?? [],
    teamPoints: state.teamPoints ?? (config ? initTeamPoints(config.startGW) : {}),
  };
}
