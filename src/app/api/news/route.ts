/**
 * GET  /api/news  — static fallback headlines
 * POST /api/news  — context-aware template headlines (no AI)
 * Template engine: fast, free, zero latency.
 */

import { NextRequest, NextResponse } from 'next/server';

// Contextual template blocks — {team} and {manager} are filled at runtime
const BOARD_STABLE = [
  "EXCLUSIVE: Board back manager ahead of crucial run-in — no sacking imminent",
  "SOURCES: Chairman reaffirms contract commitment in private meeting",
  "REVEALED: Club hierarchy satisfied with direction despite mixed results",
];
const BOARD_LOW = [
  "BOMBSHELL: Board growing restless as results fail to materialise — sources",
  "EXCLUSIVE: Emergency shareholder call held behind closed doors amid pressure",
  "MELTDOWN: Chairman demands meeting after latest result — sources",
];
const BOARD_CRITICAL = [
  "BREAKING: Board privately discussing managerial options — interview process begun",
  "CRISIS: Ownership group to hold emergency vote on manager's future — sources",
  "SHOCK: Club in contact with replacement candidates as board confidence hits zero",
];
const FANS_STABLE = [
  "CROWD: Season ticket renewals up 12% as fans back the club's direction",
  "POSITIVE: Supporters' trust releases statement backing current management",
  "POLL: 64% of fans satisfied with manager's approach — survey",
];
const FANS_LOW = [
  "FURIOUS: Supporter groups call for change after run of poor results",
  "DISCONTENT: Online petition calling for board action reaches 4,000 signatures",
  "BANNER: Ultras planning visible protest at next home fixture — sources",
];
const FANS_CRITICAL = [
  "CHAOS: Protests at training ground as fans demand immediate action",
  "WALKOUT: Away-end boycott planned for next fixture — supporter group",
  "REVOLT: Fan coalition calls for entire board and manager to resign",
];
const SQUAD_STABLE = [
  "TRAINING: Squad spirits high ahead of crucial fixtures — insider",
  "EXCLUSIVE: Players back the manager's methods, say dressing room sources",
  "REVEALED: Team-building session boosts squad unity ahead of run-in",
];
const SQUAD_LOW = [
  "LOCKER ROOM: Players frustrated with training ground atmosphere — sources",
  "STANDOFF: Senior players requesting meeting with board — reports",
  "HOT MIC: Training ground argument captured by journalist's microphone",
];
const SQUAD_CRITICAL = [
  "MELTDOWN: Multiple players reportedly refuse to attend optional training session",
  "REVOLT: Dressing room factions emerge as morale reaches crisis point",
  "EXPOSED: Leaked voice note reveals extent of squad discontent",
];
const POSITION_HIGH = [
  "TITLE RACE: Momentum building as top clubs watch nervously",
  "FORM: Bookmakers shorten odds for league honours",
  "EXCLUSIVE: European scouts watching closely after impressive recent run",
];
const POSITION_MID = [
  "FORM GUIDE: A mixed run of results keeps the mid-table picture unclear",
  "ANALYSIS: Expected Points model suggests current form is unsustainable",
  "FOCUS: All eyes on the next fixture as the table tightens",
];
const POSITION_LOW = [
  "CRISIS: Relegation battle intensifies as gap to safety narrows",
  "PRESSURE: Survival odds shorten as form fails to improve — markets",
  "DRAMA: Drop zone inches closer after another week without three points",
];
const GENERIC = [
  "TRANSFER: Star midfielder linked with summer move — agent talks confirmed",
  "INJURY: Key player faces scan after training ground knock — sources",
  "MEDICAL: Club physio department under scrutiny after latest setbacks",
  "RIVAL: Neighbouring club make approach for backroom staff member",
  "AGENT: Player's representative spotted at rival ground — speculation mounts",
  "CONTRACT: Talks between club and key player have stalled — sources",
  "SCOUTING: Club monitoring three targets ahead of potential window activity",
  "MEDIA: Manager's post-match comments spark fresh debate — reaction",
  "DATA: Analytics department flags key concern ahead of next fixture",
  "EXCLUSIVE: Club considering managerial structure review in the summer",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildContextualNews(
  boardSupport: number,
  fanSupport: number,
  dressingRoom: number,
  position: number,
): string[] {
  const items: string[] = [];

  // Board headline
  if (boardSupport < 0.25) items.push(pick(BOARD_CRITICAL));
  else if (boardSupport < 0.45) items.push(pick(BOARD_LOW));
  else items.push(pick(BOARD_STABLE));

  // Fan headline
  if (fanSupport < 0.25) items.push(pick(FANS_CRITICAL));
  else if (fanSupport < 0.45) items.push(pick(FANS_LOW));
  else items.push(pick(FANS_STABLE));

  // Squad headline
  if (dressingRoom < 0.25) items.push(pick(SQUAD_CRITICAL));
  else if (dressingRoom < 0.45) items.push(pick(SQUAD_LOW));
  else items.push(pick(SQUAD_STABLE));

  // Position headline
  if (position <= 4) items.push(pick(POSITION_HIGH));
  else if (position <= 12) items.push(pick(POSITION_MID));
  else items.push(pick(POSITION_LOW));

  // Generic filler
  const shuffled = [...GENERIC].sort(() => Math.random() - 0.5);
  items.push(...shuffled.slice(0, 6));

  return items.slice(0, 10);
}

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
  const { boardSupport, fanSupport, dressingRoom, position } =
    await req.json() as {
      boardSupport:  number;
      fanSupport:    number;
      dressingRoom:  number;
      position:      number;
      mode:          string;
      wins:          number;
      losses:        number;
      matchesPlayed: number;
    };

  const items = buildContextualNews(boardSupport, fanSupport, dressingRoom, position);
  return NextResponse.json({ items });
}
