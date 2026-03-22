/**
 * legacy.ts — Persistent career history across seasons.
 * Tracks milestones, season-by-season records, and computes carry-over
 * bonuses/penalties for the next season's starting stats.
 *
 * localStorage key: tt_legacy_v1
 */

const LEGACY_KEY = 'tt_legacy_v1';

export type SeasonRecord = {
  season:    number;   // 1-indexed
  archetype: string;
  position:  number;
  sacked:    boolean;
  wins:      number;
  draws:     number;
  losses:    number;
  points:    number;
  mode:      string;
  year:      number;   // calendar year
};

export type LegacyData = {
  totalSeasons:   number;
  totalDecisions: number;
  totalWins:      number;
  totalDraws:     number;
  totalLosses:    number;
  titles:         number;   // seasons finishing 1st
  topFours:       number;   // seasons finishing top 4
  bestFinish:     number;   // lowest position ever (1 = best)
  history:        SeasonRecord[];  // last 10 seasons, newest last
};

const DEFAULT_LEGACY: LegacyData = {
  totalSeasons:   0,
  totalDecisions: 0,
  totalWins:      0,
  totalDraws:     0,
  totalLosses:    0,
  titles:         0,
  topFours:       0,
  bestFinish:     20,
  history:        [],
};

export function loadLegacy(): LegacyData {
  if (typeof window === 'undefined') return { ...DEFAULT_LEGACY };
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return { ...DEFAULT_LEGACY };
    return { ...DEFAULT_LEGACY, ...JSON.parse(raw) as LegacyData };
  } catch {
    return { ...DEFAULT_LEGACY };
  }
}

export function saveLegacy(data: LegacyData): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(LEGACY_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

/** Call at the end of every season (before onRestart). */
export function recordSeasonEnd(
  current:              LegacyData,
  season:               SeasonRecord,
  decisionsThisSeason:  number,
): LegacyData {
  const updated: LegacyData = {
    totalSeasons:   current.totalSeasons + 1,
    totalDecisions: current.totalDecisions + decisionsThisSeason,
    totalWins:      current.totalWins  + season.wins,
    totalDraws:     current.totalDraws + season.draws,
    totalLosses:    current.totalLosses + season.losses,
    titles:         current.titles   + (season.position === 1 && !season.sacked ? 1 : 0),
    topFours:       current.topFours + (season.position <= 4 && !season.sacked ? 1 : 0),
    bestFinish:     Math.min(current.bestFinish, season.sacked ? current.bestFinish : season.position),
    history:        [...current.history.slice(-9), season],  // keep last 10
  };
  return updated;
}

/** Increments decision counter without touching season records. */
export function incrementDecisions(current: LegacyData, count = 1): LegacyData {
  return { ...current, totalDecisions: current.totalDecisions + count };
}

// ── Carry-over bonuses/penalties ─────────────────────────────────────────────

export type CarryOver = {
  boardBonus:  number;  // added to 65 base
  fanBonus:    number;  // added to 55 base
  squadBonus:  number;  // added to 70 base
  reason:      string | null;
};

/**
 * Returns stat adjustments for the next season based on the previous one.
 * All values are clamped in INITIAL_STATE (caller handles final clamp).
 */
export function computeCarryOver(legacy: LegacyData): CarryOver {
  const last = legacy.history[legacy.history.length - 1];
  if (!last) return { boardBonus: 0, fanBonus: 0, squadBonus: 0, reason: null };

  let b = 0, f = 0, s = 0;
  const reasons: string[] = [];

  // Sacked: board and fans start suspicious
  if (last.sacked) {
    b -= 10; f -= 10; s -= 5;
    reasons.push('New club recovering from previous sacking');
  } else if (last.position === 1) {
    // Title winner: hero status
    b += 15; f += 20; s += 10;
    reasons.push('Title-winning pedigree — the club is buzzing');
  } else if (last.position <= 4) {
    b += 10; f += 15; s += 5;
    reasons.push('Champions League finish — expectations are high');
  } else if (last.position >= 18) {
    // Relegated or near-miss: fragile trust
    b -= 5; f -= 5; s -= 5;
    reasons.push('Hangover from a difficult previous season');
  }

  // Win-rate bonus
  const totalGames = last.wins + last.draws + last.losses;
  if (totalGames > 0) {
    const wr = last.wins / totalGames;
    if (wr >= 0.6) {
      b += 5; f += 5;
      reasons.push('Strong win rate carries prestige');
    } else if (wr < 0.3) {
      b -= 5; f -= 3;
      reasons.push('Poor win rate dents reputation');
    }
  }

  return {
    boardBonus: b,
    fanBonus:   f,
    squadBonus: s,
    reason:     reasons.length ? reasons.join(' · ') : null,
  };
}

// ── Display helpers ───────────────────────────────────────────────────────────

export function legacyWinRate(legacy: LegacyData): number {
  const total = legacy.totalWins + legacy.totalDraws + legacy.totalLosses;
  return total > 0 ? Math.round((legacy.totalWins / total) * 100) : 0;
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
