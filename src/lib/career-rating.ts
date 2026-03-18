const CAREER_KEY = 'tt_career_rating';

export type CareerRating = {
  rating: number;   // 0–100
  seasons: number;
  history: Array<{ delta: number; reason: string; ts: number }>;
};

export function loadCareerRating(): CareerRating {
  if (typeof window === 'undefined') return { rating: 50, seasons: 0, history: [] };
  try {
    const raw = localStorage.getItem(CAREER_KEY);
    if (raw) return JSON.parse(raw) as CareerRating;
  } catch { /* ignore */ }
  return { rating: 50, seasons: 0, history: [] };
}

export function saveCareerRating(rating: CareerRating): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(CAREER_KEY, JSON.stringify(rating)); } catch { /* ignore */ }
}

export function computeRatingDelta(params: {
  objectiveMet: boolean;
  isSacked: boolean;
  finalPosition: number;
  targetPosition: number;
  wins: number;
  matchesPlayed: number;
}): { delta: number; reason: string } {
  const { objectiveMet, isSacked, finalPosition, targetPosition, wins, matchesPlayed } = params;
  const winRate = matchesPlayed > 0 ? wins / matchesPlayed : 0;

  let delta = 0;
  let reason = '';

  if (isSacked && !objectiveMet) {
    delta = -15; reason = 'Sacked — objective missed';
  } else if (isSacked && objectiveMet) {
    delta = -5;  reason = 'Sacked despite objective met';
  } else if (objectiveMet) {
    const margin = targetPosition - finalPosition; // positive = overachieved
    delta = margin >= 3 ? 15 : 10;
    reason = margin >= 3 ? 'Overachieved objective' : 'Objective met';
  } else {
    const gap = finalPosition - targetPosition; // how far short
    delta = gap >= 3 ? -10 : -5;
    reason = 'Objective missed';
  }

  // Win rate bonus/penalty
  if (winRate >= 0.6) { delta += 3; reason += ' · Strong win rate'; }
  else if (winRate < 0.3 && matchesPlayed >= 3) { delta -= 3; reason += ' · Poor win rate'; }

  return { delta, reason };
}

export function applySeasonEnd(
  current: CareerRating,
  params: Parameters<typeof computeRatingDelta>[0],
): CareerRating {
  const { delta, reason } = computeRatingDelta(params);
  return {
    rating: Math.max(1, Math.min(99, current.rating + delta)),
    seasons: current.seasons + 1,
    history: [...current.history.slice(-19), { delta, reason, ts: Date.now() }],
  };
}
