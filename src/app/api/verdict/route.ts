/**
 * @fileOverview End-of-season AI verdict endpoint.
 * Calls Claude (claude-sonnet-4-5) to generate a sardonic back-page
 * football pundit verdict based on the manager's season psychProfile.
 *
 * FORCE_FALLBACK = true → skips Anthropic, uses archetype + stats to pick targeted verdict.
 */

import { NextRequest, NextResponse } from 'next/server';

const FORCE_FALLBACK = true;

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT =
  'You are a sardonic British football pundit writing end-of-season verdicts ' +
  'for a mobile football manager game. Two sentences maximum. Dry wit. ' +
  'Reference the actual stats. Never use corporate or psychological jargon. ' +
  'Write like a back-page columnist, not a therapist.';

// ── Archetype + outcome targeted verdict banks ────────────────────────────────

const VERDICTS: Record<string, { success: string[]; mid: string[]; fail: string[] }> = {
  'The Architect': {
    success: [
      "A tactical blueprint executed with uncommon precision — the Architect delivered when the drawings mattered most.",
      "Methodical, deliberate, occasionally maddening to watch. The points column made the argument for him.",
    ],
    mid: [
      "The system was admirable. The results were acceptable. The gap between both remains the question.",
      "Tactical rigidity produces tactical results — solid, defensible, and not entirely convincing.",
    ],
    fail: [
      "The blueprint was drawn. The build went catastrophically wrong. An Architect who couldn't hold the structure up.",
      "Complicated plans, simple outcomes — the wrong kind of simple.",
    ],
  },
  'The Firefighter': {
    success: [
      "Crisis management elevated to an art form — kept the wheels turning when they had no right to stay on.",
      "Every week a new emergency, every week somehow survived. Exhausting to watch. Impossible to dismiss.",
    ],
    mid: [
      "Fires were started, fires were put out. The season ended with the building still standing, just.",
      "Reactive, resourceful, and permanently on edge. Somehow a point above where chaos usually lands you.",
    ],
    fail: [
      "Fought every fire with admirable intensity. Couldn't prevent the building burning down regardless.",
      "The Firefighter ran out of hose. The season burned through its final weeks with nobody left to call.",
    ],
  },
  'The Philosopher': {
    success: [
      "The ideas held. The implementation held better. A season that proved principle and pragmatism aren't enemies.",
      "Long on vision, longer on results — a rare combination in this league, and rarer still at this end of it.",
    ],
    mid: [
      "The philosophy was sound. The application was intermittent. The table reflects the gap honestly.",
      "Thought deeply about football. Played it adequately. The contemplation was more compelling than the scorelines.",
    ],
    fail: [
      "The theory was elaborate. The results were not. Football, it turns out, doesn't grade on ideas.",
      "A Philosopher who ran out of answers when the questions got uncomfortably specific.",
    ],
  },
  'The Showman': {
    success: [
      "The theatrics were entertaining. The results, eventually, were too. Nobody does it quite like this.",
      "Divided opinion all season, united the fanbase at the end of it. The Showman stuck his landing.",
    ],
    mid: [
      "The production was spectacular. The results were passable. The audience is still deciding what they watched.",
      "Drama, controversy, entertainment — a season that had everything except consistent points.",
    ],
    fail: [
      "The performance was captivating. The results were not. Unfortunately, the table only counts points.",
      "A spectacular show that ran out of road. The Showman exits stage left to a mixed reception.",
    ],
  },
  'The Pragmatist': {
    success: [
      "Functional, efficient, and entirely unsexy. The points said everything the performances refused to.",
      "Pragmatism in its purest form — results extracted from every situation regardless of aesthetics.",
    ],
    mid: [
      "Ugly but operational. The Pragmatist got out what the squad could give and not a point more.",
      "Effective enough to survive, conservative enough to frustrate. Exactly what was promised.",
    ],
    fail: [
      "The pragmatic approach had limits. The season found them comprehensively.",
      "When the results stopped coming, the pragmatism had nowhere left to hide.",
    ],
  },
  'The Idealist': {
    success: [
      "The dream held firm and then, remarkably, delivered. An idealist vindicated by an indifferent table.",
      "Refused to compromise, refused to bend, somehow emerged with the points to silence the doubters.",
    ],
    mid: [
      "Idealism collided with reality at regular intervals. The season absorbed the impact and returned a draw.",
      "The vision was clear. The execution was human. The results were somewhere in between.",
    ],
    fail: [
      "The ideal met the actual and lost every single time. A hard lesson, delivered comprehensively.",
      "Beautiful in conception. Brutal in execution. The table offered no philosophical consolation.",
    ],
  },
  'The Survivalist': {
    success: [
      "Survived everything thrown at them and emerged with points that absolutely nobody predicted.",
      "Gritted teeth, absorbed pressure, extracted results. The Survivalist found a way when no way existed.",
    ],
    mid: [
      "Weathered the storm and lived to fight another day. Not a ringing endorsement — but a result.",
      "Survival instincts engaged all season. The final position confirms they worked. Barely.",
    ],
    fail: [
      "Even the Survivalist's instincts couldn't locate a way through this. Some seasons simply cannot be survived.",
      "The defences held until they didn't. When they broke, they broke badly.",
    ],
  },
};

