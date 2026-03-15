/**
 * POST /api/press-conference
 * Scores a manager's press conference answer.
 * Returns reporter reaction + game state impacts + psych deltas.
 */

import { NextRequest, NextResponse } from 'next/server';

const SYSTEM = `You evaluate a football manager's press conference answer in a mobile simulation game.
Given the question and the manager's answer, return a JSON object with exactly these fields:
{
  "reaction": "one sardonic reporter reaction sentence (max 15 words)",
  "impacts": { "board": integer -10 to 10, "fans": integer -10 to 10, "squad": integer -10 to 10 },
  "psychDelta": { "TF": integer -2 to 2, "D": integer -2 to 2, "MP": integer -2 to 2, "MM": integer -2 to 2, "TT": integer -2 to 2 }
}

Scoring guide:
- Diplomatic / measured answer → board +, fans 0, MP +, TT -
- Confrontational / fiery answer → fans ±, squad +, TT +, D +
- Player-first / empathetic answer → squad +, fans +, MM +
- Evasive / corporate answer → board +, fans -, MP -, D +
- Honest / self-critical answer → fans +, board -, MP +, MM +

Return ONLY valid JSON. No other text.`;

const NO_COMMENT_RESPONSE = {
  reaction:   "No comment. The press pack exchanged knowing glances and filed their own conclusions.",
  impacts:    { board: -3, fans: -5, squad: 0 },
  psychDelta: { TF: 0, D: 1, MP: -2, MM: 0, TT: 0 },
};

const FALLBACK_REACTIONS = [
  "A masterclass in saying nothing meaningful.",
  "The press corps filed out none the wiser.",
  "Short, pointed, and diplomatically catastrophic.",
  "Nobody left that room with their confidence restored.",
];

export async function POST(req: NextRequest) {
  const { question, answer, noComment } = await req.json() as {
    question:  string;
    answer:    string;
    noComment: boolean;
  };

  if (noComment) {
    return NextResponse.json(NO_COMMENT_RESPONSE);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      reaction:   FALLBACK_REACTIONS[Math.floor(Math.random() * FALLBACK_REACTIONS.length)],
      impacts:    { board: 0, fans: 2, squad: 1 },
      psychDelta: { TF: 0, D: 0, MP: 1, MM: 0, TT: 0 },
    });
  }

  const prompt = `Question: "${question}"\nManager's answer: "${answer}"`;

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
        max_tokens: 200,
        system:     SYSTEM,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error('api error');

    const data = await res.json() as { content: Array<{ text: string }> };
    const text = data.content?.[0]?.text?.trim() ?? '{}';

    // Extract JSON — Claude occasionally wraps in ```json blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('no json');

    const parsed = JSON.parse(jsonMatch[0]) as {
      reaction:   string;
      impacts:    { board: number; fans: number; squad: number };
      psychDelta: { TF: number; D: number; MP: number; MM: number; TT: number };
    };

    // Clamp values to safe ranges
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));
    return NextResponse.json({
      reaction:   parsed.reaction ?? FALLBACK_REACTIONS[0],
      impacts: {
        board: clamp(parsed.impacts?.board ?? 0, -10, 10),
        fans:  clamp(parsed.impacts?.fans  ?? 0, -10, 10),
        squad: clamp(parsed.impacts?.squad ?? 0, -10, 10),
      },
      psychDelta: {
        TF: clamp(parsed.psychDelta?.TF ?? 0, -2, 2),
        D:  clamp(parsed.psychDelta?.D  ?? 0, -2, 2),
        MP: clamp(parsed.psychDelta?.MP ?? 0, -2, 2),
        MM: clamp(parsed.psychDelta?.MM ?? 0, -2, 2),
        TT: clamp(parsed.psychDelta?.TT ?? 0, -2, 2),
      },
    });
  } catch {
    return NextResponse.json({
      reaction:   FALLBACK_REACTIONS[Math.floor(Math.random() * FALLBACK_REACTIONS.length)],
      impacts:    { board: 0, fans: 0, squad: 0 },
      psychDelta: { TF: 0, D: 0, MP: 0, MM: 0, TT: 0 },
    });
  }
}
