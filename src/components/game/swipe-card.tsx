"use client"

import React, { useState, useRef } from 'react';
import { AiScenarioPresentationOutput } from '@/ai/flows/ai-scenario-presentation-flow';
import { SlantedContainer } from './slanted-elements';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SwipeCardProps {
  scenario: AiScenarioPresentationOutput;
  onDecision: (side: 'left' | 'right') => void;
}

export const SwipeCard = ({ scenario, onDecision }: SwipeCardProps) => {
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

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragX > 60) {
      onDecision('right');
    } else if (dragX < -60) {
      onDecision('left');
    }
    setDragX(0);
  };

  const rotation = dragX / 10;
  const swipeProgress = Math.min(Math.abs(dragX) / 15, 1);
  const isLeft = dragX < 0;
  const isRight = dragX > 0;

  return (
    <div 
      className="relative w-full max-w-[340px] h-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing px-2 py-0"
      onMouseMove={handleTouchMove}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="w-full transition-transform duration-200 ease-out select-none"
        style={{ 
          transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
          touchAction: 'none'
        }}
      >
        <SlantedContainer className={cn(
          "w-full bg-card min-h-[360px] flex flex-col justify-between border-2 transition-all relative group shadow-2xl p-5 pt-7",
          dragX < -15 ? "border-destructive shadow-[0_0_30px_rgba(239,68,68,0.4)]" : dragX > 15 ? "border-primary shadow-[0_0_30px_rgba(34,107,224,0.4)]" : "border-white/15"
        )}>
          {scenario.isBreaking && (
            <div className="absolute top-0 right-0 bg-destructive text-white text-[9px] font-headline px-4 py-1.5 z-20 skew-x-[-15deg] font-black tracking-widest uppercase">
              Urgent
            </div>
          )}

          <div className="space-y-4">
            <p className="text-[13px] leading-relaxed font-headline font-bold text-white tracking-tight">
              {scenario.scenario}
            </p>
          </div>

          <div className="mt-6 flex-1 flex flex-col justify-end">
            <div className="grid grid-cols-2 gap-3 h-28 relative">
              <div 
                className={cn(
                  "flex flex-col justify-center gap-1.5 p-3.5 rounded-lg border transition-all duration-200",
                  isLeft && dragX < -15 ? "bg-destructive border-white/50 scale-105 z-10" : "bg-white/10 border-transparent"
                )}
                style={{ opacity: isLeft ? 0.8 + (swipeProgress * 0.2) : 0.7 }}
              >
                <div className="flex items-center gap-1 text-white font-headline uppercase text-[10px] font-black italic">
                  <ChevronLeft className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-headline font-bold text-white leading-tight">
                  {scenario.leftOption}
                </div>
              </div>

              <div 
                className={cn(
                  "flex flex-col justify-center gap-1.5 p-3.5 rounded-lg border text-right transition-all duration-200",
                  isRight && dragX > 15 ? "bg-primary border-white/50 scale-105 z-10" : "bg-white/10 border-transparent"
                )}
                style={{ opacity: isRight ? 0.8 + (swipeProgress * 0.2) : 0.7 }}
              >
                <div className="flex items-center gap-1 justify-end text-white font-headline uppercase text-[10px] font-black italic">
                  <ChevronRight className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-headline font-bold text-white leading-tight">
                  {scenario.rightOption}
                </div>
              </div>
            </div>

            {Math.abs(dragX) < 15 && (
              <div className="text-center mt-6 flex items-center justify-center gap-3 animate-pulse opacity-30">
                <ChevronLeft className="w-4 h-4 text-destructive" />
                <span className="text-[9px] font-headline uppercase tracking-[0.4em] font-black">Decision Pull</span>
                <ChevronRight className="w-4 h-4 text-primary" />
              </div>
            )}
          </div>
        </SlantedContainer>
      </div>
    </div>
  );
};
