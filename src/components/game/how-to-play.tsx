"use client"

import React, { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

// ── Mini visual components (game UI mockups) ──────────────────────────────────

function MiniMeter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-code text-[9px] uppercase tracking-[1px] text-white/50 w-10 text-right flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="font-code text-[9px] text-white/40 w-6 text-right">{value}%</span>
    </div>
  );
}

function MiniSwipeCard({ text, option }: { text: string; option: string }) {
  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <p className="font-grotesk text-[10px] text-white/70 leading-snug">{text}</p>
      <div className="flex gap-1.5">
        <div className="flex-1 rounded py-1 text-center font-headline uppercase text-[8px] tracking-widest"
          style={{ background: 'rgba(216,17,89,0.2)', border: '1px solid rgba(216,17,89,0.4)', color: '#D81159' }}>
          ← Decline
        </div>
        <div className="flex-1 rounded py-1 text-center font-headline uppercase text-[8px] tracking-widest"
          style={{ background: 'rgba(30,107,60,0.2)', border: '1px solid rgba(30,107,60,0.4)', color: '#4ade80' }}>
          Act →
        </div>
      </div>
      {option && (
        <div className="font-code text-[8px] text-white/40 italic">e.g. "{option}"</div>
      )}
    </div>
  );
}

function MiniTriangle() {
  const SIZE = 110;
  const CX = SIZE / 2, CY = SIZE / 2;
  const R = 40;
  const vTop  = { x: CX,              y: CY - R };
  const vRight = { x: CX + R * 0.866, y: CY + R * 0.5 };
  const vLeft  = { x: CX - R * 0.866, y: CY + R * 0.5 };
  const pts = `${vTop.x},${vTop.y} ${vRight.x},${vRight.y} ${vLeft.x},${vLeft.y}`;
  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      <polygon points={pts} fill="rgba(251,177,60,0.08)" stroke="rgba(251,177,60,0.3)" strokeWidth="1.5" />
      <circle cx={vTop.x}   cy={vTop.y}   r="5" fill="#1E6B3C" />
      <circle cx={vRight.x} cy={vRight.y} r="5" fill="#D81159" />
      <circle cx={vLeft.x}  cy={vLeft.y}  r="5" fill="#73D2DE" />
      <text x={vTop.x}   y={vTop.y - 9}   textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.5)" fontFamily="monospace">BOARD</text>
      <text x={vRight.x + 8} y={vRight.y + 3} textAnchor="start" fontSize="7" fill="rgba(255,255,255,0.5)" fontFamily="monospace">FANS</text>
      <text x={vLeft.x - 8}  y={vLeft.y + 3} textAnchor="end"   fontSize="7" fill="rgba(255,255,255,0.5)" fontFamily="monospace">SQUAD</text>
    </svg>
  );
}

function MiniMatchBar() {
  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex justify-between items-center">
        <div className="text-center">
          <div className="font-headline text-white text-lg">1</div>
          <div className="font-code text-[8px] text-white/40">YOU</div>
        </div>
        <div className="flex-1 mx-3">
          <div className="h-px w-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
          <div className="font-code text-[8px] text-white/30 text-center mt-1">LIVE MATCH</div>
        </div>
        <div className="text-center">
          <div className="font-headline text-white text-lg">0</div>
          <div className="font-code text-[8px] text-white/40">OPP</div>
        </div>
      </div>
      <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full" style={{ width: '60%', background: 'linear-gradient(90deg,#1E6B3C,#FBB13C)' }} />
      </div>
      <div className="font-code text-[7px] text-white/25 text-center">Ball possession · player positions · momentum</div>
    </div>
  );
}

