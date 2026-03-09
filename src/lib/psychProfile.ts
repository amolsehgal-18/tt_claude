/**
 * @fileOverview PsychProfile accumulator + archetype engine for Touchline Tantrum.
 *
 * Tracks hidden psychology axes across a full season of swipes,
 * derives the manager archetype at season end, and builds the
 * Claude AI verdict prompt.
 */

import type { PsychDelta } from './game-scenarios';

// ─── Types ──────────────────────────────────────────────────────────────────

export type Archetype =
  | 'The Father Figure'
  | 'The Hairdryer'
  | 'The Tactician'
  | 'The Showman'
  | 'The Politician'
  | 'The Maverick'
  | 'The Pragmatist'; // fallback

export type PsychProfile = {
  // Tension triangle — mirrors visible game stats (0–100, starts at 50)
  board: number;
  fans:  number;
  squad: number;
  // Hidden OCEAN-equivalent axes (0–100, starts at 50)
  TF: number; // Tactical Flexibility  — high = experimental/adaptive, low = rigid/safe
  D:  number; // Discipline            — high = structured/rules-based, low = loose/reactive
  MP: number; // Media Presence        — high = public-facing/press-savvy, low = private/withdrawn
  MM: number; // Man Management        — high = empathetic/player-first, low = ruthless/cold
  TT: number; // Touchline Temper      — high = volatile/emotional, low = composed/ice-cold
  // Tracking
  swipeCount: number;
  archetypeSignals: Record<Archetype, number>; // running tally per archetype
};

/** The per-swipe delta that applySwipe receives (from psych field or inferred) */
export type SwipeImpact = {
  board: number; fans: number; squad: number;
  TF: number; D: number; MP: number; MM: number; TT: number;
};

// ─── Constants ───────────────────────────────────────────────────────────────

/** Multiplier: each psych delta unit moves a profile axis by this many points */
const DELTA_SCALE = 4; // ±2 delta → ±8 pts per swipe on 0-100 scale

/** Archetype centroids on all axes (0–100 space) */
const ARCHETYPE_CENTROIDS: Record<Archetype, Omit<SwipeImpact, never> & { board: number; fans: number; squad: number }> = {
  'The Hairdryer':     { board: 65, fans: 35, squad: 30, TF: 40, D: 70, MP: 40, MM: 30, TT: 70 },
  'The Father Figure': { board: 35, fans: 65, squad: 70, TF: 50, D: 40, MP: 65, MM: 75, TT: 25 },
  'The Tactician':     { board: 50, fans: 45, squad: 55, TF: 70, D: 70, MP: 30, MM: 50, TT: 35 },
  'The Showman':       { board: 35, fans: 70, squad: 45, TF: 65, D: 30, MP: 75, MM: 50, TT: 55 },
  'The Politician':    { board: 70, fans: 35, squad: 50, TF: 30, D: 68, MP: 40, MM: 60, TT: 30 },
  'The Maverick':      { board: 40, fans: 40, squad: 40, TF: 68, D: 28, MP: 50, MM: 40, TT: 68 },
  'The Pragmatist':    { board: 50, fans: 50, squad: 50, TF: 50, D: 50, MP: 50, MM: 50, TT: 50 },
};

const ALL_ARCHETYPES = Object.keys(ARCHETYPE_CENTROIDS) as Archetype[];

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createInitialProfile(): PsychProfile {
  const signals = {} as Record<Archetype, number>;
  ALL_ARCHETYPES.forEach(a => { signals[a] = 0; });
  return {
    board: 50, fans: 50, squad: 50,
    TF: 50, D: 50, MP: 50, MM: 50, TT: 50,
    swipeCount: 0,
    archetypeSignals: signals,
  };
}

// ─── Core: applySwipe ────────────────────────────────────────────────────────

/**
 * Applies one swipe's psych delta to the profile.
 * Pure function — returns a NEW profile, never mutates.
 *
 * @param profile  Current season profile
 * @param delta    PsychDelta from scenario.psych[direction], or inferred from impact
 * @returns        Updated profile
 */
export function applySwipe(profile: PsychProfile, delta: SwipeImpact): PsychProfile {
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  const scale = (d: number) => d * DELTA_SCALE;

  const updated: PsychProfile = {
    board: clamp(profile.board + scale(delta.board)),
    fans:  clamp(profile.fans  + scale(delta.fans)),
    squad: clamp(profile.squad + scale(delta.squad)),
    TF:    clamp(profile.TF    + scale(delta.TF)),
    D:     clamp(profile.D     + scale(delta.D)),
    MP:    clamp(profile.MP    + scale(delta.MP)),
    MM:    clamp(profile.MM    + scale(delta.MM)),
    TT:    clamp(profile.TT    + scale(delta.TT)),
    swipeCount: profile.swipeCount + 1,
    archetypeSignals: { ...profile.archetypeSignals },
  };

  // Score which archetype this choice signals
  const signalled = scoreArchetypeSignal(delta);
  updated.archetypeSignals[signalled] = (updated.archetypeSignals[signalled] ?? 0) + 1;

  return updated;
}