const GENERIC_VERDICTS = [
  "A season of decisions — some inspired, some baffling, most filed somewhere between the two.",
  "The table told a story. The manager told a different one. Both had some truth in them.",
  "Football management, it turns out, is not a controlled experiment. This season proved it conclusively.",
  "Chaos was the strategy, apparently — and somehow it almost worked.",
  "Said all the right things. Did most of the right things. The gap between both cost them dearly.",
  "A white-knuckle ride that arrived somewhere. Whether it was the right destination remains open to interpretation.",
  "The board wanted stability. What they got was a season's worth of compelling television.",
  "In the end, results were what they were — and what they were was complicated.",
];

// ── Parse the prompt to extract context for smart fallback selection ──────────

function parsePrompt(prompt: string): { archetype: string; position: number; wins: number; losses: number; draws: number } {
  const archetypeMatch = prompt.match(/MANAGER ARCHETYPE:\s*(.+)/);
  const positionMatch  = prompt.match(/FINAL POSITION:\s*(\d+)/);
  const winsMatch      = prompt.match(/W(\d+)/);
  const drawsMatch     = prompt.match(/D(\d+)/);
  const lossesMatch    = prompt.match(/L(\d+)/);

  return {
    archetype: archetypeMatch?.[1]?.trim() ?? '',
    position:  parseInt(positionMatch?.[1] ?? '10'),
    wins:      parseInt(winsMatch?.[1] ?? '0'),
    draws:     parseInt(drawsMatch?.[1] ?? '0'),
    losses:    parseInt(lossesMatch?.[1] ?? '0'),
  };
}

function generateFallbackVerdict(prompt: string): string {
  const { archetype, position, wins, losses, draws } = parsePrompt(prompt);
  const totalGames = wins + draws + losses;
  const winRate    = totalGames > 0 ? wins / totalGames : 0.4;

  // Classify outcome
  const tier = position <= 4 && winRate >= 0.55  ? 'success'
             : position >= 15 || winRate < 0.30   ? 'fail'
             : 'mid';

  const bank = VERDICTS[archetype];
  if (bank) {
    const pool = bank[tier];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  return GENERIC_VERDICTS[Math.floor(Math.random() * GENERIC_VERDICTS.length)];
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { prompt, cacheKey } = await req.json() as { prompt: string; cacheKey?: string };

    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    // ── Fallback path (AI disabled) ─────────────────────────────────────────
    if (FORCE_FALLBACK) {
      return NextResponse.json({
        verdict:  generateFallbackVerdict(prompt),
        cached:   false,
        fallback: true,
        cacheKey,
      });
    }

    // ── AI path ─────────────────────────────────────────────────────────────
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        verdict:  generateFallbackVerdict(prompt),
        cached:   false,
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
      return NextResponse.json({
        verdict:  generateFallbackVerdict(prompt),
        cached:   false,
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
      { status: 200 }
    );
  }
}
