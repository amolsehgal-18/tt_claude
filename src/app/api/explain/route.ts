/**
 * POST /api/explain
 * Returns a sardonic one-sentence insight about a swipe decision.
 * Fire-and-forget from the client — displayed as a non-blocking toast.
 */

import { NextRequest, NextResponse } from 'next/server';

const SYSTEM =
  'You are a sardonic analyst in a football manager simulation. ' +
  'Given a scenario and the manager\'s decision, write exactly one sentence (under 20 words). ' +
  'Dry wit. Knowing tone. Reference the likely consequence without stating the obvious.';

const FALLBACKS = [
  "The board noticed. They always notice.",
  "That call will echo through the dressing room by Thursday.",
  "A bold move — or a desperate one. The table will decide.",
  "The fans have longer memories than the manager realises.",
  "Quietly filed away by everyone who matters.",
  "Whether right or wrong, the decision is now his to own.",
];

export async function POST(req: NextRequest) {
  const { scenarioText, choiceText, impact } = await req.json() as {
    scenarioText: string;
    choiceText:   string;
    impact: { board: number; fans: number; squad: number };
  };

  const fallback = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ insight: fallback });

  // Describe the dominant impact for context
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
    const insight = data.content?.[0]?.text?.trim() ?? fallback;
    return NextResponse.json({ insight });
  } catch {
    return NextResponse.json({ insight: fallback });
  }
}
