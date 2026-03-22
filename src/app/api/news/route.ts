/**
 * GET  /api/news  — static fallback headlines
 * POST /api/news  — AI-generated contextual headlines based on current game state
 *
 * FORCE_FALLBACK = true → skips Anthropic entirely, uses smart context-aware fallback.
 */

import { NextRequest, NextResponse } from 'next/server';

const FORCE_FALLBACK = true;

// ── Context-aware headline pools ──────────────────────────────────────────────

const POOLS = {
  boardCritical: [
    "BOMBSHELL: Board calls emergency summit — manager's position under immediate review",
    "CRISIS: Ownership group demands answers after catastrophic run of results",
    "EXCLUSIVE: Chairman privately told manager he has two games to save his job",
    "REVEALED: Board already shortlisting replacements — 'It's a matter of when, not if'",
  ],
  boardLow: [
    "EXCLUSIVE: Board growing restless as pressure mounts on under-fire gaffer",
    "STANDOFF: Hierarchy distances itself publicly from manager after poor form",
    "BREAKING: Club insiders describe 'strained atmosphere' between manager and board",
  ],
  fansCritical: [
    "MELTDOWN: Fans stage walkout protest — 'This isn't good enough' banners spotted outside ground",
    "FURIOUS: Supporters' trust calls emergency meeting over dismal performances",
    "CHAOS: Chants for manager's head dominate post-match reaction — trust at rock bottom",
    "ULTIMATUM: Fan groups demand public statement from board within 48 hours",
  ],
  fansLow: [
    "STANDOFF: Season ticket holders petition board over poor form and lack of direction",
    "REVEALED: Season ticket renewals down sharply — supporters voting with wallets",
    "HOT MIC: Fan frustration boils over outside ground after another poor result",
  ],
  squadCritical: [
    "CHAOS: Players reportedly refusing manager's training drills in extraordinary scenes",
    "REVEALED: Dressing room revolt — captain confronts manager over tactics in team meeting",
    "SHOCK: Senior players hold private summit to discuss dressing room situation",
    "MELTDOWN: Training ground bust-up filmed on phone — video threatens to go viral",
  ],
  squadLow: [
    "HOT MIC: Training ground tensions boil over — sources close to club confirm unrest",
    "EXCLUSIVE: Squad morale described as 'fragile' by insider — meetings ongoing",
    "BREAKING: Players' body language in training a concern — staff worried about confidence",
  ],
  topOfLeague: [
    "EXCLUSIVE: Title charge gathers pace — rivals privately concede race may already be over",
    "REVEALED: Manager's contract extension talks accelerating after stunning form",
    "BOMBSHELL: Champions League clubs circle as manager's stock soars amid title push",
  ],
  relegation: [
    "ULTIMATUM: Owner gives manager four games to avoid the drop or face immediate dismissal",
    "CRISIS: Relegation zone beckons — board preparing contingency plans for Championship season",
    "BREAKING: Emergency January window move planned as club battles to stay up",
  ],
  winRateHigh: [
    "EXCLUSIVE: Manager lauded as 'best in the league' after remarkable unbeaten run",
    "REVEALED: Rival clubs making enquiries about manager — club scrambles to protect asset",
  ],
  winRateLow: [
    "SHOCK: Win rate among the worst in the division — statistics make damning reading",
    "EXCLUSIVE: Analytics firm hired by board to review manager's tactical approach",
  ],
  generic: [
    "BREAKING: Premier League giants locked in bidding war over prolific striker",
    "SHOCK: Legendary manager makes surprise return from retirement to take top job",
    "EXCLUSIVE: Megastar demands exit in January — agent confirms talks with rivals",
    "REVEALED: Secret training ground footage leaked — players furious at exposure",
    "CHAOS: Controversial VAR decision ignites furious debate across all media",
    "ULTIMATUM: Star striker gives club until end of month to match rival's offer",
    "BOMBSHELL: Shock sacking rocks European football — replacement named within hours",
    "MELTDOWN: Club president confronted in car park after disastrous home defeat",
    "CRISIS: Financial investigators arrive at training ground as cash crisis deepens",
    "EXCLUSIVE: Manager's agent photographed outside rival club — talks confirmed",
    "STANDOFF: Contract rebel refuses to train until transfer is sanctioned by board",
    "BREAKING: Takeover bid submitted — new owners would 'back manager fully'",
    "HOT MIC: Touchline row caught on camera — lip reader confirms explosive exchange",
    "FURIOUS: Star player subbed off storms down tunnel without acknowledging manager",
  ],
};

