/**
 * POST /api/match-take
 * Returns a sardonic one-liner for the post-match result screen.
 * Pure template engine — no AI dependency, zero latency.
 */

import { NextRequest, NextResponse } from 'next/server';

const TEMPLATES: Record<'win' | 'draw' | 'loss', string[]> = {
  win: [
    "{user} grind out three points against {opp}. Nobody looked convinced, but the scoreboard did.",
    "A {user} win. {opp} will have questions to answer. So will the victors, frankly.",
    "{user} take the points from {opp}. The performance raised questions the result cannot answer.",
    "{opp} leave empty-handed. {user} leave with three points and very few answers.",
    "All three points for {user}. {opp} created enough to feel aggrieved about it.",
    "{user} edge out {opp} in a match that will not feature in the season's highlight reel.",
    "Efficient. Functional. Occasionally unconvincing. {user} win, and that is enough.",
    "{opp} were better than the scoreline. {user} were better than they needed to be.",
    "Three points secured by {user}. {opp} will need to do some soul-searching.",
    "{user} find a way. {opp} find nothing. The table tells the rest of the story.",
  ],
  draw: [
    "{user} and {opp} share the spoils in a match that deserved a winner — just not either side.",
    "Honours even between {user} and {opp}. Neither camp is celebrating.",
    "A draw at {opp}. A point gained, depending on your perspective. Or one dropped.",
    "{user} and {opp} play out a stalemate. The draw is the most honest result available.",
    "One each. Both managers will claim they deserved more. Both are wrong.",
    "{user} and {opp} couldn't be separated. The table remains equally unimpressed.",
    "A point apiece. {opp} will feel it's two dropped. {user} may feel the same.",
    "{user} rescue a draw from {opp}. Whether that counts as progress is a matter of debate.",
    "Stalemate. The referee added four minutes and both sides wasted them.",
    "{opp} equalise. {user} can't find a winner. A point each, two clubs left wanting.",
  ],
  loss: [
    "{opp} dismantle {user} with a ruthlessness that suggested the result was never in doubt.",
    "{user} lose to {opp}. The scoreline was accurate. The performance was not flattering.",
    "An {opp} win against a {user} side that offered very little in the way of resistance.",
    "{user} fall to {opp}. The tactics, the execution, the result — all need examining.",
    "{opp} outclass {user}. The post-match press conference will be a testing occasion.",
    "{user} undone by {opp}. Three points they can ill afford to surrender.",
    "A heavy defeat for {user} at the hands of {opp}. Questions will be asked. Loudly.",
    "{opp} were simply better in every department. {user} have work to do.",
    "Full time: a defeat for {user} that the dressing room will not quickly forget.",
    "{opp} win convincingly. {user} can have no complaints. They tried to register one anyway.",
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillTemplate(template: string, userTeam: string, opponentTeam: string): string {
  return template.replace(/\{user\}/g, userTeam).replace(/\{opp\}/g, opponentTeam);
}

export async function POST(req: NextRequest) {
  const { result, userTeam, opponentTeam } = await req.json() as {
    result: 'win' | 'draw' | 'loss';
    userTeam: string;
    opponentTeam: string;
  };

  const pool = TEMPLATES[result] ?? TEMPLATES.draw;
  const take = fillTemplate(pick(pool), userTeam, opponentTeam);
  return NextResponse.json({ take });
}
