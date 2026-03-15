"use client"

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Shield, Target } from 'lucide-react';
import { SlantedButton } from './slanted-elements';

interface MatchRadarProps {
  userTeam: string;
  opponentTeam: string;
  result: 'win' | 'draw' | 'loss' | null;
  onComplete: () => void;
}

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  team: 'user' | 'opp';
  color: string;
  baseX: number;
  baseY: number;
}

export const MatchRadar = ({ userTeam, opponentTeam, result, onComplete }: MatchRadarProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showFinal, setShowFinal] = useState(false);
  const [commentary, setCommentary] = useState("0' Kick-off! The tactical battle begins.");

  const score = useMemo(() => {
    let u = 0, o = 0;
    if (result === 'win') {
      u = Math.floor(Math.random() * 2) + 1;
      o = Math.floor(Math.random() * u);
    } else if (result === 'draw') {
      u = Math.floor(Math.random() * 2);
      o = u;
    } else {
      o = Math.floor(Math.random() * 2) + 1;
      u = Math.floor(Math.random() * o);
    }
    return { user: u, opp: o };
  }, [result]);

  const matchEvents = useMemo(() => [
    { time: 0, text: "0' Kick off! Atmosphere is electric.", trigger: 0 },
    { time: 1.5, text: "31' Fierce battle in the middle of the park.", trigger: 1.5 },
    { time: 2.5, text: "45' Half-time: Tactical adjustments made.", trigger: 2.5 },
    { time: 4, text: "87' Squeaky bum time! Tension mounting.", trigger: 4 }
  ], []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || showFinal) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 300;
    const height = rect.height || 225;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Pitch margins
    const mx = 6, my = 6;
    const pw = width - mx * 2;
    const ph = height - my * 2;

    // Tactical 4-4-2 Formations
    const userFormation = [
      [0.08, 0.5], [0.22, 0.25], [0.22, 0.42], [0.22, 0.58], [0.22, 0.75],
      [0.42, 0.2], [0.42, 0.4], [0.42, 0.6], [0.42, 0.8], [0.65, 0.35], [0.65, 0.65]
    ];
    const oppFormation = [
      [0.92, 0.5], [0.78, 0.25], [0.78, 0.42], [0.78, 0.58], [0.78, 0.75],
      [0.58, 0.2], [0.58, 0.4], [0.58, 0.6], [0.58, 0.8], [0.35, 0.35], [0.35, 0.65]
    ];

    const players: Player[] = [
      ...userFormation.map(pos => ({
        x: pos[0] * width, y: pos[1] * height, vx: 0, vy: 0, team: 'user' as const, color: '#3b82f6',
        baseX: pos[0] * width, baseY: pos[1] * height
      })),
      ...oppFormation.map(pos => ({
        x: pos[0] * width, y: pos[1] * height, vx: 0, vy: 0, team: 'opp' as const, color: '#ef4444',
        baseX: pos[0] * width, baseY: pos[1] * height
      }))
    ];

    const ball = {
      x: width / 2,
      y: height / 2,
      targetPlayerIndex: Math.floor(Math.random() * players.length),
    };

    let animationFrame: number;

    // ── Static pitch markings ─────────────────────────────────────
    const drawPitch = () => {
      // Green background
      ctx.fillStyle = '#1a4a1a';
      ctx.fillRect(0, 0, width, height);

      // Alternating grass stripes
      const numStripes = 8;
      const sw = pw / numStripes;
      for (let i = 0; i < numStripes; i++) {
        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.07)';
          ctx.fillRect(mx + i * sw, my, sw, ph);
        }
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1;

      // Outer boundary
      ctx.strokeRect(mx, my, pw, ph);

      // Halfway line
      ctx.beginPath();
      ctx.moveTo(mx + pw / 2, my);
      ctx.lineTo(mx + pw / 2, my + ph);
      ctx.stroke();

      // Center circle (~9.15m radius / 52.5m half → ~12% of ph)
      const cr = Math.round(ph * 0.12);
      ctx.beginPath();
      ctx.arc(mx + pw / 2, my + ph / 2, cr, 0, Math.PI * 2);
      ctx.stroke();

      // Center spot
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.beginPath();
      ctx.arc(mx + pw / 2, my + ph / 2, 2, 0, Math.PI * 2);
      ctx.fill();

      // Penalty areas (16.5m / 105m deep, 40.3m / 68m wide)
      const paD = Math.round(pw * 0.157);
      const paH = Math.round(ph * 0.593);
      const paY = my + (ph - paH) / 2;
      ctx.strokeRect(mx, paY, paD, paH);
      ctx.strokeRect(mx + pw - paD, paY, paD, paH);

      // Goal areas (5.5m / 105m deep, 18.3m / 68m wide)
      const gaD = Math.round(pw * 0.052);
      const gaH = Math.round(ph * 0.269);
      const gaY = my + (ph - gaH) / 2;
      ctx.strokeRect(mx, gaY, gaD, gaH);
      ctx.strokeRect(mx + pw - gaD, gaY, gaD, gaH);

      // Penalty spots (11m / 105m from goal line)
      const ps = Math.round(pw * 0.105);
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.beginPath();
      ctx.arc(mx + ps, my + ph / 2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(mx + pw - ps, my + ph / 2, 2, 0, Math.PI * 2);
      ctx.fill();

      // Corner arcs (1m radius, ~5px for visibility)
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(mx, my, 5, 0, Math.PI / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(mx + pw, my, 5, Math.PI / 2, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(mx, my + ph, 5, Math.PI * 1.5, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(mx + pw, my + ph, 5, Math.PI, Math.PI * 1.5);
      ctx.stroke();

      // Goal posts (7.3m / 68m wide → ~10.7% of ph)
      const gW = Math.round(ph * 0.107);
      const gY = my + (ph - gW) / 2;
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.fillRect(0, gY, mx, gW);           // Left goal
      ctx.fillRect(mx + pw, gY, mx, gW);     // Right goal
    };

    const animate = () => {
      drawPitch();

      // ── Ball Physics ─────────────────────────────────────────────
      const target = players[ball.targetPlayerIndex];
      const dx = target.x - ball.x;
      const dy = target.y - ball.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 6) {
        const teammates = players.filter((_, idx) => idx !== ball.targetPlayerIndex);
        ball.targetPlayerIndex = players.indexOf(teammates[Math.floor(Math.random() * teammates.length)]);
      } else {
        const speed = Math.min(4, dist * 0.12);
        ball.x += (dx / dist) * speed;
        ball.y += (dy / dist) * speed;
      }

      // ── Player Movement ──────────────────────────────────────────
      players.forEach((p, idx) => {
        const distToBall = Math.sqrt((ball.x - p.x) ** 2 + (ball.y - p.y) ** 2);
        const isTarget = idx === ball.targetPlayerIndex;

        // Activity scales up when ball is nearby
        const activity = Math.max(0.35, 1.6 - distToBall / (width * 0.28));

        // Spring back to base position + random organic drift
        const dtx = p.baseX - p.x;
        const dty = p.baseY - p.y;
        p.x += dtx * 0.025 + (Math.random() - 0.5) * 1.1 * activity;
        p.y += dty * 0.025 + (Math.random() - 0.5) * 1.1 * activity;

        // Ball target makes a slight run toward the ball
        if (isTarget) {
          p.x += (ball.x - p.x) * 0.025;
          p.y += (ball.y - p.y) * 0.025;
        }

        // Clamp within pitch
        p.x = Math.max(mx + 4, Math.min(mx + pw - 4, p.x));
        p.y = Math.max(my + 4, Math.min(my + ph - 4, p.y));

        // Draw player
        ctx.fillStyle = p.color;
        ctx.shadowBlur = isTarget ? 10 : 0;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, isTarget ? 7 : 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // ── Ball ─────────────────────────────────────────────────────
      ctx.fillStyle = '#facc15';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#facc15';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      animationFrame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [showFinal]);

  useEffect(() => {
    if (showFinal) return;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      let currentEvent = matchEvents[0];
      for (let i = matchEvents.length - 1; i >= 0; i--) {
        if (elapsed >= matchEvents[i].trigger) {
          currentEvent = matchEvents[i];
          break;
        }
      }
      setCommentary(currentEvent.text);
      if (elapsed >= 5) {
        clearInterval(timer);
        setTimeout(() => setShowFinal(true), 400);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [showFinal, matchEvents]);

  if (showFinal) {
    return (
      <div className="relative premium-glass p-5 slanted-container w-full max-w-[280px] border-white/10 shadow-2xl bg-black/95 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between w-full gap-2 mb-6">
          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <Shield className="w-6 h-6 text-primary" />
            <div className="text-[11px] font-headline font-black uppercase text-center truncate w-full tracking-tight text-white">{userTeam}</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-3xl font-headline font-black italic tracking-tighter flex items-center gap-2 mb-1">
              <span className={cn(result === 'win' ? "text-accent" : "text-white")}>{score.user}</span>
              <span className="text-white/20">-</span>
              <span className={cn(result === 'loss' ? "text-destructive" : "text-white")}>{score.opp}</span>
            </div>
            <div className={cn(
              "text-[8px] font-headline font-black uppercase px-2.5 py-0.5 tracking-widest rounded-full",
              result === 'win' ? "bg-green-600/80 text-white" : result === 'draw' ? "bg-white/10 text-white/60" : "bg-red-600/80 text-white"
            )}>
              {result === 'win' ? "WON" : result === 'draw' ? "DRAW" : "LOST"}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <Target className="w-6 h-6 text-destructive" />
            <div className="text-[11px] font-headline font-black uppercase text-center truncate w-full tracking-tight text-white">{opponentTeam}</div>
          </div>
        </div>
        <SlantedButton onClick={onComplete} className="w-full py-2.5 text-[9px] font-black tracking-[0.2em] bg-white text-black uppercase">
          PROCEED TO NEXT MATCH
        </SlantedButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full h-full justify-center px-4">
      <div className="relative premium-glass p-0.5 slanted-container w-full max-w-[300px] aspect-[4/3] border-white/10 overflow-hidden shadow-inner">
        <canvas ref={canvasRef} width={300} height={225} className="w-full h-full" />
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
    </div>
  );
};
