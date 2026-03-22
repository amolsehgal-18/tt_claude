/**
 * POST /api/explain
 * Returns a sardonic one-sentence insight about a swipe decision.
 * Fire-and-forget from the client — displayed as a non-blocking toast.
 *
 * FORCE_FALLBACK = true → skips Anthropic, uses impact-aware fallback selection.
 */

import { NextRequest, NextResponse } from 'next/server';

const FORCE_FALLBACK = true;

// ── Context-aware fallback pools ──────────────────────────────────────────────

const BOARD_UP   = ["The board noted that. They file the positives too.", "Hierarchy satisfied — for now. Don't mistake approval for trust."];
const BOARD_DOWN = ["The board noticed. They always notice.", "That call will be referenced at the next contract discussion."];
const FANS_UP    = ["The terraces approved. They'll be harder to please next time.", "Fan goodwill earned — a finite resource, spent wisely here."];
const FANS_DOWN  = ["The fans have longer memories than the manager realises.", "That decision will be sung back at the manager, eventually."];
const SQUAD_UP   = ["The dressing room took note — trust built this way lasts.", "Players respond to that. Not always visibly. Always eventually."];
const SQUAD_DOWN = ["That call will echo through the dressing room by Thursday.", "Privately, a few players filed that decision away for later."];
const NEUTRAL    = ["Quietly filed away by everyone who matters.", "Whether right or wrong, this decision is now his to own.", "A bold move — or a desperate one. The table will decide.", "Neither celebrated nor condemned. The ambiguity is its own statement."];

function buildFallbackInsight(impact: { board: number; fans: number; squad: number }): string {
  // Find the dominant impact axis
  const axes = [
    { key: 'board', val: impact.board },
    { key: 'fans',  val: impact.fans  },
    { key: 'squad', val: impact.squad },
  ].sort((a, b) => Math.abs(b.val) - Math.abs(a.val));

  const top = axes[0];

  if (Math.abs(top.val) < 2) {
    return NEUTRAL[Math.floor(Math.random() * NEUTRAL.length)];
  }

  let pool: string[];
  if (top.key === 'board') pool = top.val > 0 ? BOARD_UP : BOARD_DOWN;
  else if (top.key === 'fans') pool = top.val > 0 ? FANS_UP : FANS_DOWN;
  else pool = top.val > 0 ? SQUAD_UP : SQUAD_DOWN;

  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { scenarioText, choiceText, impact } = await req.json() as {
    scenarioText: string;
    choiceText:   string;
    impact: { board: number; fans: number; squad: number };
  };

  // ── Fallback path (AI disabled) ───────────────────────────────────────────
  if (FORCE_FALLBACK) {
    return NextResponse.json({ insight: buildFallbackInsight(impact) });
  }

  // ── AI path ───────────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ insight: buildFallbackInsight(impact) });

  const SYSTEM =
    'You are a sardonic analyst in a football manager simulation. ' +
    'Given a scenario and the manager\'s decision, write exactly one sentence (under 20 words). ' +
    'Dry wit. Knowing tone. Reference the likely consequence without stating the obvious.';

  const impacts = [
    { key: 'board', val: impact.board },
    { key: 'fans',  val: impact.fans  },
    { key: 'squad', val: impact.squad },
  ].sort((a, b) => Math.abs(b.val) - Math.abs(a.val));
  const top = impacts[0];
  const impactDesc = top.val === 0
    ? 'neutral impact'
    : `${top.key} support ${top.val > 0 ? 'improved' : 'worsened'}`;

  const prompt = `Scenario: "${scenarioText}". Decision: "${choiceText}". ${impactDesc}.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-5',
        max_tokens: 50,
        system:     SYSTEM,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error('api error');
    const data = await res.json() as { content: Array<{ text: string }> };
    const insight = data.content?.[0]?.text?.trim() ?? buildFallbackInsight(impact);
    return NextResponse.json({ insight });
  } catch {
    return NextResponse.json({ insight: buildFallbackInsight(impact) });
  }
}
