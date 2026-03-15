/**
 * GET  /api/news  — static fallback headlines
 * POST /api/news  — AI-generated contextual headlines based on current game state
 */

import { NextRequest, NextResponse } from 'next/server';

const STATIC_NEWS = [
  "BOMBSHELL: Guardiola considered walking out on Man City mid-season over transfer betrayal",
  "EXCLUSIVE: Slot handed £200m war chest after secret FSG emergency summit — sources",
  "MELTDOWN: Arteta confronts Arsenal board in furious 90-minute showdown over squad",
  "SHOCK: Tuchel demands two England starters sold immediately or threatens to quit",
  "CRISIS: Simeone told by Atletico board his contract WON'T be renewed past 2027",
  "FURIOUS: Postecoglou storms out of Spurs training after player refuses to play position",
  "EXCLUSIVE: Conte secretly interviewed for Premier League role while still in Naples",
  "CHAOS: Mourinho texts Real Madrid players directly despite being out of work",
  "BREAKING: Flick reveals Barcelona dressing room split into two factions over star's role",
  "ULTIMATUM: Ancelotti gives Real Madrid 48 hours to sign striker or he walks in January",
  "HOT MIC: Amorim caught on camera ranting at Man United board after training session",
  "STANDOFF: Gasperini locks himself in office as Atalanta crisis deepens — reports",
  "EXCLUSIVE: Nagelsmann turned down £15m PSG deal to remain with Germany national side",
  "REVEALED: Kompany privately threatened to resign if Bayern miss Bundesliga title",
];

export async function GET() {
  return NextResponse.json({ items: STATIC_NEWS });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ items: STATIC_NEWS });

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

  const level = (v: number) => v < 0.3 ? 'CRITICAL' : v < 0.5 ? 'LOW' : v > 0.7 ? 'HIGH' : 'STABLE';
  const boardLevel  = level(boardSupport);
  const fanLevel    = level(fanSupport);
  const squadLevel  = level(dressingRoom);

  const crisisLines = [
    boardLevel  === 'CRITICAL' ? 'Board crisis is acute — ownership tension, sacking rumours imminent.' : '',
    boardLevel  === 'LOW'      ? 'Board relations are strained — growing pressure from the hierarchy.' : '',
    fanLevel    === 'CRITICAL' ? 'Fan protests and walkout threats dominate the headlines.' : '',
    fanLevel    === 'LOW'      ? 'Supporter discontent is building — banner protests brewing.' : '',
    squadLevel  === 'CRITICAL' ? 'Dressing room rebellion — players reportedly refusing instructions.' : '',
    squadLevel  === 'LOW'      ? 'Squad morale fractured — training ground bust-ups reported.' : '',
  ].filter(Boolean).join(' ');

  const prompt = `Generate 10 explosive football tabloid breaking news headlines for a manager under pressure.

Context:
- Career mode: ${mode}
- League position: ${position}th
- Record after ${matchesPlayed} games: W${wins} L${losses}
- Board confidence: ${boardLevel} (${Math.round(boardSupport * 100)}%)
- Fan support: ${fanLevel} (${Math.round(fanSupport * 100)}%)
- Squad morale: ${squadLevel} (${Math.round(dressingRoom * 100)}%)
${crisisLines ? `\nCurrent crises: ${crisisLines}` : ''}

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
    return NextResponse.json({ items: STATIC_NEWS });
  }
}
