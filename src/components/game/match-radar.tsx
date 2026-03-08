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

    const width = canvas.width;
    const height = canvas.height;

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

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Pitch Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.strokeRect(5, 5, width - 10, height - 10);
      ctx.beginPath();
      ctx.moveTo(width/2, 5);
      ctx.lineTo(width/2, height - 5);
      ctx.stroke();

      // Ball Physics - High-Speed Target-Based Passing
      const target = players[ball.targetPlayerIndex];
      const dx = target.x - ball.x;
      const dy = target.y - ball.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 8) {
        const teammates = players.filter((_, idx) => idx !== ball.targetPlayerIndex);
        ball.targetPlayerIndex = players.indexOf(teammates[Math.floor(Math.random() * teammates.length)]);
      } else {
        const speed = 15; 
        ball.x += (dx / dist) * speed;
        ball.y += (dy / dist) * speed;
      }

      // Player Movement - Drifting
      players.forEach((p) => {
        const dtx = p.baseX - p.x;
        const dty = p.baseY - p.y;
        p.x += dtx * 0.05 + (Math.random() - 0.5) * 1.5;
        p.y += dty * 0.05 + (Math.random() - 0.5) * 1.5;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Render High-Visibility Yellow Ball
      ctx.fillStyle = '#facc15'; 
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#facc15';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#000';
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
      <div className="relative premium-glass p-0.5 slanted-container w-full max-w-[300px] aspect-[4/3] border-white/10 overflow-hidden bg-black/40 shadow-inner">
        <canvas ref={canvasRef} width={300} height={225} className="w-full h-full rounded" />
        <div className="absolute top-2 right-2">
           <div className="text-[9px] font-headline text-accent/80 uppercase font-black tracking-widest italic animate-pulse">
            LIVE SIMULATION
          </div>
        </div>
      </div>
      <div className="w-full max-w-[300px] text-center min-h-[32px] flex items-center justify-center">
        <span className="text-[11px] font-headline font-black uppercase tracking-tight text-white/90 italic leading-tight">
          {commentary}
        </span>
      </div>
    </div>
  );
};
