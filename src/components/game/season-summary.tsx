"use client"

/**
 * @fileOverview End-of-Season Summary Card — Concept C
 * Dark cinematic aesthetic + AI-generated manager archetype verdict.
 * Palette: #D81159 | #8F2D56 | #1E6B3C | #FBB13C | #73D2DE | #07090F
 */

import React, { useEffect, useState } from 'react';
import { CAREER_MODES as MODES } from '@/lib/game-logic';
import type { GameState } from '@/lib/game-logic';
import type { PsychProfile, Archetype } from '@/lib/psychProfile';
import { buildVerdictPrompt } from '@/lib/psychProfile';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface SeasonSummaryProps {
  state:        GameState;
  psychProfile: PsychProfile;
  archetype:    Archetype;
  onRestart:    () => void;
}

const ARCHETYPE_TAGS: Record<string, string> = {
  'The Hairdryer':     'Master of the motivational explosion',
  'The Father Figure': 'Loyalty above all else',
  'The Tactician':     'The whiteboard never lies',
  'The Showman':       'The bigger the stage, the better',
  'The Politician':    'Every word is calculated',
  'The Maverick':      'Rules exist to be rewritten',
  'The Pragmatist':    'Results trump everything',
};

function getTrophy(state: GameState): string {
  if (state.isSacked) return '📋';
  const pos = state.currentLeaguePosition;
  if (pos === 1) return '🏆';
  if (pos <= 4)  return '🥇';
  if (pos >= 18) return '😤';
  return '⚽';
}

function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}

async function generateShareImage(
  club: string, archetype: string,
  record: { w: number; d: number; l: number },
  position: number, verdict: string,
): Promise<Blob | null> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const grad = ctx.createLinearGradient(0, 0, 0, 1080);
    grad.addColorStop(0, '#07090F'); grad.addColorStop(0.5, '#0d1117'); grad.addColorStop(1, '#07090F');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1080);

    ctx.strokeStyle = '#FBB13C'; ctx.lineWidth = 2; ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.moveTo(80, 370); ctx.lineTo(1000, 370); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(80, 730); ctx.lineTo(1000, 730); ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    ctx.font = '110px serif';
    ctx.fillText(position === 1 ? '🏆' : position <= 4 ? '🥇' : position >= 18 ? '😤' : '⚽', 540, 295);

    ctx.font = 'bold 60px sans-serif'; ctx.fillStyle = '#FFFFFF';
    ctx.fillText(club.toUpperCase(), 540, 448);

    ctx.font = '34px monospace'; ctx.fillStyle = '#FBB13C';
    ctx.fillText(`${position}${ordinalSuffix(position)} · W${record.w} D${record.d} L${record.l}`, 540, 512);

    const arcGrad = ctx.createLinearGradient(200, 0, 880, 0);
    arcGrad.addColorStop(0, '#FBB13C'); arcGrad.addColorStop(0.5, '#FFFFFF'); arcGrad.addColorStop(1, '#FBB13C');
    ctx.font = 'bold 68px sans-serif'; ctx.fillStyle = arcGrad;
    ctx.fillText(archetype.toUpperCase(), 540, 635);

    ctx.font = 'italic 29px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.55)';
    const words = verdict.split(' '); let line = ''; let y = 798;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > 900 && line) { ctx.fillText(line, 540, y); line = word; y += 40; }
      else { line = test; }
    }
    if (line) ctx.fillText(line, 540, y);

    ctx.font = '27px sans-serif'; ctx.fillStyle = 'rgba(251,177,60,0.5)';
    ctx.fillText('TOUCHLINE TANTRUM', 540, 1020);

    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  } catch { return null; }
}

function PsychBar({ label, value, color, warn }: { label: string; value: number; color: string; warn?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] uppercase tracking-widest flex items-center gap-1"
          style={{ fontFamily: "'Share Tech Mono',monospace", color: 'rgba(255,255,255,0.42)' }}>
          {label}{warn && <span style={{ color: '#D81159' }}>⚠</span>}
        </span>
        <span className="text-[10px]"
          style={{ fontFamily: "'Share Tech Mono',monospace", color: 'rgba(255,255,255,0.28)' }}>
          {Math.round(value)}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function TensionCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1 rounded-lg p-3 text-center" style={{ borderTop: `3px solid ${color}`, background: 'rgba(255,255,255,0.03)' }}>
      <div className="text-2xl font-black" style={{ fontFamily: "'Barlow Condensed',sans-serif", color }}>{Math.round(value)}%</div>
      <div className="text-[9px] uppercase tracking-widest mt-0.5"
        style={{ fontFamily: "'Share Tech Mono',monospace", color: 'rgba(255,255,255,0.32)' }}>{label}</div>
    </div>
  );
}

