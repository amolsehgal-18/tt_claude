"use client"

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { getSoundManager } from '@/lib/sound-manager';
import type { LastDecision } from '@/lib/game-logic';

interface MatchRadarProps {
  userTeam: string;
  opponentTeam: string;
  result: 'win' | 'draw' | 'loss' | null;
  onComplete: () => void;
  hotTake?: string | null;
  nextOpponent?: string;
  nextGW?: number;
  isLastMatch?: boolean;
  winChance?: number;
  verdict?: string;
  lastDecisions?: LastDecision[];
  varCardsLeft?: number;
  momentumBuffer?: number[];
  onVARUse?: (newResult: 'win' | 'draw') => void;
  kitPrimary?:   string;
  kitSecondary?: string;
}

interface Player {
  x: number; y: number; vx: number; vy: number;
  team: 'user' | 'opp'; color: string; baseX: number; baseY: number;
}

type VARState = 'idle' | 'available' | 'checking' | 'success' | 'fail';

export const MatchRadar = ({
  userTeam, opponentTeam, result, onComplete, hotTake,
  nextOpponent, nextGW, isLastMatch, winChance, verdict, lastDecisions,
  varCardsLeft = 0, momentumBuffer = [], onVARUse,
  kitPrimary, kitSecondary,
}: MatchRadarProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showFinal, setShowFinal]     = useState(false);
  const [commentary, setCommentary]   = useState("0' Kick-off! The tactical battle begins.");
  const [varState, setVarState]       = useState<VARState>('idle');
  const [effectiveResult, setEffectiveResult] = useState(result);

  // Capture initial result so VAR use (which changes the prop) doesn't restart the timer
  const initialResultRef = useRef(result);
  const stopCrowdRef = useRef<(() => void) | null>(null);

  // Start crowd ambience on mount, stop when final card shows
  useEffect(() => {
    const stop = getSoundManager().startCrowdAmbience();
    stopCrowdRef.current = stop;
    return () => { stop(); };
  }, []);

  const score = useMemo(() => {
    const r = effectiveResult;
    let u = 0, o = 0;
    if (r === 'win')       { u = Math.floor(Math.random() * 2) + 1; o = Math.floor(Math.random() * u); }
    else if (r === 'draw') { u = Math.floor(Math.random() * 2); o = u; }
    else                   { o = Math.floor(Math.random() * 2) + 1; u = Math.floor(Math.random() * o); }
    return { user: u, opp: o };
  }, [effectiveResult]);

  const matchEvents = useMemo(() => {
    // Use initialResultRef so VAR result-flip doesn't recompute/restart commentary
    const result = initialResultRef.current; // eslint-disable-line react-hooks/exhaustive-deps
    const WIN_PATHS = [
      [{ trigger:0, text:"0' Kick off. Your side looks hungry from the first whistle." },
       { trigger:1.4, text:"28' CHANCE — keeper spills it but scrambles clear." },
       { trigger:2.5, text:"54' THE BREAKTHROUGH. Clinical finish. The crowd erupts." },
       { trigger:4.0, text:"90' Holding on. They're throwing bodies forward. Stand firm." }],
      [{ trigger:0, text:"0' Packed stadium. Tension you could cut with a knife." },
       { trigger:1.4, text:"33' Dominant spell — they can't get near your midfield." },
       { trigger:2.6, text:"61' TWO GOALS UP. The game is yours to lose." },
       { trigger:4.0, text:"89' They pull one back. Nervy finish. Hang on." }],
      [{ trigger:0, text:"0' Kick off. Your tactics set up perfectly for this." },
       { trigger:1.5, text:"37' Early pressure paying off. They look rattled." },
       { trigger:2.7, text:"71' THE GOAL. Your striker holds his nerve. Get in." },
       { trigger:4.0, text:"90+2' The referee checks his watch. Deep breath." }],
    ];
    const DRAW_PATHS = [
      [{ trigger:0, text:"0' Kick off. Even contest from the first touch." },
       { trigger:1.4, text:"26' Dominant spell. You're creating but not converting." },
       { trigger:2.5, text:"56' They equalise against the run of play. Gut punch." },
       { trigger:4.0, text:"89' Nothing separates them. A point each." }],
      [{ trigger:0, text:"0' Cagey opening. Neither side willing to commit." },
       { trigger:1.5, text:"38' You take the lead. Fans off their seats." },
       { trigger:2.6, text:"62' They level. Frustrating. It was coming." },
       { trigger:4.0, text:"90' No winner. Honours even on a hard-fought afternoon." }],
    ];
    const LOSS_PATHS = [
      [{ trigger:0, text:"0' Kick off. They mean business early." },
       { trigger:1.2, text:"14' They score. Early setback. Regroup." },
       { trigger:2.5, text:"67' You throw the attackers on. Need a goal." },
       { trigger:4.0, text:"90' It's not enough. Three points surrendered." }],
      [{ trigger:0, text:"0' Kick off. Difficult conditions, difficult opponent." },
       { trigger:1.4, text:"31' Under the cosh. They're all over you." },
       { trigger:2.6, text:"73' A second goal kills it. Back to the drawing board." },
       { trigger:4.0, text:"90' Whistle goes. The dressing room will be quiet tonight." }],
      [{ trigger:0, text:"0' Kick off. Nothing going your way from the start." },
       { trigger:1.3, text:"22' They hit the post. Lucky escape. For now." },
       { trigger:2.5, text:"55' They punish you. Composed finish. Harsh." },
       { trigger:4.0, text:"90+4' No comeback today. Regroup, refocus." }],
    ];
    const pool = result === 'win' ? WIN_PATHS : result === 'loss' ? LOSS_PATHS : DRAW_PATHS;
    return pool[Math.floor(Math.random() * pool.length)];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — commentary is fixed to initial result; VAR flip must not restart it

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || showFinal) return;

    let animationFrame: number;
    let setupFrame: number;

    setupFrame = requestAnimationFrame(() => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width > 10 ? rect.width : 300;
      const height = rect.height > 10 ? rect.height : 225;
      canvas.width = width * dpr; canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      const mx = 6, my = 6, pw = width - mx*2, ph = height - my*2;

      const userFormation = [[0.08,0.5],[0.22,0.25],[0.22,0.42],[0.22,0.58],[0.22,0.75],[0.42,0.2],[0.42,0.4],[0.42,0.6],[0.42,0.8],[0.65,0.35],[0.65,0.65]];
      const oppFormation  = [[0.92,0.5],[0.78,0.25],[0.78,0.42],[0.78,0.58],[0.78,0.75],[0.58,0.2],[0.58,0.4],[0.58,0.6],[0.58,0.8],[0.35,0.35],[0.35,0.65]];
      const players: Player[] = [
        ...userFormation.map(p => ({ x:p[0]*width, y:p[1]*height, vx:0, vy:0, team:'user' as const, color: kitPrimary   ?? '#3b82f6', baseX:p[0]*width, baseY:p[1]*height })),
        ...oppFormation.map(p  => ({ x:p[0]*width, y:p[1]*height, vx:0, vy:0, team:'opp'  as const, color: kitSecondary ?? '#ef4444', baseX:p[0]*width, baseY:p[1]*height })),
      ];
      const ball = { x: width/2, y: height/2, targetPlayerIndex: Math.floor(Math.random()*players.length) };

      const drawPitch = () => {
        ctx.fillStyle = '#1a4a1a'; ctx.fillRect(0,0,width,height);
        const sw = pw/8;
        for (let i=0; i<8; i++) { if (i%2===0) { ctx.fillStyle='rgba(0,0,0,0.07)'; ctx.fillRect(mx+i*sw,my,sw,ph); } }
        ctx.strokeStyle='rgba(255,255,255,0.55)'; ctx.lineWidth=1;
        ctx.strokeRect(mx,my,pw,ph);
        ctx.beginPath(); ctx.moveTo(mx+pw/2,my); ctx.lineTo(mx+pw/2,my+ph); ctx.stroke();
        const cr=Math.round(ph*0.12);
        ctx.beginPath(); ctx.arc(mx+pw/2,my+ph/2,cr,0,Math.PI*2); ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,0.65)'; ctx.beginPath(); ctx.arc(mx+pw/2,my+ph/2,2,0,Math.PI*2); ctx.fill();
        const paD=Math.round(pw*0.157), paH=Math.round(ph*0.593), paY=my+(ph-paH)/2;
        ctx.strokeRect(mx,paY,paD,paH); ctx.strokeRect(mx+pw-paD,paY,paD,paH);
        const gaD=Math.round(pw*0.052), gaH=Math.round(ph*0.269), gaY=my+(ph-gaH)/2;
        ctx.strokeRect(mx,gaY,gaD,gaH); ctx.strokeRect(mx+pw-gaD,gaY,gaD,gaH);
        const ps=Math.round(pw*0.105);
        ctx.fillStyle='rgba(255,255,255,0.65)'; ctx.beginPath(); ctx.arc(mx+ps,my+ph/2,2,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(mx+pw-ps,my+ph/2,2,0,Math.PI*2); ctx.fill();
        [[mx,my,0,Math.PI/2],[mx+pw,my,Math.PI/2,Math.PI],[mx,my+ph,Math.PI*1.5,Math.PI*2],[mx+pw,my+ph,Math.PI,Math.PI*1.5]].forEach(([x,y,s,e]) => {
          ctx.beginPath(); ctx.arc(x as number,y as number,5,s as number,e as number); ctx.stroke();
        });
        const gW=Math.round(ph*0.107), gY=my+(ph-gW)/2;
        ctx.fillStyle='rgba(255,255,255,0.88)'; ctx.fillRect(0,gY,mx,gW); ctx.fillRect(mx+pw,gY,mx,gW);
      };

      const animate = () => {
        drawPitch();
        const target=players[ball.targetPlayerIndex];
        const dx=target.x-ball.x, dy=target.y-ball.y, dist=Math.sqrt(dx*dx+dy*dy);
        if (dist<6) {
          const mates=players.filter((_,i)=>i!==ball.targetPlayerIndex);
          ball.targetPlayerIndex=players.indexOf(mates[Math.floor(Math.random()*mates.length)]);
        } else { const sp=Math.min(4,dist*0.12); ball.x+=(dx/dist)*sp; ball.y+=(dy/dist)*sp; }
        players.forEach((p,idx) => {
          const dtb=Math.sqrt((ball.x-p.x)**2+(ball.y-p.y)**2);
          const isT=idx===ball.targetPlayerIndex;
          const act=Math.max(0.35,1.6-dtb/(width*0.28));
          p.x+=(p.baseX-p.x)*0.025+(Math.random()-0.5)*1.1*act;
          p.y+=(p.baseY-p.y)*0.025+(Math.random()-0.5)*1.1*act;
          if(isT){ p.x+=(ball.x-p.x)*0.025; p.y+=(ball.y-p.y)*0.025; }
          p.x=Math.max(mx+4,Math.min(mx+pw-4,p.x)); p.y=Math.max(my+4,Math.min(my+ph-4,p.y));
          ctx.fillStyle=p.color; ctx.shadowBlur=isT?10:0; ctx.shadowColor=p.color;
          ctx.beginPath(); ctx.arc(p.x,p.y,isT?7:6,0,Math.PI*2); ctx.fill();
          ctx.shadowBlur=0; ctx.strokeStyle='rgba(255,255,255,0.45)'; ctx.lineWidth=1; ctx.stroke();
        });
        ctx.fillStyle='#facc15'; ctx.shadowBlur=12; ctx.shadowColor='#facc15';
        ctx.beginPath(); ctx.arc(ball.x,ball.y,4.5,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0; ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.lineWidth=1; ctx.stroke();
        animationFrame=requestAnimationFrame(animate);
      };
      animate();
    });

    return () => {
      cancelAnimationFrame(setupFrame);
      cancelAnimationFrame(animationFrame);
    };
  }, [showFinal]);

  // Commentary + VAR window + whistle + final trigger
  // Ref so timer can read varCardsLeft without it being a dep (prevents restart on VAR use)
  const varCardsLeftRef = useRef(varCardsLeft);
  varCardsLeftRef.current = varCardsLeft;

  useEffect(() => {
    if (showFinal) return;
    const start = Date.now();
    let whistlePlayed = false;
    let varShown = false;
    const timer = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      let currentEvent = matchEvents[0];
      for (let i = matchEvents.length-1; i>=0; i--) {
        if (elapsed >= matchEvents[i].trigger) { currentEvent = matchEvents[i]; break; }
      }
      setCommentary(currentEvent.text);

      // Show VAR button window at 3.0s if losing/drawing and have cards
      const initRes = initialResultRef.current;
      if (!varShown && elapsed >= 3.0 && varCardsLeftRef.current > 0 && (initRes === 'loss' || initRes === 'draw') && varState === 'idle') {
        varShown = true;
        setVarState('available');
      }
      // Whistle at ~4.5s
      if (!whistlePlayed && elapsed >= 4.4) {
        whistlePlayed = true;
        stopCrowdRef.current?.();
        getSoundManager().playFinalWhistle();
      }
      // Show final at 5s — but wait if VAR is mid-review
      if (elapsed >= 5) {
        if (varStateRef.current === 'checking') return; // hold until VAR resolves
        clearInterval(timer);
        setTimeout(() => setShowFinal(true), 400);
      }
    }, 100);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFinal, matchEvents]); // result + varCardsLeft intentionally via refs to avoid timer restart on VAR use

  const varStateRef = useRef<VARState>('idle');
  varStateRef.current = varState;

  const handleVARClick = () => {
    if (varState !== 'available' || !onVARUse) return;
    setVarState('checking');
    setTimeout(() => {
      getSoundManager().playVARDecision(true);
      setVarState('success');
      setEffectiveResult('win');
      onVARUse('win');
    }, 1800);
  };

  if (showFinal) {
    const r = effectiveResult;
    const resultColor  = r==='win'?'#1E6B3C':r==='draw'?'#FBB13C':'#D81159';
    const resultBg     = r==='win'?'rgba(30,107,60,0.12)':r==='draw'?'rgba(251,177,60,0.10)':'rgba(216,17,89,0.10)';
    const resultBorder = r==='win'?'rgba(30,107,60,0.30)':r==='draw'?'rgba(251,177,60,0.25)':'rgba(216,17,89,0.25)';
    const resultLabel  = r==='win'?'⚽ Full Time · Win':r==='draw'?'🤝 Full Time · Draw':'❌ Full Time · Loss';
    const venue = Math.random()>0.5?'Home':'Away';

    // Impact badge helper
    const ImpactBadge = ({ val, label }: { val: number; label: string }) => {
      if (Math.abs(val) < 3) return null;
      const col = val > 0 ? '#1E6B3C' : '#D81159';
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-[2px] rounded text-[7px] font-code font-bold uppercase"
          style={{ background: val>0?'rgba(30,107,60,0.15)':'rgba(216,17,89,0.15)', color: col, border:`1px solid ${val>0?'rgba(30,107,60,0.3)':'rgba(216,17,89,0.3)'}` }}>
          {val > 0 ? '+' : ''}{val} {label}
        </span>
      );
    };

    return (
      <div className="w-full h-full flex flex-col animate-in fade-in duration-300">

        {/* ── Scrollable body ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-2 pb-1 flex flex-col gap-1.5" style={{ scrollbarWidth:'none' }}>

          {/* VAR badge */}
          {varState === 'success' && (
            <div className="rounded-[10px] px-3 py-1.5 flex items-center gap-2 animate-in fade-in duration-400"
              style={{ background:'rgba(30,107,60,0.15)', border:'1px solid rgba(30,107,60,0.3)' }}>
              <span className="text-sm">📺</span>
              <div>
                <div className="text-[7px] font-code uppercase tracking-[3px] text-white/50">VAR Review · Decision Overturned</div>
                <div className="text-[10px] font-headline font-black uppercase text-white">Goal awarded. Result reversed.</div>
              </div>
            </div>
          )}

          {/* ── Score card (compact) ── */}
          <div className="rounded-[14px] px-4 py-3 relative overflow-hidden"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}>
            {/* Full-time pill */}
            <div className="flex justify-center mb-2">
              <span className="inline-flex items-center gap-1 px-3 py-[2px] rounded-full font-code text-[7px] tracking-[3px] uppercase"
                style={{ background:resultBg, border:`1px solid ${resultBorder}`, color:resultColor }}>
                {resultLabel}
              </span>
            </div>
            {/* Scoreline */}
            <div className="flex items-center justify-center gap-3">
              <div className="text-center flex-1">
                <div className="text-[9px] font-headline font-black uppercase tracking-wide text-white mb-0.5">{userTeam}</div>
                <div className="font-headline font-black leading-none text-white" style={{ fontSize:'38px', letterSpacing:'-2px' }}>{score.user}</div>
              </div>
              <div className="font-light text-white/20 pb-0.5" style={{ fontSize:'20px' }}>—</div>
              <div className="text-center flex-1">
                <div className="text-[9px] font-headline font-black uppercase tracking-wide text-white mb-0.5">{opponentTeam}</div>
                <div className="font-headline font-black leading-none text-white" style={{ fontSize:'38px', letterSpacing:'-2px' }}>{score.opp}</div>
              </div>
            </div>
            {/* Hot take */}
            {hotTake && (
              <p className="text-[10px] italic mt-2 leading-snug text-center animate-in fade-in duration-500 text-white/75"
                style={{ fontFamily:"'Barlow Condensed', sans-serif" }}>
                &ldquo;{hotTake}&rdquo;
              </p>
            )}
          </div>

          {/* ── Manager analysis ── */}
          {verdict && (
            <div className="rounded-[10px] px-3 py-2 animate-in fade-in duration-600"
              style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderLeft:`3px solid ${resultColor}` }}>
              <div className="text-[7px] font-code uppercase tracking-[3px] mb-1 text-white/50">Manager Analysis</div>
              <p className="text-[11px] italic leading-snug text-white"
                style={{ fontFamily:"'Barlow Condensed', sans-serif" }}>
                &ldquo;{verdict}&rdquo;
              </p>
            </div>
          )}

          {/* ── Decisions this gameweek ── */}
          {lastDecisions && lastDecisions.length > 0 && (
            <div className="rounded-[10px] overflow-hidden"
              style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)' }}>
              <div className="px-3 py-1" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-[7px] font-code uppercase tracking-[3px] text-white/60">
                  Your Decisions This Gameweek
                </span>
              </div>
              {lastDecisions.map((d, i) => (
                <div key={i} className="px-3 py-1.5" style={{ borderBottom: i < lastDecisions.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  {/* Scenario + choice on two compact lines */}
                  <div className="text-[8px] font-headline font-black uppercase text-white leading-tight truncate">
                    {d.scenario.length > 55 ? d.scenario.slice(0,55)+'…' : d.scenario}
                  </div>
                  <div className="flex items-start gap-1 mt-0.5">
                    <span className="text-[8px] font-code text-white/40 flex-shrink-0 mt-px">→</span>
                    <span className="text-[8px] font-grotesk text-white leading-tight line-clamp-1">
                      {d.chosenOption.length > 50 ? d.chosenOption.slice(0,50)+'…' : d.chosenOption}
                    </span>
                  </div>
                  {/* Impact badges always on their own row — full visibility */}
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <ImpactBadge val={d.impact.board} label="Board" />
                    <ImpactBadge val={d.impact.fans}  label="Fans" />
                    <ImpactBadge val={d.impact.squad} label="Squad" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Next fixture ── */}
          {nextOpponent && !isLastMatch && (
            <div className="rounded-[10px] px-3 py-2 flex items-center gap-3 relative overflow-hidden"
              style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background:'#FBB13C' }} />
              <div className="flex-shrink-0 pl-2">
                <div className="font-code text-[7px] uppercase tracking-[3px] mb-0.5" style={{ color:'#FBB13C' }}>Up Next</div>
                <div className="font-code text-[9px] font-bold text-white">GW {nextGW}</div>
              </div>
              <div className="w-px h-7 flex-shrink-0" style={{ background:'rgba(255,255,255,0.07)' }} />
              <div className="flex-1 min-w-0">
                <div className="font-code text-[7px] uppercase tracking-[2px] text-white/50">vs</div>
                <div className="text-[14px] font-headline font-black uppercase text-white leading-none truncate">{nextOpponent}</div>
                <div className="font-code text-[7px] uppercase text-white/50 mt-0.5">{venue}</div>
              </div>
              {winChance !== undefined && (
                <div className="flex-shrink-0 text-center">
                  <div className="text-[18px] font-headline font-black leading-none"
                    style={{ color:winChance>=55?'#1E6B3C':winChance>=40?'#FBB13C':'#D81159' }}>
                    {winChance}%
                  </div>
                  <div className="font-code text-[7px] uppercase text-white/50">Win</div>
                </div>
              )}
            </div>
          )}

        </div>{/* end scrollable body */}

        {/* ── Sticky proceed button ── */}
        <div className="flex-shrink-0 px-3 py-2" style={{ background:'#07090F', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onComplete}
            className="w-full py-3 rounded-[12px] text-center font-headline font-black text-[12px] uppercase tracking-[3px]"
            style={{ background:'linear-gradient(135deg,rgba(251,177,60,0.14),rgba(251,177,60,0.04))',
              border:'1px solid rgba(251,177,60,0.28)', color:'#FBB13C' }}>
            {isLastMatch ? '→ Board Meeting — End of Season Review' : `→ Proceed to GW ${nextGW ?? ''}`}
          </button>
        </div>

      </div>
    );
  }

  // ── Simulation view ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-4 w-full h-full justify-center px-4 relative animate-in fade-in duration-300">
      <div className="relative rounded-xl w-full max-w-[340px] aspect-[4/3] overflow-hidden shadow-inner" style={{ background: '#1a4a1a', border: '1px solid rgba(255,255,255,0.1)' }}>
        <canvas ref={canvasRef} width={300} height={225} className="w-full h-full" style={{ background: '#1a4a1a', display: 'block' }} />
        <div className="absolute top-2 right-2">
          <div className="text-[9px] font-headline text-accent/80 uppercase font-black tracking-widest italic animate-pulse">
            LIVE SIMULATION
          </div>
        </div>
      </div>

      <div className="w-full max-w-[300px] text-center min-h-[40px] flex items-center justify-center px-2">
        <span className="text-[17px] font-headline font-black uppercase tracking-tight text-white italic leading-tight">
          {commentary}
        </span>
      </div>

      {/* ── VAR button overlay ── */}
      {(varState === 'available' || varState === 'checking') && (
        <div className="absolute bottom-4 left-4 right-4 animate-in slide-in-from-bottom-4 fade-in duration-400">
          <button
            onClick={handleVARClick}
            disabled={varState === 'checking'}
            className="w-full py-3 rounded-[14px] font-headline font-black uppercase tracking-[3px] text-[12px] transition-all"
            style={{
              background: varState==='checking'
                ? 'rgba(251,177,60,0.08)'
                : 'linear-gradient(135deg,rgba(251,177,60,0.22),rgba(251,177,60,0.08))',
              border:'1px solid rgba(251,177,60,0.5)',
              color: varState==='checking' ? 'rgba(251,177,60,0.5)' : '#FBB13C',
            }}>
            {varState==='checking'
              ? '📺 VAR Under Review…'
              : `📺 Use VAR Card (${varCardsLeft} left)`}
          </button>
          {varState==='available' && (
            <div className="text-center mt-1.5 text-[7px] font-code uppercase tracking-[2px]"
              style={{ color:'rgba(255,255,255,0.25)' }}>
              Momentum decides the outcome
            </div>
          )}
        </div>
      )}
    </div>
  );
};
