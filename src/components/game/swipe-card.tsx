"use client"

import React, { useState, useRef } from 'react';
import { AiScenarioPresentationOutput } from '@/ai/flows/ai-scenario-presentation-flow';
import { cn } from '@/lib/utils';

interface SwipeCardProps {
  scenario: AiScenarioPresentationOutput;
  onDecision: (side: 'left' | 'right') => void;
  timeLeft: number;
}

// Countdown ring: r=12, circumference ≈ 75.4 ≈ 76
const RING_CIRC = 76;

export const SwipeCard = ({ scenario, onDecision, timeLeft }: SwipeCardProps) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    startXRef.current = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const currentX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    setDragX(currentX - startXRef.current);
  };

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(40);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragX > 60) {
      triggerHaptic();
      onDecision('right');
    } else if (dragX < -60) {
      triggerHaptic();
      onDecision('left');
    }
    setDragX(0);
  };

  const rotation     = dragX / 10;
  const swipeAmt     = Math.abs(dragX);
  const isLeft       = dragX < -15;
  const isRight      = dragX > 15;

  // Countdown ring offset: 0 = full circle, RING_CIRC = empty
  const ringOffset   = RING_CIRC * (1 - (timeLeft / 15));
  const timerUrgent  = timeLeft <= 5;

  return (
    <div
      className="relative w-full max-w-[340px] h-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing px-1"
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ghost cards for depth */}
      <div className="absolute inset-x-3 bottom-2 rounded-[18px] border border-white/5" style={{ background: 'rgba(255,255,255,0.02)', transform: 'scale(0.88) translateY(16px) rotate(2deg)', zIndex: 0 }} />
      <div className="absolute inset-x-2 bottom-1 rounded-[18px] border border-white/5" style={{ background: 'rgba(255,255,255,0.02)', transform: 'scale(0.94) translateY(8px) rotate(-1.5deg)', zIndex: 1 }} />

      {/* Main card */}
      <div
        className="relative w-full select-none z-10"
        style={{
          transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          touchAction: 'none',
        }}
      >
        {/* Tint overlays */}
        <div className="absolute inset-0 rounded-[18px] pointer-events-none z-20 transition-opacity duration-75"
          style={{ background: 'rgba(255,92,92,0.18)', opacity: isLeft ? Math.min(swipeAmt / 110, 1) : 0, borderRadius: '18px' }} />
        <div className="absolute inset-0 rounded-[18px] pointer-events-none z-20 transition-opacity duration-75"
          style={{ background: 'rgba(30,107,60,0.18)', opacity: isRight ? Math.min(swipeAmt / 110, 1) : 0, borderRadius: '18px' }} />

        <div
          className="w-full overflow-hidden"
          style={{
            background: 'linear-gradient(150deg,#141820 0%,#0D1016 100%)',
            border: isLeft  ? '1px solid rgba(216,17,89,0.5)'  :
                    isRight ? '1px solid rgba(30,107,60,0.5)'  :
                              '1px solid rgba(255,255,255,0.11)',
            borderRadius: '18px',
            boxShadow: isLeft  ? '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(216,17,89,0.15)'  :
                        isRight ? '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(30,107,60,0.15)'  :
                                  '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(251,177,60,0.06), inset 0 1px 0 rgba(255,255,255,0.07)',
          }}
        >
          {/* ── Card topbar: BREAKING + countdown ring ── */}
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{
              background: 'linear-gradient(90deg,rgba(251,177,60,0.14),rgba(251,177,60,0.03))',
              borderBottom: '1px solid rgba(251,177,60,0.18)',
            }}
          >
            {/* BREAKING with pulsing dot */}
            <div className="flex items-center gap-1.5 font-headline font-black text-[10px] uppercase tracking-[2.5px]" style={{ color: '#FBB13C' }}>
              <div className="w-1.5 h-1.5 rounded-full blink-dot" style={{ background: '#FBB13C' }} />
              BREAKING
            </div>

            {/* Countdown ring */}
            <div className="relative w-[30px] h-[30px]">
              <svg width={30} height={30} viewBox="0 0 30 30" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
                <circle cx={15} cy={15} r={12} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={2.5} />
                <circle
                  cx={15} cy={15} r={12}
                  fill="none"
                  stroke={timerUrgent ? '#D81159' : '#FBB13C'}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRC}
                  strokeDashoffset={ringOffset}
                  style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
                />
              </svg>
              <div
                className="absolute inset-0 flex items-center justify-center font-code text-[10px] font-bold"
                style={{ color: timerUrgent ? '#D81159' : '#FBB13C' }}
              >
                {timeLeft}
              </div>
            </div>
          </div>

          {/* ── Card body ── */}
          <div className="px-4 pt-4 pb-3">
            {/* Scenario text — 23px, 800 weight */}
            <p
              className="font-headline font-black text-white leading-snug mb-1"
              style={{ fontSize: '23px', fontWeight: 800, letterSpacing: '0.2px' }}
            >
              {scenario.scenario}
            </p>

            {/* Option cards — amber glow on active swipe, dim idle */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {/* Left option */}
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-1 p-3 rounded-xl border text-center transition-all duration-150 select-none",
                  isLeft ? "scale-105" : ""
                )}
                style={{
                  background: isLeft ? 'rgba(251,177,60,0.22)' : 'rgba(251,177,60,0.04)',
                  borderColor: isLeft ? 'rgba(251,177,60,0.75)' : 'rgba(251,177,60,0.10)',
                  boxShadow: isLeft ? '0 0 12px rgba(251,177,60,0.18)' : 'none',
                  opacity: isRight ? 0.4 : 1,
                  pointerEvents: 'none',
                }}
              >
                <div className={cn("font-headline font-black text-[13px] leading-snug transition-colors duration-150", isLeft ? "text-white" : "text-white/50")}>
                  {scenario.leftOption}
                </div>
              </div>

              {/* Right option */}
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-1 p-3 rounded-xl border text-center transition-all duration-150 select-none",
                  isRight ? "scale-105" : ""
                )}
                style={{
                  background: isRight ? 'rgba(251,177,60,0.22)' : 'rgba(251,177,60,0.04)',
                  borderColor: isRight ? 'rgba(251,177,60,0.75)' : 'rgba(251,177,60,0.10)',
                  boxShadow: isRight ? '0 0 12px rgba(251,177,60,0.18)' : 'none',
                  opacity: isLeft ? 0.4 : 1,
                  pointerEvents: 'none',
                }}
              >
                <div className={cn("font-headline font-black text-[13px] leading-snug transition-colors duration-150", isRight ? "text-white" : "text-white/50")}>
                  {scenario.rightOption}
                </div>
              </div>
            </div>

            {/* Swipe hint when idle — white text, red ← and board-green → */}
            {swipeAmt < 15 && (
              <div className="text-center mt-3 flex items-center justify-center gap-1.5">
                <span className="font-headline font-black text-[11px]" style={{ color: '#D81159' }}>←</span>
                <span className="font-headline font-black text-[9px] uppercase tracking-[0.4em] text-white opacity-60">swipe to decide</span>
                <span className="font-headline font-black text-[11px]" style={{ color: '#1E6B3C' }}>→</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