export const SeasonSummary = ({ state, psychProfile, archetype, onRestart }: SeasonSummaryProps) => {
  const [verdict, setVerdict] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shared,  setShared]  = useState(false);
  const { firestore } = useFirestore();
  const { user }      = useUser();
  const trophy        = getTrophy(state);
  const seasonYear    = new Date().getFullYear();
  const pts           = state.wins * 3 + state.draws;

  useEffect(() => {
    const cacheKey = `tt_verdict_${state.id}`;
    const local = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
    if (local) { setVerdict(local); setLoading(false); return; }

    const go = async () => {
      if (firestore && user) {
        try {
          const snap = await getDoc(doc(firestore, 'verdicts', `${user.uid}_${state.id}`));
          if (snap.exists()) {
            const v = snap.data()?.verdict as string;
            setVerdict(v); localStorage.setItem(cacheKey, v); setLoading(false); return;
          }
        } catch { /* fall through */ }
      }
      try {
        const prompt = buildVerdictPrompt(psychProfile, archetype, { w: state.wins, d: state.draws, l: state.losses }, state.currentLeaguePosition);
        const res  = await fetch('/api/verdict', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, cacheKey }) });
        const data = await res.json() as { verdict?: string };
        const text = data.verdict ?? "A season best described as eventful — the press ran out of adjectives.";
        setVerdict(text); localStorage.setItem(cacheKey, text);
        if (firestore && user) setDocumentNonBlocking(doc(firestore, 'verdicts', `${user.uid}_${state.id}`), { verdict: text, archetype, timestamp: new Date().toISOString() });
      } catch { setVerdict("A season of decisions. Some of them even worked."); }
      finally  { setLoading(false); }
    };
    go();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const blob = await generateShareImage(state.userTeam, archetype, { w: state.wins, d: state.draws, l: state.losses }, state.currentLeaguePosition, verdict ?? '');
      if (!blob) throw new Error('canvas');
      const file = new File([blob], 'touchline-tantrum.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `${state.userTeam} — ${archetype}`, text: `W${state.wins} D${state.draws} L${state.losses} · ${state.currentLeaguePosition}${ordinalSuffix(state.currentLeaguePosition)} · Touchline Tantrum`, files: [file] });
      } else {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setShared(true); setTimeout(() => setShared(false), 3000);
      }
    } catch { /* cancelled */ } finally { setSharing(false); }
  };

  return (
    <div className="min-h-dvh overflow-y-auto" style={{ background: '#07090F' }}>
      <style>{`
        @keyframes trophyFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes verdictPulse{ 0%,100%{opacity:.3} 50%{opacity:.9} }
      `}</style>
      <div className="max-w-sm mx-auto px-5 py-8 space-y-6">

        {/* 1 — Season pill */}
        <div className="flex justify-center">
          <span className="px-4 py-1 rounded-full text-[10px] uppercase tracking-[0.25em]"
            style={{ fontFamily:"'Share Tech Mono',monospace", background:'#FBB13C', color:'#07090F' }}>
            End of Season · {seasonYear - 1}/{String(seasonYear).slice(2)}
          </span>
        </div>

        {/* 2 — Floating trophy */}
        <div className="text-center text-7xl select-none" style={{ animation:'trophyFloat 3s ease-in-out infinite' }}>
          {trophy}
        </div>

        {/* 3 — Club block */}
        <div className="text-center space-y-1">
          <div className="text-sm uppercase tracking-[0.3em]"
            style={{ fontFamily:"'Share Tech Mono',monospace", color:'#FBB13C' }}>
            {state.currentLeaguePosition}{ordinalSuffix(state.currentLeaguePosition)} Place
          </div>
          <div className="uppercase tracking-tight leading-none text-white"
            style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'30px', fontWeight:700 }}>
            {state.userTeam}
          </div>
          <div className="text-[11px] mt-1"
            style={{ fontFamily:"'Share Tech Mono',monospace", color:'rgba(255,255,255,0.32)' }}>
            W{state.wins} · D{state.draws} · L{state.losses} · {pts} pts
          </div>
        </div>

        {/* 4 — Gold divider */}
        <div className="h-px w-full"
          style={{ background:'linear-gradient(90deg,transparent,#FBB13C 30%,#FBB13C 70%,transparent)' }} />

        {/* 5 — Archetype block */}
        <div className="text-center space-y-3">
          <div className="text-[9px] uppercase tracking-[0.4em]"
            style={{ fontFamily:"'Share Tech Mono',monospace", color:'rgba(255,255,255,0.28)' }}>
            You managed like
          </div>
          <div className="uppercase leading-none"
            style={{
              fontFamily:"'Barlow Condensed',sans-serif", fontSize:'36px', fontWeight:900,
              background:'linear-gradient(135deg,#FBB13C 0%,#fff 50%,#FBB13C 100%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            }}>
            {archetype}
          </div>
          {ARCHETYPE_TAGS[archetype] && (
            <div className="text-[11px] italic"
              style={{ fontFamily:"'Barlow Condensed',sans-serif", color:'rgba(255,255,255,0.38)', marginTop:'2px' }}>
              {ARCHETYPE_TAGS[archetype]}
            </div>
          )}
          <div className="min-h-[52px] flex items-center justify-center px-2">
            {loading ? (
              <span className="text-[14px] italic"
                style={{ fontFamily:"'Barlow Condensed',sans-serif", color:'rgba(255,255,255,0.3)', animation:'verdictPulse 1.2s ease-in-out infinite' }}>
                · · ·
              </span>
            ) : (
              <p className="text-[13px] italic leading-snug text-center"
                style={{ fontFamily:"'Barlow Condensed',sans-serif", color:'rgba(255,255,255,0.55)' }}>
                &ldquo;{verdict}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* 6 — Tension triangle */}
        <div className="flex gap-2">
          <TensionCard label="Board" value={psychProfile.board} color="#1E6B3C" />
          <TensionCard label="Fans"  value={psychProfile.fans}  color="#D81159" />
          <TensionCard label="Squad" value={psychProfile.squad} color="#73D2DE" />
        </div>

        {/* 7 — Psych breakdown */}
        <div className="space-y-3">
          <div className="text-[9px] uppercase tracking-[0.3em]"
            style={{ fontFamily:"'Share Tech Mono',monospace", color:'rgba(255,255,255,0.28)' }}>
            Psych Profile
          </div>
          <div className="space-y-3.5">
            <PsychBar label="Tactical Flexibility" value={psychProfile.TF} color="#73D2DE" />
            <PsychBar label="Discipline"           value={psychProfile.D}  color="#1E6B3C" />
            <PsychBar label="Media Presence"       value={psychProfile.MP} color="#FBB13C" />
            <PsychBar label="Man Management"       value={psychProfile.MM} color="#8F2D56" />
            <PsychBar label="Touchline Temper"     value={psychProfile.TT}
              color={psychProfile.TT > 60 ? '#D81159' : '#8F2D56'}
              warn={psychProfile.TT > 60} />
          </div>
        </div>

        {/* 8 — Buttons */}
        <div className="space-y-3 pb-8">
          <button onClick={handleShare} disabled={sharing || loading}
            className="w-full py-4 rounded uppercase tracking-widest text-white font-black text-[13px] disabled:opacity-40 transition-opacity"
            style={{
              fontFamily:"'Barlow Condensed',sans-serif",
              background: shared
                ? 'linear-gradient(135deg,#1E6B3C,#218380)'
                : 'linear-gradient(135deg,#FBB13C,#D81159)',
            }}>
            {sharing ? 'Generating…' : shared ? 'Copied to Clipboard ✓' : 'Share Your Season'}
          </button>
          <button onClick={onRestart}
            className="w-full py-3.5 rounded uppercase tracking-widest text-[12px] font-black transition-colors"
            style={{ fontFamily:"'Barlow Condensed',sans-serif", color:'rgba(255,255,255,0.38)', border:'1px solid rgba(255,255,255,0.1)', background:'transparent' }}>
            New Season
          </button>
        </div>

      </div>
    </div>
  );
};
