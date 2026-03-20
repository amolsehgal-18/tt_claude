import React from 'react';
import { ManagerMood } from '@/lib/game-logic';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// Badge colours per mood
const MOOD_STYLES: Record<ManagerMood, { bg: string; color: string; border: string }> = {
  happy:    { bg: 'rgba(33,131,128,0.15)',  color: '#218380', border: 'rgba(33,131,128,0.35)'  },
  neutral:  { bg: 'rgba(251,177,60,0.12)',  color: '#FBB13C', border: 'rgba(251,177,60,0.35)'  },
  stressed: { bg: 'rgba(143,45,86,0.15)',   color: '#8F2D56', border: 'rgba(143,45,86,0.4)'    },
  angry:    { bg: 'rgba(216,17,89,0.15)',   color: '#D81159', border: 'rgba(216,17,89,0.4)'    },
  sacked:   { bg: 'rgba(60,60,60,0.15)',    color: '#666',    border: 'rgba(100,100,100,0.3)'   },
};

// Ring constants — fits snugly around the 92px portrait
const RING_R    = 48;
const RING_CIRC = 2 * Math.PI * RING_R; // ≈ 301.6

interface ManagerMoodViewProps {
  mood: ManagerMood;
  timeLeft?: number; // 1–15 when active, undefined = no timer
}

export const ManagerMoodView = ({ mood, timeLeft }: ManagerMoodViewProps) => {
  const image       = PlaceHolderImages.find(img => img.id === `manager-${mood}`) || PlaceHolderImages[1];
  const badge       = MOOD_STYLES[mood] ?? MOOD_STYLES.neutral;
  const timerUrgent = timeLeft !== undefined && timeLeft <= 5;
  const ringOffset  = timeLeft !== undefined ? RING_CIRC * (1 - timeLeft / 15) : 0;

  // Ring colour: urgent = crimson, normal = amber, no timer = subtle white
  const ringStroke  = timeLeft === undefined
    ? 'rgba(255,255,255,0.12)'
    : timerUrgent ? '#D81159' : '#FBB13C';

  return (
    <div className="flex flex-col items-center gap-1 bg-transparent">
      {/* Portrait with timer ring */}
      <div className="relative w-[92px] h-[92px]">

        {/* SVG timer ring — sits on top of the portrait */}
        <svg
          className="absolute pointer-events-none"
          style={{ inset: '-5px', width: 'calc(100% + 10px)', height: 'calc(100% + 10px)', transform: 'rotate(-90deg)', zIndex: 2 }}
          viewBox="0 0 102 102"
          fill="none"
        >
          {/* Track */}
          <circle cx={51} cy={51} r={RING_R} stroke="rgba(255,255,255,0.07)" strokeWidth={2.5} fill="none" />
          {/* Progress arc */}
          <circle
            cx={51} cy={51} r={RING_R}
            fill="none"
            stroke={ringStroke}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={RING_CIRC}
            strokeDashoffset={ringOffset}
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
          />
        </svg>

        {/* Portrait */}
        <div
          className="relative w-full h-full rounded-full border border-white/10 overflow-hidden bg-black/20 shadow-2xl"
          style={{ zIndex: 1 }}
        >
          <Image
            src={image.imageUrl}
            alt={`Manager status: ${mood}`}
            fill
            unoptimized
            className="object-cover transition-opacity duration-700"
            data-ai-hint={image.imageHint}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-50" />
        </div>
      </div>

      {/* Mood badge */}
      <div
        key={mood}
        className="text-[9px] font-headline font-black uppercase tracking-[2px] px-2 py-[2px] rounded animate-in fade-in zoom-in-95 duration-300"
        style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
      >
        {mood}
      </div>
    </div>
  );
};
