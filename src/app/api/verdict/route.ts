/**
 * @fileOverview End-of-season AI verdict endpoint.
 * Calls Claude (claude-sonnet-4-5) to generate a sardonic back-page
 * football pundit verdict based on the manager's season psychProfile.
 */

import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT =
  'You are a sardonic British football pundit writing end-of-season verdicts ' +
  'for a mobile football manager game. Two sentences maximum. Dry wit. ' +
  'Reference the actual stats. Never use corporate or psychological jargon. ' +
  'Write like a back-page columnist, not a therapist.';

export async function POST(req: NextRequest) {
  try {
    const { prompt, cacheKey } = await req.json() as { prompt: string; cacheKey?: string };

    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Graceful fallback — no key configured
      return NextResponse.json({
        verdict: generateFallbackVerdict(prompt),
        cached: false,
        fallback: true,
      });
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type':            'application/json',
        'x-api-key':               apiKey,
        'anthropic-version':       '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-5',
        max_tokens: 120,
        system:     SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[verdict] Anthropic API error:', err);
      return NextResponse.json({
        verdict: generateFallbackVerdict(prompt),
        cached: false,
        fallback: true,
      });
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
    };

    const verdict = data.content?.[0]?.text?.trim() ?? generateFallbackVerdict(prompt);

    return NextResponse.json({ verdict, cached: false, cacheKey });

  } catch (err) {
    console.error('[verdict] Unexpected error:', err);
    return NextResponse.json(
      { verdict: "Chaos was the strategy, apparently — and somehow it almost worked.", fallback: true },
      { status: 200 } // still 200 so UI can render
    );
  }
}

// ─── Fallback verdicts ────────────────────────────────────────────────────────

const FALLBACK_VERDICTS = [
  "A season of remarkable decisions — remarkable in the sense that nobody quite expected them, least of all the board.",
  "They said you'd never make it past Christmas, and they were absolutely right — yet here you are regardless.",
  "Football management experts will study this campaign for years, mainly as a cautionary tale.",
  "A bold tactical vision married to an almost supernatural ability to baffle everyone, including your own players.",
  "The dressing room was not exactly a library of calm, but the points trickled in regardless.",
  "You managed this club the way a jazz musician plays — improvised, unpredictable, and occasionally brilliant.",
  "The board wanted stability; what they got was a white-knuckle ride that somehow arrived at the destination.",
  "In the end, results were what they were — and what they were was complicated.",
];

function generateFallbackVerdict(_prompt: string): string {
  return FALLBACK_VERDICTS[Math.floor(Math.random() * FALLBACK_VERDICTS.length)];
}