/**
 * Infers a SwipeImpact from raw AI impact numbers when explicit psych isn't available.
 * Used for AI-generated scenarios that don't have a psych field.
 */
export function inferDeltaFromImpact(impact: {
  board: number; fans: number; squad: number; aggression: number;
}): SwipeImpact {
  const clamp2 = (v: number) => Math.max(-2, Math.min(2, Math.round(v)));
  const b = clamp2(impact.board / 8);
  const f = clamp2(impact.fans  / 8);
  const s = clamp2(impact.squad / 8);
  const agg = impact.aggression;

  return {
    board: b,
    fans:  f,
    squad: s,
    // High aggression → TF (experimental, adaptive)
    TF: agg > 0.07 ? 1 : agg < -0.07 ? -1 : 0,
    // Board-positive + squad-negative → Disciplinarian
    D: (b > 0 && s < 0) ? 1 : (b < 0 && s > 0) ? -1 : 0,
    // Fan-positive → Media presence
    MP: f > 0 ? 1 : f < 0 ? -1 : 0,
    // Squad-positive → Man management
    MM: s > 0 ? 1 : s < 0 ? -1 : 0,
    // High absolute aggression → Touchline temper
    TT: Math.abs(agg) > 0.1 ? (agg > 0 ? 1 : -1) : 0,
  };
}

// ─── Archetype signal scoring ─────────────────────────────────────────────────

/**
 * Given a single psych delta, score it against each archetype's
 * key axes and return the best match.
 */
function scoreArchetypeSignal(delta: SwipeImpact): Archetype {
  const scores: Record<Archetype, number> = {
    'The Hairdryer':     Number(delta.MM < 0) + Number(delta.TT > 0) + Number(delta.D > 0) + Number(delta.board > 0),
    'The Father Figure': Number(delta.MM > 0) + Number(delta.TT < 0) + Number(delta.MP > 0) + Number(delta.squad > 0),
    'The Tactician':     Number(delta.TF > 0) + Number(delta.D  > 0) + Number(delta.MP < 0),
    'The Showman':       Number(delta.MP > 0) + Number(delta.TF > 0) + Number(delta.D  < 0) + Number(delta.fans > 0),
    'The Politician':    Number(delta.TF < 0) + Number(delta.D  > 0) + Number(delta.board > 0),
    'The Maverick':      Number(delta.TF > 0) + Number(delta.TT > 0) + Number(delta.D  < 0),
    'The Pragmatist':    0,
  };

  const sorted = (Object.entries(scores) as [Archetype, number][]).sort((a, b) => b[1] - a[1]);

  // Tie: both top scorers equal → pragmatist
  if (sorted[0][1] === sorted[1][1] && sorted[0][1] <= 1) return 'The Pragmatist';

  return sorted[0][0];
}

// ─── deriveArchetype ─────────────────────────────────────────────────────────

/**
 * Derives the season archetype from the final PsychProfile.
 * Uses threshold rules → signal tiebreak → Euclidean distance fallback.
 */
export function deriveArchetype(profile: PsychProfile): Archetype {
  const { board, fans: _fans, squad: _squad, TF, D, MP, MM, TT } = profile;

  // Primary threshold rules (spec-defined)
  if (MM >= 65 && TT <= 35 && MP >= 60)           return 'The Father Figure';
  if (TT >= 65 && MM <= 35 && D  >= 60)           return 'The Hairdryer';
  if (TF >= 65 && D  >= 65 && MP <= 40)           return 'The Tactician';
  if (MP >= 65 && TF >= 60 && D  <= 40)           return 'The Showman';
  if (D  >= 65 && board >= 65 && TF <= 40)        return 'The Politician';
  if (TF >= 60 && TT >= 60 && D  <= 40)           return 'The Maverick';

  // Tiebreak 1: highest archetypeSignals count (excluding Pragmatist)
  const signals = { ...profile.archetypeSignals };
  delete (signals as Partial<typeof signals>)['The Pragmatist'];
  const signalWinner = (Object.entries(signals) as [Archetype, number][])
    .sort((a, b) => b[1] - a[1])[0];

  if (signalWinner && signalWinner[1] > 0) {
    // If top signal is clearly dominant (>20% more than #2), use it
    const entries = (Object.entries(signals) as [Archetype, number][]).sort((a, b) => b[1] - a[1]);
    if (entries.length >= 2 && entries[0][1] > entries[1][1] * 1.2) {
      return entries[0][0];
    }
  }

  // Tiebreak 2: Euclidean distance to archetype centroids
  return euclideanClosest(profile);
}

