/**
 * Weekly Challenge — same mode/config for all players in a given ISO week.
 * Uses a seeded RNG so the challenge is deterministic per week.
 */

import type { CareerMode } from './game-logic';
import { CAREER_MODES } from './game-logic';

// Mulberry32 seeded PRNG — fast, good distribution
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** ISO week number (1–53) for a given date */
function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Integer seed for the current ISO week — unique per year+week */
export function getWeekSeed(): number {
  const now = new Date();
  return now.getFullYear() * 100 + isoWeekNumber(now);
}

export function getWeekLabel(): string {
  const now = new Date();
  const wk = isoWeekNumber(now);
  return `Week ${wk} · ${now.getFullYear()}`;
}

export type WeeklyChallengeConfig = {
  seed: number;
  weekLabel: string;
  mode: CareerMode;
  durationIndex: number;
  teamName: string;
};

const WEEKLY_TEAMS = [
  "Riverside Athletic", "Park Lane FC", "Northern Lights FC",
  "The Wanderers",      "Capital City FC", "Ironworks United",
  "Seaport Rangers",    "Valley Hawks FC",
];

/**
 * Generate this week's challenge config — deterministic for the whole week.
 * Every player sees the same mode, duration, and team.
 */
export function getWeeklyChallengeConfig(): WeeklyChallengeConfig {
  const seed = getWeekSeed();
  const rng  = mulberry32(seed);

  const modes: CareerMode[] = ['title', 'top4', 'season', 'relegation'];
  const mode          = modes[Math.floor(rng() * modes.length)];
  const durations     = CAREER_MODES[mode].durations;
  const durationIndex = Math.floor(rng() * durations.length);
  const teamName      = WEEKLY_TEAMS[Math.floor(rng() * WEEKLY_TEAMS.length)];

  return { seed, weekLabel: getWeekLabel(), mode, durationIndex, teamName };
}
