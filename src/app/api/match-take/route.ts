/**
 * POST /api/match-take
 * Returns a sardonic one-liner for the post-match result screen.
 */

import { NextRequest, NextResponse } from 'next/server';

const SYSTEM =
  'You are a sardonic British football commentator. Write exactly one sentence, ' +
  'maximum 18 words. Dry wit. Reference the result and teams. Never use clichés like ' +
  '"at the end of the day" or "it is what it is".';

const FALLBACKS: Record<'win' | 'draw' | 'loss', string[]> = {
  win: [
    "Three points secured with all the elegance of a shopping trolley — but it counts.",
    "Ugly, efficient, entirely unconvincing — they'll take it and say nothing.",
    "The performance raised serious questions. The scoreboard provided answers nobody expected.",
  ],
  draw: [
    "A draw that satisfied nobody, which is possibly the most honest outcome available.",
    "A point shared, dignity lost, press conference awaited.",
    "Honours even. Nobody deserved better. Nobody deserved worse.",
  ],
  loss: [
    "The tactics, the execution, the result — a hat-trick of the wrong kind.",
    "Outplayed, outclassed, out of ideas. Back to the drawing board.",
    "The opposition was ruthless. The scoreline was brutally honest.",
  ],
};

export async function POST(req: NextRequest) {
  const { result, userTeam, opponentTeam } = await req.json() as {
    result: 'win' | 'draw' | 'loss';
    userTeam: string;
    opponentTeam: string;
  };

  const pool = FALLBACKS[result] ?? FALLBACKS.draw;
  const fallback = pool[Math.floor(Math.random() * pool.length)];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ take: fallback });

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
    const take = data.content?.[0]?.text?.trim() ?? fallback;
    return NextResponse.json({ take });
  } catch {
    return NextResponse.json({ take: fallback });
  }
}