function MiniMomentum() {
  const bars = [+8, -4, +12];
  return (
    <div className="flex items-end gap-2 justify-center h-12">
      {bars.map((v, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div className="w-6 rounded-sm"
            style={{
              height: `${Math.abs(v) * 2}px`,
              background: v >= 0 ? 'rgba(30,107,60,0.7)' : 'rgba(216,17,89,0.7)',
              border: `1px solid ${v >= 0 ? '#1E6B3C' : '#D81159'}`,
            }} />
          <span className="font-code text-[7px]" style={{ color: v >= 0 ? '#4ade80' : '#D81159' }}>
            {v > 0 ? '+' : ''}{v}
          </span>
        </div>
      ))}
      <div className="text-[8px] font-code text-white/30 self-center ml-1">→ match</div>
    </div>
  );
}

function ArchetypeList() {
  const archetypes = [
    { name: 'The Architect',    emoji: '🏗️', desc: 'Systems. Data. Control.' },
    { name: 'The Firefighter',  emoji: '🚒', desc: 'Crisis first, questions later.' },
    { name: 'The Philosopher',  emoji: '📖', desc: 'Principled. Occasionally impractical.' },
    { name: 'The Showman',      emoji: '🎭', desc: 'Drama is the strategy.' },
    { name: 'The Pragmatist',   emoji: '🔧', desc: 'Results over aesthetics.' },
    { name: 'The Idealist',     emoji: '🌟', desc: 'Won\'t compromise. Ever.' },
    { name: 'The Survivalist',  emoji: '🛡️', desc: 'Still standing. That\'s enough.' },
  ];
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {archetypes.map(a => (
        <div key={a.name} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="text-sm">{a.emoji}</span>
          <div>
            <div className="font-headline text-white text-[9px] uppercase leading-none">{a.name.replace('The ','')}</div>
            <div className="font-code text-[7px] text-white/35 mt-0.5">{a.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniVAR() {
  return (
    <div className="rounded-xl px-4 py-3 flex items-center gap-3"
      style={{ background: 'rgba(251,177,60,0.08)', border: '1px solid rgba(251,177,60,0.25)' }}>
      <div className="text-2xl">📹</div>
      <div>
        <div className="font-headline uppercase text-[11px] tracking-widest" style={{ color: '#FBB13C' }}>
          VAR REVIEW
        </div>
        <div className="font-code text-[8px] text-white/50 mt-0.5">
          Available when losing or drawing<br />at 3 mins. Always grants a win.
        </div>
      </div>
      <div className="ml-auto font-headline text-[11px] text-white/40 border border-white/20 rounded px-2 py-1">
        USE
      </div>
    </div>
  );
}

function MiniConsequence() {
  return (
    <div className="space-y-1.5">
      {['Rotation Needed', 'Board Scrutiny'].map((flag, i) => (
        <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: 'rgba(216,17,89,0.08)', border: '1px solid rgba(216,17,89,0.2)' }}>
          <span className="text-[10px]">⚡</span>
          <span className="font-headline text-[9px] uppercase tracking-widest text-white/60">CONSEQUENCE</span>
          <span className="font-code text-[8px] text-white/35 ml-1">· {flag}</span>
        </div>
      ))}
      <div className="font-code text-[8px] text-white/25 text-center mt-1">
        Your past decisions surface as new pressure
      </div>
    </div>
  );
}

function MiniPressConf() {
  const options = ['Deflect', 'Take Charge', 'Fight Back'];
  const colors  = ['rgba(115,210,222,0.15)', 'rgba(30,107,60,0.15)', 'rgba(216,17,89,0.15)'];
  const borders = ['rgba(115,210,222,0.3)', 'rgba(30,107,60,0.3)', 'rgba(216,17,89,0.3)'];
  return (
    <div className="space-y-1.5">
      <div className="font-code text-[8px] text-white/35 text-center mb-2">
        "How do you respond to pressure on your squad?"
      </div>
      {options.map((o, i) => (
        <div key={i} className="rounded-lg px-3 py-2 font-headline uppercase text-[10px] tracking-widest text-center text-white/70"
          style={{ background: colors[i], border: `1px solid ${borders[i]}` }}>
          {o}
        </div>
      ))}
    </div>
  );
}

function MiniVoC() {
  return (
    <div className="rounded-xl p-3 space-y-2"
      style={{ background: 'rgba(216,17,89,0.08)', border: '1px solid rgba(216,17,89,0.3)' }}>
      <div className="flex items-center gap-2">
        <span className="text-lg">🗳️</span>
        <div>
          <div className="font-headline uppercase text-[11px] tracking-widest text-white">Vote of Confidence</div>
          <div className="font-code text-[8px] text-white/40">Board support critical</div>
        </div>
      </div>
      <MiniMeter label="Board" value={18} color="#D81159" />
      <div className="font-code text-[8px] text-white/35 text-center">
        Below 25% → emergency board vote triggers
      </div>
    </div>
  );
}

function MiniObjective() {
  const modes = [
    { icon: '🏆', label: 'League Title',       target: 'Finish 1st' },
    { icon: '🌍', label: 'Top 4',              target: 'Finish top 4' },
    { icon: '🔻', label: 'Relegation Battle',  target: 'Finish 17th+' },
    { icon: '📅', label: 'Full Season',        target: 'Finish top 10' },
  ];
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {modes.map(m => (
        <div key={m.label} className="rounded-lg px-2 py-2"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-base mb-0.5">{m.icon}</div>
          <div className="font-headline uppercase text-[9px] text-white/80">{m.label}</div>
          <div className="font-code text-[7px] text-white/35 mt-0.5">{m.target}</div>
        </div>
      ))}
    </div>
  );
}

function MiniProfile() {
  const axes = [
    { key: 'TF',  label: 'Trust vs Fear',     value: 68 },
    { key: 'D',   label: 'Diplomacy',          value: 45 },
    { key: 'MP',  label: 'Media Projection',   value: 72 },
    { key: 'MM',  label: 'Man Management',     value: 55 },
    { key: 'TT',  label: 'Tactical Thinking',  value: 38 },
  ];
  return (
    <div className="space-y-1.5">
      {axes.map(a => (
        <div key={a.key} className="flex items-center gap-2">
          <span className="font-code text-[8px] text-white/40 w-6">{a.key}</span>
          <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="h-full rounded-full" style={{ width: `${a.value}%`, background: '#FBB13C' }} />
          </div>
          <span className="font-code text-[7px] text-white/30 w-4 text-right">{a.value}</span>
        </div>
      ))}
      <div className="font-code text-[8px] text-white/30 text-center pt-1">
        Updated every swipe decision
      </div>
    </div>
  );
}

// ── Tutorial card definitions ─────────────────────────────────────────────────

interface TCard {
  emoji:    string;
  title:    string;
  subtitle: string;
  body:     React.ReactNode;
  visual?:  React.ReactNode;
}

const TUTORIAL_CARDS: TCard[] = [
  {
    emoji:    '🏟️',
    title:    'Welcome to Touchline Tantrum',
    subtitle: 'Every decision has consequences.',
    body: (
      <p className="font-grotesk text-sm text-white/65 leading-relaxed">
        You&apos;re a football manager under pressure. Your job isn&apos;t just tactics —
        it&apos;s politics, psychology, and survival. Every swipe shapes your legacy.
        One wrong move can get you sacked. One right call at the right moment can
        define a career.
      </p>
    ),
  },
  {
    emoji:    '🎯',
    title:    'Pick Your Mission',
    subtitle: 'Four modes, three durations each.',
    body: (
      <p className="font-grotesk text-sm text-white/65 leading-relaxed">
        Choose your objective before kick-off. Each mode sets the target you must hit
        by the final gameweek. Duration controls how many matches you play — 6, 8 or 10.
        Shorter runs are more intense. Longer ones have more room to recover.
      </p>
    ),
    visual: <MiniObjective />,
  },
  {
    emoji:    '🃏',
    title:    'The Scenario Cards',
    subtitle: 'Swipe right to act. Swipe left to decline.',
    body: (
      <p className="font-grotesk text-sm text-white/65 leading-relaxed">
        Every card is a real managerial decision — a training ground row, a transfer
        demand, a player complaint. Swipe <span className="text-green-400 font-semibold">right</span> to act on it.
        Swipe <span className="text-crimson font-semibold" style={{color:'#D81159'}}>left</span> to decline.
        Both choices have consequences. There is no neutral option.
      </p>
    ),
    visual: (
      <MiniSwipeCard
        text="Your captain approaches after training. He wants more creative freedom in the final third."
        option="Give him licence to express himself"
      />
    ),
  },
  {
    emoji:    '📊',
    title:    'Three Support Meters',
    subtitle: 'Board. Fans. Dressing Room.',
    body: (
      <p className="font-grotesk text-sm text-white/65 leading-relaxed">
        Each decision shifts one or more of your three support levels.
        Let any meter drop to zero and you&apos;re sacked.
        The challenge is that what pleases the board often upsets the fans,
        and what the squad wants can horrify the chairman.
      </p>
    ),
    visual: (
      <div className="space-y-2 px-2">
        <MiniMeter label="Board" value={62} color="#1E6B3C" />
        <MiniMeter label="Fans"  value={45} color="#D81159" />
        <MiniMeter label="Squad" value={78} color="#73D2DE" />
      </div>
    ),
  },
  {
    emoji:    '🔺',
    title:    'The Tension Triangle',
    subtitle: 'Balance all three or face the consequences.',
    body: (
      <p className="font-grotesk text-sm text-white/65 leading-relaxed">
        The triangle visualises the live balance between board, fans and squad.
        A healthy triangle is roughly equilateral. When one vertex collapses,
        the shape distorts and the relevant stakeholder turns against you.
        Watch it pulse — that vertex is the one moving.
      </p>
    ),
    visual: (
      <div className="flex justify-center">
        <MiniTriangle />
      </div>
    ),
  },
  {
    emoji:    '📈',
    title:    'Momentum',
    subtitle: 'Last 3 decisions carry into every match.',
    body: (
      <p className="font-grotesk text-sm text-white/65 leading-relaxed">
        Each card has a net impact score. The last three net impacts form your
        momentum buffer. Positive momentum biases your next match result
        toward a win. Negative momentum increases your risk of losing.
        Good decisions before a big match matter.
      </p>
    ),
    visual: <MiniMomentum />,
  },
  {
    emoji:    '⚽',
    title:    'Match Day',
    subtitle: 'Every 3 scenario cards, a match fires.',
    body: (
      <p className="font-grotesk text-sm text-white/65 leading-relaxed">
        When a match triggers, you see a live pitch simulation — 22 players,
        ball physics, crowd ambience. The result is determined by your momentum,
        league position, and the opponent&apos;s strength. Wins move you up
        the table. Losses drop momentum further.
      </p>
    ),
    visual: <MiniMatchBar />,
  },
  {
    emoji:    '📹',
    title:    'VAR Review',
    subtitle: 'A lifeline. Use it wisely.',
    body: (
      <p className="font-grotesk text-sm text-white/65 leading-relaxed">
        When you&apos;re losing or drawing with 3 minutes left in a match,
        a VAR challenge button appears. Tap it to trigger a review.
        VAR always overturns in your favour — the result becomes a win.
        You have limited VAR uses per season, so save them for the moments
        that matter most.
      </p>
    ),
    visual: <MiniVAR />,
  },
  {
    emoji:    '🎤',
    title:    'Press Conference',
    subtitle: 'Every ~6 scenarios, face the press.',
    body: (
      <p className="font-grotesk text-sm text-white/65 leading-relaxed">
        A journalist asks a loaded question. You pick your response style:
        <strong className="text-white"> Deflect</strong> (board safe),
        <strong className="text-white"> Take Charge</strong> (squad boost), or
        <strong className="text-white"> Fight Back</strong> (fan surge, board risk).
        Each choice shifts your psychographic profile and all three meters.
        You can also say &quot;No comment&quot; — the press hates it.
      </p>
    ),
    visual: <MiniPressConf />,
  },
  {
    emoji:    '⚡',
    title:    'Consequence Flags',
    subtitle: 'Your past decisions haunt you.',
    body: (
      <p className="font-grotesk text-sm text-white/65 leading-relaxed">
        Certain decisions trigger hidden consequence flags — tags like
        &quot;Board Scrutiny&quot; or &quot;Rotation Needed&quot; that bias which
        scenario categories surface next. An ⚡ banner on a card means it
        was triggered by something you did earlier. Everything is connected.
      </p>
    ),
    visual: <MiniConsequence />,
  },
  {
    emoji:    '🧠',
    title:    'Your Psychographic Profile',
    subtitle: '8 axes track your managerial DNA.',
    body: (
      <p className="font-grotesk text-sm text-white/65 leading-relaxed">
        Every swipe updates five axes: <strong className="text-white">Trust vs Fear (TF)</strong>,{' '}
        <strong className="text-white">Diplomacy (D)</strong>,{' '}
        <strong className="text-white">Media Projection (MP)</strong>,{' '}
        <strong className="text-white">Man Management (MM)</strong>, and{' '}
        <strong className="text-white">Tactical Thinking (TT)</strong>.
        Press conferences and match outcomes add weight to specific axes.
        Your axis scores determine your archetype.
      </p>
    ),
    visual: <MiniProfile />,
  },
  {
    emoji:    '🎭',
    title:    'The 7 Archetypes',
    subtitle: 'What kind of manager are you, really?',
    body: (
      <p className="font-grotesk text-sm text-white/65 leading-relaxed">
        At the end of each season, your psychographic profile is mapped to one of
        seven archetypes. Your archetype unlocks a specific season verdict and
        shapes how rivals and the board perceive you going into the next season.
      </p>
    ),
    visual: <ArchetypeList />,
  },
  {
    emoji:    '🗳️',
    title:    'Vote of Confidence',
    subtitle: 'Board drops below 25% — things get serious.',
    body: (
      <p className="font-grotesk text-sm text-white/65 leading-relaxed">
        If your board support collapses below 25%, the chairman calls an emergency
        vote. You&apos;re presented with three response options. Answer well and
        the board backs down. Answer badly — or dodge the question — and you
        might not make it to the next match.
      </p>
    ),
    visual: <MiniVoC />,
  },
  {
    emoji:    '📋',
    title:    'The Season Objective',
    subtitle: 'Meet the target or face the axe.',
    body: (
      <p className="font-grotesk text-sm text-white/65 leading-relaxed">
        Your objective is set at the start — finish 1st, top 4, avoid relegation,
        or simply survive a full season. When the final whistle blows on your last
        match, your league position is checked. Miss the target and you&apos;re sacked.
        Meet it and you write your own next chapter.
      </p>
    ),
  },
  {
    emoji:    '✍️',
    title:    'Sign or Move On',
    subtitle: 'What happens after a successful season.',
    body: (
      <p className="font-grotesk text-sm text-white/65 leading-relaxed">
        When you meet the objective, the chairman calls. You can
        <strong className="text-white"> sign a contract extension</strong> — same club,
        new mission — or <strong className="text-white">take a new challenge</strong> with
        a different club. Either way, your career rating, legacy record and archetype
        history carry forward. The decisions accumulate.
      </p>
    ),
    visual: (
      <div className="space-y-2">
        <div className="rounded-xl px-4 py-2.5 flex items-center gap-2"
          style={{ background: 'rgba(30,107,60,0.15)', border: '1px solid rgba(30,107,60,0.35)' }}>
          <span className="text-lg">✍️</span>
          <div>
            <div className="font-headline uppercase text-[10px] tracking-widest text-white">Sign Extension</div>
            <div className="font-code text-[8px] text-white/40">Same club · new mission</div>
          </div>
        </div>
        <div className="rounded-xl px-4 py-2.5 flex items-center gap-2"
          style={{ background: 'rgba(251,177,60,0.1)', border: '1px solid rgba(251,177,60,0.3)' }}>
          <span className="text-lg">✈️</span>
          <div>
            <div className="font-headline uppercase text-[10px] tracking-widest" style={{ color: '#FBB13C' }}>New Challenge</div>
            <div className="font-code text-[8px] text-white/40">New club · legacy intact</div>
          </div>
        </div>
      </div>
    ),
  },
];

// ── Main component ────────────────────────────────────────────────────────────

interface HowToPlayProps {
  onClose: () => void;
}

export function HowToPlay({ onClose }: HowToPlayProps) {
  const [idx, setIdx] = useState(() => {
    if (typeof window === 'undefined') return 0;
    return parseInt(sessionStorage.getItem('tt_tutorial_idx') ?? '0', 10) || 0;
  });
  const touchStartX = useRef<number | null>(null);
  const total = TUTORIAL_CARDS.length;
  const card  = TUTORIAL_CARDS[idx];

  const goNext = useCallback(() => {
    if (idx < total - 1) {
      const next = idx + 1;
      setIdx(next);
      sessionStorage.setItem('tt_tutorial_idx', String(next));
    }
  }, [idx, total]);

  const goPrev = useCallback(() => {
    if (idx > 0) {
      const prev = idx - 1;
      setIdx(prev);
      sessionStorage.setItem('tt_tutorial_idx', String(prev));
    }
  }, [idx]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) delta < 0 ? goNext() : goPrev();
    touchStartX.current = null;
  };

  const isLast = idx === total - 1;
  const isFirst = idx === 0;

  return (
    <div
      className="fixed inset-0 z-[9000] flex flex-col"
      style={{ background: '#07090F' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,1rem)] pt-4 pb-3 flex-shrink-0">
        {/* Progress bar */}
        <div className="flex-1 h-0.5 rounded-full mr-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${((idx + 1) / total) * 100}%`, background: '#FBB13C' }}
          />
        </div>
        {/* Counter */}
        <span className="font-code text-[9px] text-white/30 flex-shrink-0">
          {idx + 1} / {total}
        </span>
        {/* Close */}
        <button onClick={onClose} className="ml-3 p-1 rounded-full flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Card content — scrollable */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="max-w-sm mx-auto space-y-5 py-4">

          {/* Emoji */}
          <div className="text-center text-5xl leading-none pt-2">{card.emoji}</div>

          {/* Title + subtitle */}
          <div className="text-center space-y-1">
            <h2 className="font-headline font-black uppercase text-white leading-tight"
              style={{ fontSize: 'clamp(20px,6vw,28px)', letterSpacing: '-0.5px' }}>
              {card.title}
            </h2>
            <p className="font-code text-[10px] uppercase tracking-[2px] text-white/35">
              {card.subtitle}
            </p>
          </div>

          {/* Divider */}
          <div className="h-px w-16 mx-auto" style={{ background: 'rgba(251,177,60,0.3)' }} />

          {/* Body text */}
          <div className="text-center">{card.body}</div>

          {/* Visual mockup */}
          {card.visual && (
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {card.visual}
            </div>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <div
        className="flex-shrink-0 px-6 pb-[env(safe-area-inset-bottom,1.5rem)] pt-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="max-w-sm mx-auto flex items-center gap-3">
          {/* Back */}
          <button
            onClick={goPrev}
            disabled={isFirst}
            className="flex items-center justify-center w-12 h-12 rounded-xl transition-opacity"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              opacity: isFirst ? 0.3 : 1,
            }}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          {/* Next / Understood */}
          {isLast ? (
            <button
              onClick={() => { sessionStorage.removeItem('tt_tutorial_idx'); onClose(); }}
              className="flex-1 h-12 rounded-xl font-headline font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-opacity active:opacity-80"
              style={{ background: '#FBB13C', color: '#07090F' }}
            >
              <Check className="w-4 h-4" />
              Understood
            </button>
          ) : (
            <button
              onClick={goNext}
              className="flex-1 h-12 rounded-xl font-headline font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-opacity active:opacity-80"
              style={{ background: 'rgba(251,177,60,0.15)', border: '1px solid rgba(251,177,60,0.35)', color: '#FBB13C' }}
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Swipe hint */}
        <p className="text-center font-code text-[8px] text-white/20 uppercase tracking-[2px] mt-2">
          Swipe or tap to navigate
        </p>
      </div>
    </div>
  );
}
