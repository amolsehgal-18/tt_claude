"use client"

import React, { useState } from 'react';
import { Mic } from 'lucide-react';
import { SlantedButton } from './slanted-elements';

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

// ─── Component ────────────────────────────────────────────────────────────────

export const PressConferenceCard = ({ question, onComplete }: PressConferenceCardProps) => {
  const [answer,   setAnswer]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);

  const submit = async (noComment = false) => {
    if (loading || reaction) return;
    setLoading(true);
    try {
      const res = await fetch('/api/press-conference', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ question, answer: noComment ? '' : answer, noComment }),
      });
      const data = await res.json() as PressConferenceResult;
      setReaction(data.reaction);
      // Show reaction briefly then complete
      setTimeout(() => onComplete(data), 2200);
    } catch {
      onComplete({
        reaction:   '',
        impacts:    { board: 0, fans: 0, squad: 0 },
        psychDelta: { TF: 0, D: 0, MP: 0, MM: 0, TT: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[300px] flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-1">
        <Mic className="w-4 h-4 flex-shrink-0" style={{ color: '#FBB13C' }} />
        <span
          className="text-[9px] font-headline font-black uppercase tracking-[3px]"
          style={{ color: '#FBB13C' }}
        >
          Press Conference
        </span>
        <div className="w-1 h-1 rounded-full blink-dot ml-1" style={{ background: '#FBB13C' }} />
      </div>

      {/* ── Question card ── */}
      <div
        className="rounded-2xl p-4 border"
        style={{
          background:   'linear-gradient(150deg,#141820 0%,#0D1016 100%)',
          borderColor:  'rgba(251,177,60,0.22)',
          boxShadow:    '0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}
      >
        {/* Card topbar */}
        <div
          className="flex items-center gap-1.5 mb-3 pb-2"
          style={{ borderBottom: '1px solid rgba(251,177,60,0.12)' }}
        >
          <span
            className="font-headline font-black text-[10px] uppercase tracking-[2px]"
            style={{ color: '#FBB13C' }}
          >
            Reporter
          </span>
          <span
            className="text-[9px] uppercase tracking-widest opacity-40 font-headline"
          >
            — Post-match press room
          </span>
        </div>

        <p
          className="font-headline font-black text-white leading-snug italic"
          style={{ fontSize: '15px', fontWeight: 800 }}
        >
          &ldquo;{question}&rdquo;
        </p>
      </div>

      {/* ── Reaction strip (after submit) ── */}
      {reaction ? (
        <div
          className="rounded-xl px-4 py-3 text-center animate-in fade-in zoom-in duration-300"
          style={{
            background: 'rgba(251,177,60,0.08)',
            border:     '1px solid rgba(251,177,60,0.18)',
          }}
        >
          <p
            className="text-[12px] italic leading-snug"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'rgba(255,255,255,0.65)' }}
          >
            &ldquo;{reaction}&rdquo;
          </p>
        </div>
      ) : (
        <>
          {/* ── Textarea ── */}
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Type your response to the press…"
            maxLength={220}
            rows={3}
            className="w-full rounded-xl px-3 py-2.5 text-[12px] font-body text-white/90 resize-none focus:outline-none focus:ring-1"
            style={{
              background:    'rgba(255,255,255,0.05)',
              border:        '1px solid rgba(255,255,255,0.12)',
              lineHeight:    '1.5',
              '--tw-ring-color': '#FBB13C',
            } as React.CSSProperties}
          />
          <div className="text-right text-[9px] font-code opacity-25 -mt-1.5 pr-1">
            {answer.length}/220
          </div>

          {/* ── Buttons ── */}
          <div className="flex gap-2">
            <button
              onClick={() => submit(true)}
              disabled={loading}
              className="flex-1 py-3 rounded text-[10px] font-headline font-black uppercase tracking-widest disabled:opacity-40 transition-opacity"
              style={{
                border:     '1px solid rgba(255,255,255,0.1)',
                color:      'rgba(255,255,255,0.35)',
                background: 'transparent',
              }}
            >
              No Comment
            </button>
            <SlantedButton
              onClick={() => submit(false)}
              disabled={loading || !answer.trim()}
              className="flex-1 py-3 text-[10px] uppercase tracking-widest bg-white text-black font-black disabled:opacity-40"
            >
              {loading ? '…' : 'Respond'}
            </SlantedButton>
          </div>
        </>
      )}
    </div>
  );
};
