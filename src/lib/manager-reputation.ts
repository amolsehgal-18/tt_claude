/**
 * Persistent manager reputation — survives across seasons.
 * Stored in localStorage key 'tt_reputation_v1'.
 */

import type { GameState, CareerMode } from './game-logic';
import { CAREER_MODES } from './game-logic';

export type ManagerBadge =
  | 'champion'      // finished 1st
  | 'survivor'      // survived relegation battle
  | 'cl_boss'       // finished top 4
  | 'iron_gaffer'   // 10+ wins in a season
  | 'glass_jaw'     // sacked 3 times
  | 'consistent'    // 3 seasons without relegation
  | 'maverick';     // played every career mode

export type ManagerReputation = {
  managerName: string;
  totalSeasons: number;
  bestPosition: number;    // lower is better
  bestPoints: number;
  totalWins: number;
  totalLosses: number;
  timesGettingSacked: number;
  rating: number;          // 0–100
  lastArchetype: string | null;
  badges: ManagerBadge[];
  modesPlayed: CareerMode[];
};

const SAVE_KEY = 'tt_reputation_v1';

export function loadReputation(): ManagerReputation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as ManagerReputation) : null;
  } catch {
    return null;
  }
}

export function saveReputation(rep: ManagerReputation): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SAVE_KEY, JSON.stringify(rep));
}

export function createReputation(managerName: string): ManagerReputation {
  return {
    managerName,
    totalSeasons: 0,
    bestPosition: 20,
    bestPoints: 0,
    totalWins: 0,
    totalLosses: 0,
    timesGettingSacked: 0,
    rating: 30,
    lastArchetype: null,
    badges: [],
    modesPlayed: [],
  };
}

export function getRatingLabel(rating: number): string {
  if (rating >= 85) return 'Hall of Fame';
  if (rating >= 70) return 'Elite';
  if (rating >= 55) return 'Established';
  if (rating >= 40) return 'Journeyman';
  if (rating >= 25) return 'Up & Coming';
  return 'Sunday League';
}

export function getRatingColor(rating: number): string {
  if (rating >= 70) return '#FBB13C';
  if (rating >= 50) return '#73D2DE';
  if (rating >= 30) return 'rgba(255,255,255,0.6)';
  return '#8F2D56';
}

export function updateReputation(
  existing: ManagerReputation,
  state: GameState,
  archetype: string
): ManagerReputation {
  const config = CAREER_MODES[state.mode].durations[state.durationIndex];
  const objectiveMet = state.currentLeaguePosition <= config.target && !state.isSacked;
  const winRate = state.matchesPlayed > 0 ? state.wins / state.matchesPlayed : 0;

  // Rating delta
  let delta = 0;
  if (objectiveMet) delta += 6;
  else if (state.isSacked) delta -= 5;
  else delta -= 2;

  // Win rate bonus/penalty
  if (winRate >= 0.55) delta += 4;
  else if (winRate >= 0.40) delta += 1;
  else if (winRate < 0.25) delta -= 2;

  // Longevity: full-season modes are harder
  if (state.mode === 'season') delta += 1;

  const newRating = Math.max(5, Math.min(100, existing.rating + delta));

  // Badges
  const newBadges = [...existing.badges];
  const addBadge = (b: ManagerBadge) => { if (!newBadges.includes(b)) newBadges.push(b); };

  if (state.currentLeaguePosition === 1 && !state.isSacked) addBadge('champion');
  if (state.mode === 'relegation' && objectiveMet)           addBadge('survivor');
  if (state.mode === 'top4' && objectiveMet)                 addBadge('cl_boss');
  if (state.wins >= 10)                                      addBadge('iron_gaffer');
  if (state.isSacked) {
    const sackedCount = existing.timesGettingSacked + 1;
    if (sackedCount >= 3) addBadge('glass_jaw');
  }

  // Track modes
  const newModes = existing.modesPlayed.includes(state.mode)
    ? existing.modesPlayed
    : [...existing.modesPlayed, state.mode];
  if (newModes.length === 4) addBadge('maverick');

  // Consistent: 3 seasons with a top-half finish
  if (existing.totalSeasons >= 2 && state.currentLeaguePosition <= 10 && !state.isSacked) {
    addBadge('consistent');
  }

  return {
    ...existing,
    totalSeasons: existing.totalSeasons + 1,
    bestPosition: Math.min(existing.bestPosition, state.currentLeaguePosition),
    bestPoints: Math.max(existing.bestPoints, state.points),
    totalWins: existing.totalWins + state.wins,
    totalLosses: existing.totalLosses + state.losses,
    timesGettingSacked: existing.timesGettingSacked + (state.isSacked ? 1 : 0),
    rating: newRating,
    lastArchetype: archetype,
    badges: newBadges,
    modesPlayed: newModes,
  };
}

export const BADGE_LABELS: Record<ManagerBadge, { icon: string; label: string }> = {
  champion:    { icon: '🏆', label: 'Champion' },
  survivor:    { icon: '🛡️', label: 'Survivor' },
  cl_boss:     { icon: '⭐', label: 'CL Boss' },
  iron_gaffer: { icon: '⚙️', label: 'Iron Gaffer' },
  glass_jaw:   { icon: '💀', label: 'Glass Jaw' },
  consistent:  { icon: '📈', label: 'Consistent' },
  maverick:    { icon: '🔥', label: 'Maverick' },
};