function euclideanClosest(profile: PsychProfile): Archetype {
  const axes: Array<keyof typeof ARCHETYPE_CENTROIDS['The Hairdryer']> =
    ['board', 'fans', 'squad', 'TF', 'D', 'MP', 'MM', 'TT'];

  let bestArchetype: Archetype = 'The Pragmatist';
  let bestDist = Infinity;

  for (const [archetype, centroid] of Object.entries(ARCHETYPE_CENTROIDS) as [Archetype, typeof ARCHETYPE_CENTROIDS[Archetype]][]) {
    if (archetype === 'The Pragmatist') continue;
    const dist = Math.sqrt(
      axes.reduce((sum, axis) => {
        const diff = (profile[axis as keyof PsychProfile] as number) - centroid[axis as keyof typeof centroid];
        return sum + diff * diff;
      }, 0)
    );
    if (dist < bestDist) {
      bestDist = dist;
      bestArchetype = archetype;
    }
  }

  return bestArchetype;
}

// ─── buildVerdictPrompt ───────────────────────────────────────────────────────

/**
 * Builds the user-side prompt for the Claude AI end-of-season verdict.
 * System prompt lives in the API route.
 */
export function buildVerdictPrompt(
  profile: PsychProfile,
  archetype: Archetype,
  record: { w: number; d: number; l: number },
  position: number
): string {
  const pts = record.w * 3 + record.d;
  const totalGames = record.w + record.d + record.l;

  // Map 0-100 → descriptive labels for the prompt
  const label = (v: number, hi: string, mid: string, lo: string) =>
    v >= 65 ? hi : v >= 40 ? mid : lo;

  return `
Season complete. Here is the data for your verdict:

MANAGER ARCHETYPE: ${archetype}
FINAL POSITION: ${position}${ordinal(position)}
RECORD: W${record.w} D${record.d} L${record.l} over ${totalGames} games (${pts} points)

TENSION TRIANGLE (end of season, 0–100):
- Board confidence: ${Math.round(profile.board)}%
- Fan support: ${Math.round(profile.fans)}%
- Squad morale: ${Math.round(profile.squad)}%

PSYCHOLOGY PROFILE (0–100):
- Tactical Flexibility: ${Math.round(profile.TF)} — ${label(profile.TF, 'highly experimental', 'balanced', 'rigid and safe')}
- Discipline: ${Math.round(profile.D)} — ${label(profile.D, 'iron-fisted', 'moderate', 'laissez-faire')}
- Media Presence: ${Math.round(profile.MP)} — ${label(profile.MP, 'very public-facing', 'moderate', 'reclusive')}
- Man Management: ${Math.round(profile.MM)} — ${label(profile.MM, 'player-first', 'balanced', 'ruthless')}
- Touchline Temper: ${Math.round(profile.TT)} — ${label(profile.TT, 'volatile', 'managed', 'ice-cold')}

Write a two-sentence back-page verdict for this manager's season.
Dry wit. Reference the actual stats. No jargon.
`.trim();
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}

// ─── Firestore helpers ────────────────────────────────────────────────────────

/** Serialize for Firestore (removes methods, keeps data) */
export function profileToFirestore(profile: PsychProfile): Record<string, unknown> {
  return {
    board: profile.board,
    fans:  profile.fans,
    squad: profile.squad,
    TF:    profile.TF,
    D:     profile.D,
    MP:    profile.MP,
    MM:    profile.MM,
    TT:    profile.TT,
    swipeCount:       profile.swipeCount,
    archetypeSignals: profile.archetypeSignals,
  };
}

export function profileFromFirestore(data: Record<string, unknown>): PsychProfile {
  const baseSignals = {} as Record<Archetype, number>;
  ALL_ARCHETYPES.forEach(a => { baseSignals[a] = 0; });

  return {
    board: (data.board as number) ?? 50,
    fans:  (data.fans  as number) ?? 50,
    squad: (data.squad as number) ?? 50,
    TF:    (data.TF    as number) ?? 50,
    D:     (data.D     as number) ?? 50,
    MP:    (data.MP    as number) ?? 50,
    MM:    (data.MM    as number) ?? 50,
    TT:    (data.TT    as number) ?? 50,
    swipeCount: (data.swipeCount as number) ?? 0,
    archetypeSignals: { ...baseSignals, ...(data.archetypeSignals as Record<Archetype, number> ?? {}) },
  };
}