function buildContextualNews(
  boardSupport: number,
  fanSupport: number,
  dressingRoom: number,
  position: number,
  wins: number,
  losses: number,
  matchesPlayed: number,
): string[] {
  const selected: string[] = [];

  const pick = (pool: string[]) => {
    const unused = pool.filter(h => !selected.includes(h));
    if (unused.length === 0) return;
    selected.push(unused[Math.floor(Math.random() * unused.length)]);
  };

  // Board headlines
  if (boardSupport < 0.3)       { pick(POOLS.boardCritical); pick(POOLS.boardCritical); }
  else if (boardSupport < 0.5)  { pick(POOLS.boardLow); }

  // Fan headlines
  if (fanSupport < 0.3)         { pick(POOLS.fansCritical); pick(POOLS.fansCritical); }
  else if (fanSupport < 0.5)    { pick(POOLS.fansLow); }

  // Squad headlines
  if (dressingRoom < 0.3)       { pick(POOLS.squadCritical); pick(POOLS.squadCritical); }
  else if (dressingRoom < 0.5)  { pick(POOLS.squadLow); }

  // Position headlines
  if (position === 1)            { pick(POOLS.topOfLeague); }
  if (position >= 18)            { pick(POOLS.relegation); pick(POOLS.relegation); }

  // Win rate
  const wr = matchesPlayed > 0 ? wins / matchesPlayed : 0.5;
  if (wr >= 0.6)                 { pick(POOLS.winRateHigh); }
  else if (wr < 0.3 && matchesPlayed >= 5) { pick(POOLS.winRateLow); }

  // Fill remaining slots with generic pool
  while (selected.length < 10) pick(POOLS.generic);

  return selected.slice(0, 10);
}

export async function GET() {
  return NextResponse.json({ items: POOLS.generic.slice(0, 10) });
}

export async function POST(req: NextRequest) {
  const { boardSupport, fanSupport, dressingRoom, mode, position, wins, losses, matchesPlayed } =
    await req.json() as {
      boardSupport:   number;
      fanSupport:     number;
      dressingRoom:   number;
      mode:           string;
      position:       number;
      wins:           number;
      losses:         number;
      matchesPlayed:  number;
    };

  // ── Fallback path (AI disabled) ───────────────────────────────────────────
  if (FORCE_FALLBACK) {
    const items = buildContextualNews(boardSupport, fanSupport, dressingRoom, position, wins, losses, matchesPlayed);
    return NextResponse.json({ items });
  }

  // ── AI path ───────────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ items: buildContextualNews(boardSupport, fanSupport, dressingRoom, position, wins, losses, matchesPlayed) });
  }

  const level = (v: number) => v < 0.3 ? 'CRITICAL' : v < 0.5 ? 'LOW' : v > 0.7 ? 'HIGH' : 'STABLE';

  const prompt = `Generate 10 explosive football tabloid breaking news headlines for a manager under pressure.

Context:
- Career mode: ${mode}
- League position: ${position}th
- Record after ${matchesPlayed} games: W${wins} L${losses}
- Board confidence: ${level(boardSupport)} (${Math.round(boardSupport * 100)}%)
- Fan support: ${level(fanSupport)} (${Math.round(fanSupport * 100)}%)
- Squad morale: ${level(dressingRoom)} (${Math.round(dressingRoom * 100)}%)

Rules for each headline:
1. Start with an ALL-CAPS dramatic word (BOMBSHELL/EXCLUSIVE/MELTDOWN/CRISIS/CHAOS/HOT MIC/REVEALED/SHOCK/FURIOUS/ULTIMATUM/STANDOFF/BREAKING) followed by a colon
2. Reference fictional manager names and clubs (not real ones)
3. Reflect the current crisis context above — make headlines feel relevant
4. Max 18 words per headline

Return ONLY a JSON array of 10 strings. No other text.`;

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
        max_tokens: 700,
        system:     'You generate breaking news ticker headlines for a football manager simulation. Return only a JSON array of strings.',
        messages:   [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error('api error');

    const data = await res.json() as { content: Array<{ text: string }> };
    const text  = data.content?.[0]?.text?.trim() ?? '[]';
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('no array');

    const items = JSON.parse(match[0]) as string[];
    if (!Array.isArray(items) || items.length < 3) throw new Error('bad data');

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: buildContextualNews(boardSupport, fanSupport, dressingRoom, position, wins, losses, matchesPlayed) });
  }
}
