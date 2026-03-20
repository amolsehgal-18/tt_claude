"use client"

import React, { useState, useRef } from 'react';
import { AiScenarioPresentationOutput } from '@/ai/flows/ai-scenario-presentation-flow';
import { cn } from '@/lib/utils';

interface SwipeCardProps {
  scenario: AiScenarioPresentationOutput;
  onDecision: (side: 'left' | 'right') => void;
  timeLeft: number;
  cardsToNextMatch?: number;
  isConsequence?: boolean;
}

export const SwipeCard = ({ scenario, onDecision, timeLeft, cardsToNextMatch, isConsequence }: SwipeCardProps) => {
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

  return (
    <div
      className="relative w-full max-w-[340px] cursor-grab active:cursor-grabbing px-1"
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
          {/* ── Consequence banner ── */}
          {isConsequence && (
            <div className="flex items-center gap-1.5 px-3 py-1.5"
              style={{ background: 'linear-gradient(90deg,rgba(251,177,60,0.18),rgba(251,177,60,0.04))', borderBottom: '1px solid rgba(251,177,60,0.25)' }}>
              <span className="text-[9px] font-headline font-black uppercase tracking-[2px]" style={{ color: '#FBB13C' }}>
                ⚡ CONSEQUENCE — A past decision comes back to haunt you
              </span>
            </div>
          )}

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

          </div>

          {/* ── Card body ── */}
          <div className="px-3 pt-[10px] pb-[10px]">
            {/* Scenario text — 17px, 800 weight */}
            <p
              className="font-headline font-black text-white leading-snug mb-1"
              style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '0.2px' }}
            >
              {scenario.scenario}
            </p>

            {/* ── Impact chips — right-swipe preview (Board / Fans / Squad only) ── */}
            <div className="flex gap-1.5 flex-wrap mt-1">
              {scenario.impactRight.board !== 0 && (
                <span className="text-[10px] font-headline font-bold px-1.5 py-[1px] rounded-full border"
                  style={scenario.impactRight.board > 0
                    ? { background: 'rgba(30,107,60,0.10)',  borderColor: 'rgba(30,107,60,0.25)',  color: '#1E6B3C' }
                    : { background: 'rgba(216,17,89,0.10)',  borderColor: 'rgba(216,17,89,0.25)',  color: '#D81159' }}>
                  {scenario.impactRight.board > 0 ? '+' : '−'}Board
                </span>
              )}
              {scenario.impactRight.fans !== 0 && (
                <span className="text-[10px] font-headline font-bold px-1.5 py-[1px] rounded-full border"
                  style={scenario.impactRight.fans > 0
                    ? { background: 'rgba(30,107,60,0.10)',  borderColor: 'rgba(30,107,60,0.25)',  color: '#1E6B3C' }
                    : { background: 'rgba(216,17,89,0.10)',  borderColor: 'rgba(216,17,89,0.25)',  color: '#D81159' }}>
                  {scenario.impactRight.fans > 0 ? '+' : '−'}Fans
                </span>
              )}
              {scenario.impactRight.squad !== 0 && (
                <span className="text-[10px] font-headline font-bold px-1.5 py-[1px] rounded-full border"
                  style={scenario.impactRight.squad > 0
                    ? { background: 'rgba(30,107,60,0.10)',  borderColor: 'rgba(30,107,60,0.25)',  color: '#1E6B3C' }
                    : { background: 'rgba(216,17,89,0.10)',  borderColor: 'rgba(216,17,89,0.25)',  color: '#D81159' }}>
                  {scenario.impactRight.squad > 0 ? '+' : '−'}Squad
                </span>
              )}
            </div>

            {/* Card counter to next match */}
            {cardsToNextMatch !== undefined && cardsToNextMatch > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <span className="text-[8px] font-code uppercase tracking-[2px]"
                  style={{ color: cardsToNextMatch === 1 ? '#D81159' : 'rgba(255,255,255,0.22)' }}>
                  {cardsToNextMatch === 1 ? '⚡ NEXT CARD = MATCHDAY' : `${cardsToNextMatch} cards to matchday`}
                </span>
                <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
              </div>
            )}

            {/* Option cards — amber glow on active swipe, dim idle */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {/* Left option */}
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl border text-center transition-all duration-150 select-none",
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
                <div className={cn("font-headline font-black text-[11px] leading-snug transition-colors duration-150", isLeft ? "text-white" : "text-white/50")}>
                  {scenario.leftOption}
                </div>
              </div>

              {/* Right option */}
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl border text-center transition-all duration-150 select-none",
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
                <div className={cn("font-headline font-black text-[11px] leading-snug transition-colors duration-150", isRight ? "text-white" : "text-white/50")}>
                  {scenario.rightOption}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
