/**
 * POST /api/match-take
 * Returns a sardonic one-liner for the post-match result screen.
 *
 * FORCE_FALLBACK = true → skips Anthropic, uses team-name-interpolated templates.
 */

import { NextRequest, NextResponse } from 'next/server';

const FORCE_FALLBACK = true;

// ── Template pools — {user} and {opp} are interpolated ───────────────────────

const TEMPLATES: Record<'win' | 'draw' | 'loss', string[]> = {
  win: [
    "{user} ground out three points against {opp} — ugly, functional, entirely unconvincing.",
    "The performance against {opp} raised serious questions. The scoreboard provided unexpected answers.",
    "{user} left {opp} with nothing. The manner of it will concern everyone regardless.",
    "Three points at {opp}'s expense — filed under 'results that help, nothing else'.",
    "{user} found a way past {opp}. Whether they won it or {opp} lost it remains genuinely unclear.",
    "Clinical when it mattered, chaotic the rest of the time. {user} take the three points.",
    "{opp} had no answers for whatever {user} were doing out there. That's one way to do it.",
    "Unconvincing from start to finish — but {user} supporters won't lose sleep over three points.",
  ],
  draw: [
    "{user} and {opp} split a point with all the conviction of a pre-arranged handshake.",
    "Honours even between {user} and {opp}. Nobody celebrating, nobody despairing.",
    "{opp} denied {user} with the kind of resilience that makes neutral observers question everything.",
    "A draw that satisfied nobody — which is possibly the most honest outcome available.",
    "{user} couldn't convert when it mattered. {opp} didn't particularly need to.",
    "A point shared. Both managers will call it progress. Neither will mean it.",
    "{user} and {opp} cancel each other out entirely. A useful result for nobody.",
  ],
  loss: [
    "{opp} were ruthless. {user} were not. The scoreline confirmed what everyone suspected.",
    "The tactics, the execution, the result against {opp} — a hat-trick of the wrong kind.",
    "{user} left {opp}'s ground with several pressing questions and zero points.",
    "Outplayed and undone by {opp}. The dressing room will not be pleasant tonight.",
    "{opp} exposed every weakness {user} were trying to paper over. Brutally efficient.",
    "Three points surrendered to {opp}. The analysis starts immediately, the answers won't be pretty.",
    "{user} had no response to {opp}'s second half. The table reflects that accurately.",
    "A thoroughly deserved defeat. {opp} were simply better in every department that mattered.",
  ],
};

function buildFallbackTake(result: 'win' | 'draw' | 'loss', userTeam: string, opponentTeam: string): string {
  const pool = TEMPLATES[result] ?? TEMPLATES.draw;
  const template = pool[Math.floor(Math.random() * pool.length)];
  return template
    .replace(/\{user\}/g, userTeam)
    .replace(/\{opp\}/g, opponentTeam);
}

export async function POST(req: NextRequest) {
  const { result, userTeam, opponentTeam } = await req.json() as {
    result: 'win' | 'draw' | 'loss';
    userTeam: string;
    opponentTeam: string;
  };

  // ── Fallback path (AI disabled) ───────────────────────────────────────────
  if (FORCE_FALLBACK) {
    return NextResponse.json({ take: buildFallbackTake(result, userTeam, opponentTeam) });
  }

  // ── AI path ───────────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ take: buildFallbackTake(result, userTeam, opponentTeam) });

  const SYSTEM =
    'You are a sardonic British football commentator. Write exactly one sentence, ' +
    'maximum 18 words. Dry wit. Reference the result and teams. Never use clichés like ' +
    '"at the end of the day" or "it is what it is".';

  const prompt = `${userTeam} vs ${opponentTeam}. Result: ${result}. One sardonic sentence.`;

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
        max_tokens: 60,
        system:     SYSTEM,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error('api error');
    const data = await res.json() as { content: Array<{ text: string }> };
    const take = data.content?.[0]?.text?.trim() ?? buildFallbackTake(result, userTeam, opponentTeam);
    return NextResponse.json({ take });
  } catch {
    return NextResponse.json({ take: buildFallbackTake(result, userTeam, opponentTeam) });
  }
}
