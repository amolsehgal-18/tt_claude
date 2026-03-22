/**
 * POST /api/press-conference
 * Scores a manager's press conference answer.
 * Returns reporter reaction + game state impacts + psych deltas.
 *
 * FORCE_FALLBACK = true → skips Anthropic, computes impacts from answer intent + tone.
 */

import { NextRequest, NextResponse } from 'next/server';

const FORCE_FALLBACK = true;

// ── Types ─────────────────────────────────────────────────────────────────────

interface PressConferenceResult {
  reaction:   string;
  impacts:    { board: number; fans: number; squad: number };
  psychDelta: { TF: number; D: number; MP: number; MM: number; TT: number };
}

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

const NO_COMMENT_RESPONSE: PressConferenceResult = {
  reaction:   "No comment. The press pack exchanged knowing glances and filed their own conclusions.",
  impacts:    { board: -3, fans: -5, squad: 0 },
  psychDelta: { TF: 0, D: 1, MP: -2, MM: 0, TT: 0 },
};

// ── Smart fallback — detect card intent from answer text ──────────────────────

const DEFLECT_REACTIONS = [
  "A masterclass in corporate deflection — the press corps left with nothing useful.",
  "Calm, controlled, and entirely evasive. The board will approve.",
  "The questions were redirected with practised efficiency. Answers: none.",
  "Smooth. Too smooth. The journalists filed out quietly and started writing anyway.",
];

const TAKE_CHARGE_REACTIONS = [
  "Accountability taken, chin out. Whether it satisfies anyone remains to be seen.",
  "The manager owned the room. Briefly. The questions won't go away.",
  "Full responsibility claimed publicly — the board noted it. So did the players.",
  "Resolute and direct. The press pack respected it even as they doubted it.",
];

const FIGHT_BACK_REACTIONS = [
  "The manager pushed back hard. The press left unsatisfied but faintly rattled.",
  "Combative and unapologetic — the squad will love it, the board less so.",
  "Took the fight to the press. Bold move. Consequences pending.",
  "Fiery, pointed, and possibly unwise. The back pages write themselves.",
];

const GENERIC_REACTIONS = [
  "The conference ended without resolution — exactly as expected.",
  "A press conference that raised more questions than it answered.",
  "Somewhere between defiant and defeated. The journalists took their notes.",
  "Said a lot. Communicated very little. The press loved every second.",
];

function detectIntent(answer: string): 'deflect' | 'take_charge' | 'fight_back' | 'generic' {
  const a = answer.toLowerCase();
  if (/focus forward|stay in our lane|focus on what we can control|we trust the process/i.test(a)) return 'deflect';
  if (/own every decision|full responsibility|take accountability|i make the calls/i.test(a)) return 'take_charge';
  if (/reject that framing|narrative doesn.t match|stats tell|come back with real/i.test(a)) return 'fight_back';
  return 'generic';
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function computeFallback(answer: string): PressConferenceResult {
  const intent = detectIntent(answer);

  switch (intent) {
    case 'deflect':
      return {
        reaction:   pickRandom(DEFLECT_REACTIONS),
        impacts:    { board: 4, fans: -2, squad: 1 },
        psychDelta: { TF: 0, D: 1, MP: -1, MM: 0, TT: -1 },
      };
    case 'take_charge':
      return {
        reaction:   pickRandom(TAKE_CHARGE_REACTIONS),
        impacts:    { board: 3, fans: 3, squad: 5 },
        psychDelta: { TF: 0, D: 2, MP: 1, MM: 1, TT: 0 },
      };
    case 'fight_back':
      return {
        reaction:   pickRandom(FIGHT_BACK_REACTIONS),
        impacts:    { board: -3, fans: 5, squad: 6 },
        psychDelta: { TF: 0, D: 1, MP: 2, MM: 0, TT: 2 },
      };
    default:
      return {
        reaction:   pickRandom(GENERIC_REACTIONS),
        impacts:    { board: 1, fans: 1, squad: 1 },
        psychDelta: { TF: 0, D: 0, MP: 0, MM: 0, TT: 0 },
      };
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { question, answer, noComment } = await req.json() as {
    question:  string;
    answer:    string;
    noComment: boolean;
  };

  if (noComment) {
    return NextResponse.json(NO_COMMENT_RESPONSE);
  }

  // ── Fallback path (AI disabled) ───────────────────────────────────────────
  if (FORCE_FALLBACK) {
    return NextResponse.json(computeFallback(answer));
  }

  // ── AI path ───────────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json(computeFallback(answer));

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

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('no json');

    const parsed = JSON.parse(jsonMatch[0]) as {
      reaction:   string;
      impacts:    { board: number; fans: number; squad: number };
      psychDelta: { TF: number; D: number; MP: number; MM: number; TT: number };
    };

    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));
    return NextResponse.json({
      reaction:   parsed.reaction ?? pickRandom(GENERIC_REACTIONS),
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
    return NextResponse.json(computeFallback(answer));
  }
}
