import React from 'react';
import { ManagerMood } from '@/lib/game-logic';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// Badge colours per mood (from tt_final_ui_v2.html)
const MOOD_STYLES: Record<ManagerMood, { bg: string; color: string; border: string }> = {
  happy:    { bg: 'rgba(33,131,128,0.15)',  color: '#218380', border: 'rgba(33,131,128,0.35)'  },
  neutral:  { bg: 'rgba(251,177,60,0.12)',  color: '#FBB13C', border: 'rgba(251,177,60,0.35)'  },
  stressed: { bg: 'rgba(143,45,86,0.15)',   color: '#8F2D56', border: 'rgba(143,45,86,0.4)'    },
  angry:    { bg: 'rgba(216,17,89,0.15)',   color: '#D81159', border: 'rgba(216,17,89,0.4)'    },
};

export const ManagerMoodView = ({ mood }: { mood: ManagerMood }) => {
  const image = PlaceHolderImages.find(img => img.id === `manager-${mood}`) || PlaceHolderImages[1];
  const badge = MOOD_STYLES[mood] ?? MOOD_STYLES.neutral;

  return (
    <div className="flex flex-col items-center gap-1 bg-transparent">
      {/* Portrait with plum mood-ring glow */}
      <div className="relative w-[56px] h-[56px]">
        {/* Rotating plum ring — sits behind the portrait */}
        <div
          className="absolute rounded-full mood-ring-spin"
          style={{
            inset: '-3px',
            background: 'conic-gradient(rgba(143,45,86,0.45) 0%, transparent 55%)',
            zIndex: 0,
          }}
        />
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

      {/* Mood badge — colour matches mood */}
      <div
        className="text-[9px] font-headline font-black uppercase tracking-[2px] px-2 py-[2px] rounded"
        style={{
          background: badge.bg,
          color: badge.color,
          border: `1px solid ${badge.border}`,
        }}
      >
        {mood}
      </div>
    </div>
  );
};
