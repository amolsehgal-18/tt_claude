"use client"

import React, { useState, useEffect } from 'react';
import { Mic } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PressConferenceResult {
  reaction:   string;
  impacts:    { board: number; fans: number; squad: number };
  psychDelta: { TF: number; D: number; MP: number; MM: number; TT: number };
}

interface PressConferenceCardProps {
  question:   string;
  onComplete: (result: PressConferenceResult) => void;
}

// ─── Journalist roster ────────────────────────────────────────────────────────

const JOURNALISTS = [
  { name: 'Sarah Chen',    outlet: 'Sky Sports'   },
  { name: 'Marcus Webb',   outlet: 'BBC Sport'    },
  { name: 'Priya Sharma',  outlet: 'The Athletic' },
  { name: 'James Hartley', outlet: 'talkSPORT'   },
  { name: 'Lena Köhler',   outlet: 'ESPN FC'     },
  { name: 'Rui Fonseca',   outlet: 'Sky Sports'   },
  { name: 'Donna Clarke',  outlet: 'BBC Sport'    },
  { name: 'Tom Ashworth',  outlet: 'The Guardian' },
];

function pickJournalist() {
  return JOURNALISTS[Math.floor(Math.random() * JOURNALISTS.length)];
}

// ─── Crowd reactions ──────────────────────────────────────────────────────────

const CROWD_REACTIONS: Record<string, string[]> = {
  combustible: ['😤', '😮', '🔥', '👀'],
  neutral:     ['🤔', '👏', '📝', '🎤'],
  composed:    ['👏', '🤝', '💬', '📋'],
};

// ─── Question pool ────────────────────────────────────────────────────────────

const QUESTIONS = [
  "You've had some difficult results lately. What's your message to the fans right now?",
  "The board are watching closely. How do you respond to reports of growing unrest?",
  "Your tactical approach has been questioned widely. Care to explain your philosophy?",
  "Players have reportedly raised concerns in training. How do you address that?",
  "There's talk of transfers. What do you say to players uncertain about their futures?",
  "The fans have been vocal about performances. Do you think they're right to be concerned?",
  "What's your honest assessment of where this club is heading under your management?",
  "Rumours of a dressing room split. What's the atmosphere really like behind closed doors?",
  "How do you respond to critics who say your approach has become too predictable?",
  "You've taken some bold decisions recently. Any regrets?",
  "What would success look like at the end of this season for you personally?",
  "Are you worried about your job?",
  "The board has gone unusually quiet publicly. What conversations have you had with them?",
  "Your win rate is under pressure. Is now the right time for a change in approach?",
  "How important is fan trust to you as a manager? Be honest.",
];

export function getRandomPressQuestion(): string {
  return QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
}

// ─── Playbook cards (text shifts with tone dial 0=composed → 100=combustible) ─

function getPlaybookCards(tone: number) {
  const hot  = tone > 65;
  const mild = tone > 35;
  return [
    {
      label: 'DEFLECT',
      sub:   'Redirect & move on',
      text:  hot
        ? "These questions miss the point. We focus forward — not on the noise."
        : mild
        ? "We stay in our lane. The work will answer the questions better than words."
        : "We focus on what we can control. Next game, next performance.",
    },
    {
      label: 'TAKE CHARGE',
      sub:   'Own it & lead',
      text:  hot
        ? "I own every decision here. I make the calls — that doesn't change."
        : mild
        ? "Full responsibility sits with me. We analyse, we adapt, we improve."
        : "I take accountability. We're working through it and we'll get it right.",
    },
    {
      label: 'FIGHT BACK',
      sub:   'Push back hard',
      text:  hot
        ? "I reject that framing entirely. Come back with real questions."
        : mild
        ? "The narrative doesn't match what I see in training every day."
        : "The stats tell a different story. We trust the process and the people.",
    },
  ];
}

// ─── Dial gradient based on tone ──────────────────────────────────────────────

function dialColor(tone: number) {
  if (tone < 35) return '#73D2DE';
  if (tone < 65) return '#FBB13C';
  return '#D81159';
}

// ─── Component ────────────────────────────────────────────────────────────────

export const PressConferenceCard = ({ question, onComplete }: PressConferenceCardProps) => {
  const [tone,          setTone]          = useState(50);
  const [loading,       setLoading]       = useState(false);
  const [reaction,      setReaction]      = useState<string | null>(null);
  const [timeLeft,      setTimeLeft]      = useState(5);
  const [crowdEmoji,    setCrowdEmoji]     = useState<string | null>(null);
  const [journalist]                      = useState(() => pickJournalist());

  const cards = getPlaybookCards(tone);

  // 5-second countdown — auto No Comment on expiry
  useEffect(() => {
    if (reaction || loading) return;
    if (timeLeft <= 0) { submit('', true); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, reaction, loading]);

  const submit = async (answer: string, noComment = false) => {
    if (loading || reaction) return;
    setLoading(true);
    // Show crowd reaction emoji immediately before API returns
    const toneLabel = tone > 65 ? 'combustible' : tone > 35 ? 'neutral' : 'composed';
    const pool = CROWD_REACTIONS[toneLabel];
    setCrowdEmoji(pool[Math.floor(Math.random() * pool.length)]);
    setTimeout(() => setCrowdEmoji(null), 1600);
    try {
      const res  = await fetch('/api/press-conference', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ question, answer: noComment ? '' : answer, noComment }),
      });
      const data = await res.json() as PressConferenceResult;
      setReaction(data.reaction);
      setTimeout(() => onComplete(data), 2200);
    } catch {
      onComplete({ reaction: '', impacts: { board: 0, fans: 0, squad: 0 }, psychDelta: { TF: 0, D: 0, MP: 0, MM: 0, TT: 0 } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Thumb styling for range input */}
      <style>{`
        .tone-dial::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 0 6px rgba(0,0,0,0.5);
          cursor: pointer;
        }
        .tone-dial::-moz-range-thumb {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: white;
          border: none;
          cursor: pointer;
        }
      `}</style>

      {/* Crowd reaction emoji flash */}
      {crowdEmoji && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none animate-in fade-in zoom-in-50 duration-200">
          <div className="text-[80px] opacity-80 animate-out fade-out zoom-out duration-700"
            style={{ filter: 'drop-shadow(0 0 24px rgba(251,177,60,0.6))' }}>
            {crowdEmoji}
          </div>
        </div>
      )}

      <div className="w-full max-w-[310px] flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* ── Header ── */}
        <div className="flex items-center gap-2 px-1">
          <Mic className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#FBB13C' }} />
          <span className="text-[9px] font-headline font-black uppercase tracking-[3px]" style={{ color: '#FBB13C' }}>
            Press Conference
          </span>
          <div className="w-1 h-1 rounded-full blink-dot ml-0.5" style={{ background: '#FBB13C' }} />
          {/* Countdown */}
          {!reaction && (
            <div
              className="ml-auto text-[10px] font-code font-bold tabular-nums"
              style={{ color: timeLeft <= 2 ? '#D81159' : 'rgba(255,255,255,0.35)', transition: 'color 0.3s', minWidth: '1.5ch' }}
            >
              {timeLeft}s
            </div>
          )}
        </div>

        {/* ── Question card ── */}
        <div
          className="rounded-xl px-3 py-1.5 border"
          style={{
            background:  'linear-gradient(150deg,#141820 0%,#0D1016 100%)',
            borderColor: 'rgba(251,177,60,0.22)',
            boxShadow:   '0 12px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5 pb-1.5" style={{ borderBottom: '1px solid rgba(251,177,60,0.12)' }}>
            <span className="font-headline font-black text-[9px] uppercase tracking-[2px]" style={{ color: '#FBB13C' }}>{journalist.name}</span>
            <span className="text-[8px] uppercase tracking-widest opacity-40 font-headline">— {journalist.outlet}</span>
          </div>
          <p className="font-headline font-black text-white leading-snug italic" style={{ fontSize: '13px', fontWeight: 800 }}>
            &ldquo;{question}&rdquo;
          </p>
        </div>

        {/* ── Reaction strip or dial + playbook ── */}
        {reaction ? (
          <div
            className="rounded-xl px-3 py-2 text-center animate-in fade-in zoom-in duration-300"
            style={{ background: 'rgba(251,177,60,0.08)', border: '1px solid rgba(251,177,60,0.18)' }}
          >
            <p className="text-[12px] italic leading-snug" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'rgba(255,255,255,0.65)' }}>
              &ldquo;{reaction}&rdquo;
            </p>
          </div>
        ) : (
          <>
            {/* ── Tone dial ── */}
            <div className="px-1">
              <div className="flex justify-between text-[8px] font-headline font-black uppercase tracking-[2px] mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                <span style={{ color: tone < 35 ? '#73D2DE' : 'rgba(255,255,255,0.35)' }}>Composed</span>
                <span className="text-[8px]" style={{ color: dialColor(tone), transition: 'color 0.2s' }}>
                  {tone < 35 ? '●' : tone < 65 ? '◆' : '🔥'}
                </span>
                <span style={{ color: tone > 65 ? '#D81159' : 'rgba(255,255,255,0.35)' }}>Combustible</span>
              </div>
              <input
                type="range"
                min={0} max={100}
                value={tone}
                onChange={e => setTone(Number(e.target.value))}
                className="tone-dial w-full h-[3px] rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #73D2DE 0%, ${dialColor(tone)} ${tone}%, rgba(255,255,255,0.1) ${tone}%, rgba(255,255,255,0.1) 100%)`,
                  outline: 'none',
                }}
              />
            </div>

            {/* ── Playbook cards ── */}
            <div className="flex flex-col gap-1">
              {cards.map((card, i) => (
                <button
                  key={i}
                  disabled={loading}
                  onClick={() => submit(card.text)}
                  className="w-full text-left rounded-xl px-3 py-1.5 transition-all disabled:opacity-40 active:scale-[0.98]"
                  style={{
                    background:  'rgba(255,255,255,0.03)',
                    border:      '1px solid rgba(255,255,255,0.08)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[8px] font-headline font-black uppercase tracking-[2px]" style={{ color: dialColor(tone) }}>
                      {card.label}
                    </span>
                    <span className="text-[8px] opacity-30 font-headline uppercase tracking-wide">— {card.sub}</span>
                  </div>
                  <div className="text-[10px] font-body leading-snug" style={{ color: 'rgba(255,255,255,0.72)' }}>
                    {card.text}
                  </div>
                </button>
              ))}
            </div>

            {/* ── No comment ── */}
            <button
              onClick={() => submit('', true)}
              disabled={loading}
              className="w-full py-1.5 rounded text-[9px] font-headline font-black uppercase tracking-widest disabled:opacity-40 transition-opacity"
              style={{ border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.25)', background: 'transparent' }}
            >
              No Comment
            </button>
          </>
        )}
      </div>
    </>
  );
};
